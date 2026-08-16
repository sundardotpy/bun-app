import { parseDownloadUrl, safeFilename, XLSX_CONTENT_TYPE } from "@/lib/download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const target = parseDownloadUrl(searchParams.get("url"));
  if (!target) {
    return Response.json({ success: false, message: "That download link is not allowed." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), { cache: "no-store" });
  } catch {
    return Response.json({ success: false, message: "Could not fetch the report file." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { success: false, message: "The report link has expired. Please generate it again." },
      { status: 502 }
    );
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") || XLSX_CONTENT_TYPE,
    "Content-Disposition": `attachment; filename="${safeFilename(searchParams.get("filename"))}"`,
    "Cache-Control": "no-store",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  // Streamed straight through, so a large workbook is never buffered in memory.
  return new Response(upstream.body, { headers });
}
