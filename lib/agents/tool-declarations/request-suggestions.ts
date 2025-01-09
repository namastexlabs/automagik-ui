import 'server-only';
import { z } from 'zod';
import { streamObject } from 'ai';

import { generateUUID } from '@/lib/utils';
import { customModel } from '@/lib/ai';
import { getDocumentById, saveSuggestions } from '@/lib/db/queries';
import type { Suggestion } from '@/lib/db/schema';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

const SUGGESTION_PROMPT = `\
You are a help writing assistant.
Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change.
It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.
`;

export const requestSuggestionsTool = createToolDefinition({
  name: InternalToolName.requestSuggestions,
  verboseName: 'Request Suggestions',
  description: 'Request suggestions for a document',
  parameters: z.object({
    documentId: z.string().describe('The ID of the document to request edits'),
  }),
  execute: async (
    { documentId },
    context,
  ): Promise<
    | {
        id: string;
        title: string;
        kind: string;
        content: string;
      }
    | {
        error: string;
      }
  > => {
    const { streamingData, model, userId } = context;
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
      model: customModel(model.apiIdentifier),
      system: SUGGESTION_PROMPT,
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

      streamingData.append({
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
      content: 'Suggestions have been added to the document',
    };
  },
});
