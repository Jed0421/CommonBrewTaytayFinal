// Retry only an explicit pre-execution JWT rejection, never ambiguous network/write errors.
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}

export function createClockSkewRetryFetch(
  fetcher: typeof fetch = globalThis.fetch,
  sleep: (ms: number, signal: AbortSignal) => Promise<void> = wait,
): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    if (!new URL(request.url).pathname.startsWith('/rest/v1/')) return fetcher(request);
    const delays = [1000, 2000, 4000];
    for (let attempt = 0; ; attempt++) {
      request.signal.throwIfAborted();
      const response = await fetcher(request.clone());
      if (response.status !== 401 || attempt === delays.length) return response;
      const error = await response.clone().json().catch(() => null);
      if (error?.code !== 'PGRST303' || error?.message !== 'JWT issued at future') return response;
      // No tokens, headers, request bodies or customer data are logged.
      console.warn('[Supabase] Temporary JWT clock mismatch; retry ' + (attempt + 1) + '/3.');
      await response.body?.cancel();
      await sleep(delays[attempt], request.signal);
    }
  };
}
