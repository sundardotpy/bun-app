import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  // Also reports whether the upstream tokens are actually present in this
  // environment — the most common cause of "reports don't generate" on a fresh
  // deploy is a missing env var, and this makes that visible without leaking it.
  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    reportsTokenConfigured: Boolean(process.env.WINTWEALTH_AUTH_TOKEN),
    adminTokenConfigured: Boolean(process.env.WINTWEALTH_ADMIN_TOKEN || process.env.WINTWEALTH_AUTH_TOKEN),
  });
}
