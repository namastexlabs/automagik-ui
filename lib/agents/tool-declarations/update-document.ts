import 'server-only';
import { z } from 'zod';
import {
  convertToCoreMessages,
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
} from 'ai';

import { accessModel } from '@/lib/ai/models';
import { getImageModel, getModel } from '@/lib/ai/models.server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import { getMessageFile, saveMessageFile } from '@/lib/services/minio';
import { validateUUID } from '@/lib/utils';
import { createDocument, getDocument } from '@/lib/repositories/document';

import type { DocumentExecuteReturn } from '../types';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

const namedRefinements = {
  validateUUID: (id: string, ctx: z.RefinementCtx) => {
    if (!validateUUID(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid UUID',
      });
    }
  },
};

export const updateDocumentTool = createToolDefinition({
  name: InternalToolName.updateDocument,
  verboseName: 'Update Document',
  description: 'Update a document with the given description',
  visibility: 'public',
  namedRefinements,
  parameters: z.object({
    id: z
      .string()
      .superRefine(namedRefinements.validateUUID)
      .describe('The ID of the document to update'),
    description: z
      .string()
      .describe(
        'The description of changes, including the parts that need to be added, removed, or modified, new data, etc.',
      ),
  }),
  execute: async (
    { id, description },
    context,
  ): Promise<DocumentExecuteReturn> => {
    const { dataStream, userId, agent, chatId, userMessage, abortSignal } =
      context;
    const document = await getDocument(id, userId);

    if (!document) {
      return {
        error: 'Document not found',
      };
    }

    const { content: currentContent } = document;
    let draftText = '';

    dataStream.writeData({
      type: 'clear',
      content: document.title,
    });

    const newTextPart = {
      type: 'text',
      text: `Current content:\n\n${currentContent}\n\nChange the following:\n\n${description}`,
    } as const;

    const messages = convertToCoreMessages([
      {
        ...userMessage,
        content: `${userMessage.content}\n\n${newTextPart.text}`,
        parts: [...(userMessage.parts ?? []), newTextPart],
      },
    ]);

    if (document.kind === 'text') {
      const { fullStream } = streamText({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: updateDocumentPrompt('text'),
        experimental_transform: smoothStream({ chunking: 'word' }),
        messages,
        abortSignal,
        providerOptions: {
          openai: {
            prediction: {
              type: 'content',
              content: currentContent,
            },
          },
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'update-document-text',
          metadata: {
            user_id: userId,
            document_id: id,
            thread_id: chatId,
            agent_id: agent.id,
          },
        },
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'text-delta') {
          const { textDelta } = delta;

          draftText += textDelta;
          dataStream.writeData({
            type: 'text-delta',
            content: textDelta,
          });
        }
      }

      dataStream.writeData({ type: 'finish', content: '' });
    } else if (document.kind === 'code') {
      const { fullStream } = streamObject({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: updateDocumentPrompt('code'),
        messages,
        abortSignal,
        schema: z.object({
          code: z.string(),
        }),
        providerOptions: {
          openai: {
            prediction: {
              type: 'content',
              content: currentContent,
            },
          },
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'update-document-code',
          metadata: {
            user_id: userId,
            document_id: id,
            thread_id: chatId,
            agent_id: agent.id,
          },
        },
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'object') {
          const { object } = delta;
          const { code } = object;

          if (code) {
            dataStream.writeData({
              type: 'code-delta',
              content: code ?? '',
            });

            draftText = code;
          }
        }
      }

      dataStream.writeData({ type: 'finish', content: '' });
    } else if (document.kind === 'image') {
      const { image } = await experimental_generateImage({
        model: getImageModel('openai', 'dall-e-3'),
        prompt: messages.map((m) => m.content).join('\n\n'),
        n: 1,
        abortSignal,
      });

      const name = await saveMessageFile(
        document.title,
        Buffer.from(image.uint8Array),
        chatId,
        'document',
      );
      draftText = await getMessageFile(name, chatId);
      dataStream.writeData({
        type: 'image-delta',
        content: draftText,
      });

      dataStream.writeData({ type: 'finish', content: '' });
    } else if (document.kind === 'sheet') {
      const { fullStream } = streamObject({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: updateDocumentPrompt('sheet'),
        messages,
        abortSignal,
        schema: z.object({
          csv: z.string(),
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'update-document-sheet',
          metadata: {
            user_id: userId,
            document_id: id,
            thread_id: chatId,
            agent_id: agent.id,
          },
        },
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'object') {
          const { object } = delta;
          const { csv } = object;

          if (csv) {
            dataStream.writeData({
              type: 'sheet-delta',
              content: csv,
            });

            draftText = csv;
          }
        }
      }

      dataStream.writeData({ type: 'finish', content: '' });
    }

    if (!abortSignal.aborted) {
      await createDocument({
        id,
        userId,
        title: document.title,
        content: draftText,
        kind: document.kind,
      });
    }

    return {
      id,
      title: document.title,
      kind: document.kind,
      error: null,
      content: 'The document has been updated successfully.',
    };
  },
});
