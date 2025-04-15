addEventListener('message', async (event) => {
  try {
    const { encode } = await import('gpt-tokenizer');
    const tokens = encode(event.data as string);
    postMessage(tokens.length);
  } catch (error) {
    postMessage({ error: (error as Error).message });
  }
});

