let worker: Worker;

export async function getTokenCount(text: string, abort: boolean) {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url));
  }

  return new Promise<{ result: number | null; error: Error | null } | undefined>(
    (resolve, reject) => {
      if (!worker) {
        resolve({ result: text.length, error: null });
        return;
      }

      worker.postMessage(text);
      worker.addEventListener('message', (event) => {
        if (!abort) {
          resolve({ result: event.data as number, error: null });
        }
      });
      worker.addEventListener('error', (event) => {
        if (!abort) {
          reject({ result: null, error: event });
        }
      });
    },
  );
}
