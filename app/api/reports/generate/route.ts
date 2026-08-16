import { generateReport, isReportType } from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // report generation upstream can be slow

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const input = (body ?? {}) as { reportType?: unknown; userId?: unknown };
  const userId = typeof input.userId === "string" ? input.userId.trim() : "";

  if (!isReportType(input.reportType) || userId.length === 0 || userId.length > 64) {
    return Response.json({ success: false, message: "Please enter a valid user ID." }, { status: 400 });
  }

  const result = await generateReport(input.reportType, userId);
  return Response.json(result);
}
