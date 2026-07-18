export function json(
  data: unknown,
  opts: { status?: number; cookies?: string[] } = {}
): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const cookie of opts.cookies ?? []) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(JSON.stringify(data), { status: opts.status ?? 200, headers });
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.get("cookie");
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
