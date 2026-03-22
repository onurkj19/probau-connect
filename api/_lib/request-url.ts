import type { VercelRequest } from "@vercel/node";

/**
 * Parse request URL without deprecated `url.parse` (Node DEP0169).
 */
export function getRequestUrl(req: VercelRequest): URL {
  const host = req.headers.host ?? "localhost";
  return new URL(req.url ?? "/", `https://${host}`);
}
