import { join, normalize } from "node:path";
import { generateReport } from "./services/proxy";
import { fetchReportFile, parseDownloadUrl, safeFilename } from "./services/download";
import { parseGenerateInput } from "./validate";
import { json, readJson } from "./http";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

async function reportsGenerate(req: Request): Promise<Response> {
  const parsed = parseGenerateInput(await readJson(req));
  if (!parsed.ok) {
    return json({ success: false, message: parsed.message }, { status: 400 });
  }
  const { reportType, userId } = parsed.value;
  return json(await generateReport(reportType, userId));
}

// Mirrors api/download.ts so local dev behaves like the Vercel deployment.
async function reportDownload(url: URL): Promise<Response> {
  const target = parseDownloadUrl(url.searchParams.get("url"));
  if (!target) {
    return json({ success: false, message: "That download link is not allowed." }, { status: 400 });
  }

  let upstream;
  try {
    upstream = await fetchReportFile(target);
  } catch {
    return json({ success: false, message: "Could not fetch the report file." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return json(
      { success: false, message: "The report link has expired. Please generate it again." },
      { status: 502 }
    );
  }

  const filename = safeFilename(url.searchParams.get("filename"));
  const headers: Record<string, string> = {
    "Content-Type": upstream.contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
  if (upstream.contentLength) headers["Content-Length"] = upstream.contentLength;

  return new Response(upstream.body, { headers });
}

async function handleApi(req: Request, url: URL, method: string): Promise<Response> {
  const { pathname } = url;

  if (pathname === "/api/health" && method === "GET") {
    return json({
      status: "ok",
      runtime: "bun",
      reportsTokenConfigured: Boolean(process.env.WINTWEALTH_AUTH_TOKEN),
    });
  }
  if (pathname === "/api/reports/generate" && method === "POST") return reportsGenerate(req);
  if (pathname === "/api/download" && method === "GET") return reportDownload(url);

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
      return handleApi(req, url, req.method);
    }
    return serveStatic(pathname);
  },
});

console.log(`report-downloader (bun) listening on port ${server.port}`);
