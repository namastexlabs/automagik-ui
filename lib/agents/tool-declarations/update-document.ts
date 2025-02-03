import 'server-only';
import { z } from 'zod';
import { streamObject, streamText } from 'ai';

import { customModel } from '@/lib/ai';
import { getDocumentById, saveDocument } from '@/lib/db/queries';

import type { DocumentExecuteReturn } from '../types';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

const updateDocumentPrompt = (currentContent: string | null) => `\
Update the following contents of the document based on the given prompt.

${currentContent}
`;

export const updateDocumentTool = createToolDefinition({
    name: InternalToolName.updateDocument,
    verboseName: 'Update Document',
    description: 'Update a document with the given description',
    parameters: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z
        .string()
        .describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }, context): Promise<DocumentExecuteReturn> => {
      const { streamingData, model, userId } = context;
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      const { content: currentContent } = document;
      let draftText = '';

      streamingData.writeData({
        type: 'clear',
        content: document.title,
      });

      if (document.kind === 'text') {
        const { fullStream } = streamText({
          model: customModel(model.apiIdentifier),
          system: updateDocumentPrompt(currentContent),
          prompt: description,
          experimental_providerMetadata: {
            openai: {
              prediction: {
                type: 'content',
                content: currentContent,
              },
            },
          },
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'text-delta') {
            const { textDelta } = delta;

            draftText += textDelta;
            streamingData.writeData({
              type: 'text-delta',
              content: textDelta,
            });
          }
        }

        streamingData.writeData({ type: 'finish', content: '' });
      } else if (document.kind === 'code') {
        const { fullStream } = streamObject({
          model: customModel(model.apiIdentifier),
          system: updateDocumentPrompt(currentContent),
          prompt: description,
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
              streamingData.writeData({
                type: 'code-delta',
                content: code ?? '',
              });

              draftText = code;
            }
          }
        }

        streamingData.writeData({ type: 'finish', content: '' });
      }

      await saveDocument({
        id,
        title: document.title,
        content: draftText,
        kind: document.kind,
        userId,
      });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      };
    },
  });
