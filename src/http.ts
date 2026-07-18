export function json(data: unknown, opts: { status?: number } = {}): Response {
  return new Response(JSON.stringify(data), {
    status: opts.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
