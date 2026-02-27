export async function adminFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
  options?: { cacheKey?: string; ttlMs?: number },
): Promise<T> {
  const cacheKey = options?.cacheKey;
  const ttlMs = options?.ttlMs ?? 0;
  if (cacheKey && ttlMs > 0) {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { expiresAt: number; data: T };
        if (Date.now() < parsed.expiresAt) {
          return parsed.data;
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
  }

  const token = await getToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.method && init.method.toUpperCase() !== "GET"
        ? { "X-Idempotency-Key": crypto.randomUUID() }
        : {}),
      ...(init?.headers ?? {}),
    },
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || "Admin request failed");
  }
  if (cacheKey && ttlMs > 0) {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        expiresAt: Date.now() + ttlMs,
        data: json,
      }),
    );
  }
  return json as T;
}
