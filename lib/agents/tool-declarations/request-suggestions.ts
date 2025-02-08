import 'server-only';
import { z } from 'zod';
import { streamObject } from 'ai';

import { generateUUID } from '@/lib/utils';
import { getDocumentById, saveSuggestions } from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';

import type { DocumentExecuteReturn } from '../types';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import { myProvider } from '@/lib/ai/models';
import { suggestionPrompt } from '@/lib/ai/prompts';

export const requestSuggestionsTool = createToolDefinition({
  name: InternalToolName.requestSuggestions,
  verboseName: 'Request Suggestions',
  description: 'Request suggestions for a document',
  visibility: 'public',
  parameters: z.object({
    documentId: z.string().describe('The ID of the document to request edits'),
  }),
  execute: async ({ documentId }, context): Promise<DocumentExecuteReturn> => {
    const { dataStream, userId } = context;
    const document = await getDocumentById({ id: documentId });

    if (!document || !document.content) {
      return {
        error: 'Document not found',
      };
    }

    const suggestions: Array<
      Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
    > = [];

    const { elementStream } = streamObject({
      model: myProvider.languageModel('block-model'),
      system: suggestionPrompt,
      prompt: document.content,
      output: 'array',
      schema: z.object({
        originalSentence: z.string().describe('The original sentence'),
        suggestedSentence: z.string().describe('The suggested sentence'),
        description: z.string().describe('The description of the suggestion'),
      }),
    });

    for await (const element of elementStream) {
      const suggestion = {
        originalText: element.originalSentence,
        suggestedText: element.suggestedSentence,
        description: element.description,
        id: generateUUID(),
        documentId: documentId,
        isResolved: false,
      };

      dataStream.writeData({
        type: 'suggestion',
        content: suggestion,
      });

      suggestions.push(suggestion);
    }

    await saveSuggestions({
      suggestions: suggestions.map((suggestion) => ({
        ...suggestion,
        userId,
        createdAt: new Date(),
        documentCreatedAt: document.createdAt,
      })),
    });

    return {
      id: documentId,
      title: document.title,
      kind: document.kind,
      message: 'Suggestions have been added to the document',
    };
  },
});
