const cacheMap = new Map<string | Request | URL, unknown>();
type FetcherRequestInit = RequestInit & { reload?: boolean };

export async function fetcher<T>(
    input: RequestInfo | URL,
    { reload = false, ...init }: FetcherRequestInit = {},
): Promise<T | null> {
    if (cacheMap.has(input) && !reload) return cacheMap.get(input) as T;
    const response = await fetch(input, init);
    if (response.redirected) return null;
    if (response.status < 200 || response.status > 300) {
        throw new Error(`${response.status}: (${await response.text()})`);
    }
    const data = await response.json();
    init.method?.toLowerCase() === "get" && cacheMap.set(input, data);
    return data as T;
}
export function createTimeoutSignal(timeout: number) {
    const abortController = new AbortController();
    const abort = () => (abortController.abort(), timeoutId = null);
    let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(abort, timeout);
    return {
        clear: () => (timeoutId && clearTimeout(timeoutId), abort()),
        signal: abortController.signal,
    };
}
