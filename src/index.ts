import { join, normalize } from "node:path";
import { z } from "zod";
import { generateReport } from "./services/proxy";
import { json, readJson } from "./http";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

const generateSchema = z.object({
  reportType: z.enum(["master", "taxation"]),
  userId: z.string().trim().min(1).max(64),
});

async function reportsGenerate(req: Request): Promise<Response> {
  const parsed = generateSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return json({ success: false, message: "Please enter a valid user ID." }, { status: 400 });
  }
  const { reportType, userId } = parsed.data;
  return json(await generateReport(reportType, userId));
}

async function handleApi(req: Request, pathname: string, method: string): Promise<Response> {
  if (pathname === "/api/health" && method === "GET") return json({ status: "ok" });
  if (pathname === "/api/reports/generate" && method === "POST") return reportsGenerate(req);
  return json({ success: false, message: "Not found" }, { status: 404 });
}

// ---- Static file serving with SPA fallback ----
async function serveStatic(pathname: string): Promise<Response> {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(PUBLIC_DIR, relative === "/" ? "index.html" : relative);

  // Never allow escaping the public directory.
  if (!candidate.startsWith(PUBLIC_DIR)) {
    return new Response("Forbidden", { status: 403 });
  }

  const file = Bun.file(candidate);
  if (await file.exists()) {
    return new Response(file);
  }

  // SPA fallback for unknown non-API paths.
  const index = Bun.file(join(PUBLIC_DIR, "index.html"));
  if (await index.exists()) {
    return new Response(index, { headers: { "Content-Type": "text/html" } });
  }
  return new Response("Not found", { status: 404 });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname.startsWith("/api/")) {
      return handleApi(req, pathname, req.method);
    }
    return serveStatic(pathname);
  },
});

console.log(`report-downloader (bun) listening on port ${server.port}`);
