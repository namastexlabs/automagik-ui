import 'server-only';
import { z } from 'zod';
import {
  experimental_generateImage,
  smoothStream,
  streamObject,
  streamText,
} from 'ai';

import { generateUUID } from '@/lib/utils';
import { saveDocument } from '@/lib/db/queries';

import type { DocumentExecuteReturn } from '../types';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import { codePrompt, sheetPrompt, textPrompt } from '@/lib/ai/prompts';
import { accessModel } from '@/lib/ai/models';
import { getImageModel, getModel } from '@/lib/ai/models.server';
import { getMessageFile, saveMessageFile } from '@/lib/services/minio';

export const createDocumentTool = createToolDefinition({
  name: InternalToolName.createDocument,
  verboseName: 'Create Document',
  description: 'Create a document for a writing activity.',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: z.object({
    title: z.string(),
    kind: z.enum(['text', 'code', 'image', 'sheet']),
  }),
  execute: async ({ title, kind }, context): Promise<DocumentExecuteReturn> => {
    const { dataStream, userId, chat, agent } = context;
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

    if (kind === 'text') {
      const { fullStream } = streamText({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: textPrompt,
        experimental_transform: smoothStream({ chunking: 'line' }),
        prompt: title,
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'create-document-text',
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
    } else if (kind === 'code') {
      const { fullStream } = streamObject({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: codePrompt,
        prompt: title,
        schema: z.object({
          code: z.string(),
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'create-document-code',
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
    } else if (kind === 'image') {
      const { image } = await experimental_generateImage({
        model: getImageModel('togetherai', 'stabilityai/stable-diffusion-xl-base-1.0'),
        prompt: title,
        n: 1,
      });

      const name = await saveMessageFile(
        title,
        Buffer.from(image.uint8Array),
        chat.id,
        'document'
      );
      draftText = await getMessageFile(name, chat.id);
      dataStream.writeData({
        type: 'image-delta',
        content: draftText,
      });

      dataStream.writeData({ type: 'finish', content: '' });
    } else if (kind === 'sheet') {
      const { fullStream } = streamObject({
        model: getModel(...accessModel('openai', 'gpt-4o-mini')),
        system: sheetPrompt,
        prompt: title,
        schema: z.object({
          csv: z.string().describe('CSV data'),
        }),
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'create-document-sheet',
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

      dataStream.writeData({
        type: 'sheet-delta',
        content: draftText,
      });

      dataStream.writeData({ type: 'finish', content: '' });
    }

    await saveDocument({
      id,
      title,
      kind,
      content: draftText,
      userId,
    });

    return {
      id,
      title,
      kind,
      error: null,
      content: 'A document was created and is now visible to the user.',
    };
  },
});
