import 'server-only';
import { z } from 'zod';
import { streamObject, streamText } from 'ai';

import { generateUUID } from '@/lib/utils';
import { saveDocument } from '@/lib/db/queries';
import { customModel } from '@/lib/ai';

import type { DocumentExecuteReturn } from '../types';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

const CODE_PROMPT = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

\`\`\`python
# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
\`\`\`
`;

export const createDocumentTool = createToolDefinition({
    name: InternalToolName.createDocument,
    verboseName: 'Create Document',
    description: 'Create a document for a writing activity.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(['text', 'code']),
    }),
    execute: async ({ title, kind }, context): Promise<DocumentExecuteReturn> => {
      const { streamingData, model, userId } = context;
      const id = generateUUID();
      let draftText = '';

      streamingData.append({
        type: 'id',
        content: id,
      });

      streamingData.append({
        type: 'title',
        content: title,
      });

      streamingData.append({
        type: 'kind',
        content: kind,
      });

      streamingData.append({
        type: 'clear',
        content: '',
      });

      if (kind === 'text') {
        const { fullStream } = streamText({
          model: customModel(model.apiIdentifier),
          system:
            'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
          prompt: title,
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'text-delta') {
            const { textDelta } = delta;

            draftText += textDelta;
            streamingData.append({
              type: 'text-delta',
              content: textDelta,
            });
          }
        }

        streamingData.append({ type: 'finish', content: '' });
      } else if (kind === 'code') {
        const { fullStream } = streamObject({
          model: customModel(model.apiIdentifier),
          system: CODE_PROMPT,
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
              streamingData.append({
                type: 'code-delta',
                content: code ?? '',
              });

              draftText = code;
            }
          }
        }

        streamingData.append({ type: 'finish', content: '' });
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
        content: 'A document was created and is now visible to the user.',
      };
    },
  });
