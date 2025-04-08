import 'server-only';
import { z } from 'zod';
import {
  convertToCoreMessages,
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
} from 'ai';

import { generateUUID } from '@/lib/utils';
import { codePrompt, sheetPrompt, textPrompt } from '@/lib/ai/prompts';
import { accessModel } from '@/lib/ai/models';
import { getImageModel, getModel } from '@/lib/ai/models.server';
import { getMessageFile, saveMessageFile } from '@/lib/services/minio';
import { createDocument } from '@/lib/repositories/document';

import type { DocumentExecuteReturn } from '../types';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

export const createDocumentTool = createToolDefinition({
  name: InternalToolName.createDocument,
  verboseName: 'Create Document',
  description: 'Create a documents of different types.',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: z.object({
    title: z.string(),
    description: z.string(),
    kind: z.enum(['text', 'code', 'image', 'sheet']),
  }),
  execute: async (
    { title, description, kind },
    context,
  ): Promise<DocumentExecuteReturn> => {
    const { dataStream, userId, chatId, agent, userMessage, abortSignal } =
      context;
    const id = generateUUID();
    let draftText = '';

    dataStream.writeData({
      type: 'id',
      content: id,
    });

    dataStream.writeData({
      type: 'title',
      content: title,
    });

    dataStream.writeData({
      type: 'kind',
      content: kind,
    });

    dataStream.writeData({
      type: 'clear',
      content: '',
    });

    const newTextPart = {
      type: 'text',
      text: `# ${title}\n\n${description}`,
    } as const;

    const messages = convertToCoreMessages([
      {
        ...userMessage,
        content: `${userMessage.content}\n\n${newTextPart.text}`,
        parts: [...(userMessage.parts ?? []), newTextPart],
      },
    ]);

    if (kind === 'text') {
      const { fullStream } = streamText({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        abortSignal,
        system: textPrompt,
        messages,
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'create-document-text',
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
    } else if (kind === 'code') {
      const { fullStream } = streamObject({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: codePrompt,
        messages,
        abortSignal,
        schema: z.object({
          code: z.string(),
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'create-document-code',
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
    } else if (kind === 'image') {
      const { image } = await experimental_generateImage({
        model: getImageModel(
          'togetherai',
          'stabilityai/stable-diffusion-xl-base-1.0',
        ),
        abortSignal,
        prompt: `${messages.map((m) => m.content).join('\n\n')}`,
        n: 1,
      });

      const name = await saveMessageFile(
        title,
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
    } else if (kind === 'sheet') {
      const { fullStream } = streamObject({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: sheetPrompt,
        messages,
        abortSignal,
        schema: z.object({
          csv: z.string().describe('CSV data'),
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'create-document-sheet',
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

      dataStream.writeData({
        type: 'sheet-delta',
        content: draftText,
      });

      dataStream.writeData({ type: 'finish', content: '' });
    }

    if (!abortSignal.aborted) {
      await createDocument({
        id,
        title,
        kind,
        content: draftText,
        userId,
      });
    }

    return {
      id,
      title,
      kind,
      error: null,
      content: 'A document was created and is now visible to the user.',
    };
  },
});
