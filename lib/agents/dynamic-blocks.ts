export function insertDynamicBlocksIntoPrompt(
  prompt: string,
  blocks: { name: string; content: string | null }[],
) {
  return blocks.reduce(
    (acc, block) => acc.replace(`{{${block.name}}}`, block.content || 'BLANK'),
    prompt,
  );
}

export function getDynamicBlocksFromPrompt(prompt: string) {
  const regex = /\{\{(.+?)\}\}/g;
  const matches: Set<string> = new Set();
  let match = regex.exec(prompt);

  while (match !== null) {
    matches.add(match[1].trim());
    match = regex.exec(prompt);
  }

  return Array.from(matches);
}
