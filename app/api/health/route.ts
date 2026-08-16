export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Reports whether the env vars actually reached the server, without leaking
  // their values — a missing token is the usual cause of reports failing on a
  // fresh deploy, and this makes it visible in one request.
  return Response.json({
    status: "ok",
    node: process.version,
    reportsTokenConfigured: Boolean(process.env.WINTWEALTH_AUTH_TOKEN),
    baseUrl: process.env.WINTWEALTH_BASE_URL || "https://elb.api.wintwealth.com (default)",
    agentId: process.env.AGENT_ID || "333 (default)",
  });
}
