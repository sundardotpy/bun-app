import type { VercelRequest, VercelResponse } from "@vercel/node";
import { guard } from "./_guard";

export default guard(async function handler(_req: VercelRequest, res: VercelResponse) {
  // Loading the report modules is the thing most likely to fail at runtime on a
  // serverless deploy (a dependency that did not get bundled, an import that did
  // not resolve). Doing it here, behind a try, turns an opaque
  // FUNCTION_INVOCATION_FAILED on /api/reports/generate into a readable answer.
  let modules: { loaded: boolean; error?: string } = { loaded: false };
  try {
    await import("../src/services/proxy");
    await import("../src/validate");
    modules = { loaded: true };
  } catch (err) {
    modules = { loaded: false, error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) };
  }

  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    node: process.version,
    // Whether the env var actually reached the function, without leaking it.
    reportsTokenConfigured: Boolean(process.env.WINTWEALTH_AUTH_TOKEN),
    baseUrl: process.env.WINTWEALTH_BASE_URL || "https://elb.api.wintwealth.com (default)",
    agentId: process.env.AGENT_ID || "333 (default)",
    modules,
  });
});
