import type { VercelRequest } from "@vercel/node";

// Vercel parses JSON bodies for us, but only when the Content-Type is right.
// Fall back to parsing the raw string so a stray content type doesn't turn into
// a confusing 400. (Files prefixed with "_" are not deployed as functions.)
export function readBody(req: VercelRequest): unknown {
  const body = req.body;
  if (typeof body !== "string") return body ?? null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
