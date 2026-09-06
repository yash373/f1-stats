// Shared HTTP helper: timeout budgets + typed upstream errors.
// Every upstream fetch goes through here so a hung API can't hang a page.

export class UpstreamError extends Error {
  status?: number;
  retryAfterMs?: number;
  constructor(message: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 10000, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    throw new UpstreamError(
      `Upstream timeout after ${timeoutMs}ms for ${url}: ${(e as Error).message}`,
    );
  }
  if (!res.ok) {
    const retryAfter = Number(res.headers.get("retry-after")) * 1000;
    throw new UpstreamError(
      `Upstream ${res.status} for ${new URL(url).pathname}`,
      res.status,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }
  return (await res.json()) as T;
}
