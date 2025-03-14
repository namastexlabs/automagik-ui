import { generateText, type CoreMessage } from 'ai';
import { accessModel } from './models';
import { getModel } from './models.server';

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreMessage;
}) {
  const { text: title } = await generateText({
    model: getModel(...accessModel('openai', 'gpt-4-turbo')),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}
