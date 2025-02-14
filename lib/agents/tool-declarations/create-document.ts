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

export const createDocumentTool = createToolDefinition({
  name: InternalToolName.createDocument,
  verboseName: 'Create Document',
  description: 'Create a document for a writing activity.',
  visibility: 'public',
  parameters: z.object({
    title: z.string(),
    kind: z.enum(['text', 'code', 'image', 'sheet']),
  }),
  execute: async ({ title, kind }, context): Promise<DocumentExecuteReturn> => {
    const { dataStream, userId } = context;
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
        experimental_transform: smoothStream({ chunking: 'word' }),
        prompt: title,
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
        model: getImageModel('openai', 'dall-e-3'),
        prompt: title,
        n: 1,
      });

      draftText = image.base64;

      dataStream.writeData({
        type: 'image-delta',
        content: image.base64,
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
      userId: userId,
    });

    return {
      id,
      title,
      kind,
      content: 'A document was created and is now visible to the user.',
    };
  },
});
