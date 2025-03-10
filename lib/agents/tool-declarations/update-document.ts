import 'server-only';
import { z } from 'zod';
import {
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
} from 'ai';

import { getDocumentById, saveDocument } from '@/lib/db/queries';
import { accessModel } from '@/lib/ai/models';
import { getImageModel, getModel } from '@/lib/ai/models.server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import { getMessageFile, saveMessageFile } from '@/lib/services/minio';
import { validateUUID } from '@/lib/utils';

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
      .describe('The description of changes that need to be made'),
  }),
  execute: async (
    { id, description },
    context,
  ): Promise<DocumentExecuteReturn> => {
    const { dataStream, userId, agent, chat } = context;
    const document = await getDocumentById({ id });

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

    if (document.kind === 'text') {
      const { fullStream } = streamText({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: updateDocumentPrompt(currentContent, 'text'),
        experimental_transform: smoothStream({ chunking: 'line' }),
        prompt: description,
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
            thread_id: chat.id,
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
        system: updateDocumentPrompt(currentContent, 'code'),
        prompt: description,
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
            thread_id: chat.id,
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
        prompt: description,
        n: 1,
      });

      const name = await saveMessageFile(
        document.title,
        Buffer.from(image.uint8Array),
        chat.id,
        'document',
      );
      draftText = await getMessageFile(name, chat.id);
      dataStream.writeData({
        type: 'image-delta',
        content: draftText,
      });

      dataStream.writeData({ type: 'finish', content: '' });
    } else if (document.kind === 'sheet') {
      const { fullStream } = streamObject({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: updateDocumentPrompt(currentContent, 'sheet'),
        prompt: description,
        schema: z.object({
          csv: z.string(),
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'update-document-sheet',
          metadata: {
            user_id: userId,
            document_id: id,
            thread_id: chat.id,
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

    await saveDocument({
      id,
      userId,
      title: document.title,
      content: draftText,
      kind: document.kind,
    });

    return {
      id,
      title: document.title,
      kind: document.kind,
      error: null,
      content: 'The document has been updated successfully.',
    };
  },
});
