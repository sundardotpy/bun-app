import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateReport } from "../../src/services/proxy";
import { parseGenerateInput } from "../../src/validate";
import { readBody } from "../_body";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const parsed = parseGenerateInput(readBody(req));
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message });
  }

  if (!process.env.WINTWEALTH_AUTH_TOKEN) {
    return res.status(500).json({
      success: false,
      message: "Report API token is not configured on the server.",
    });
  }

  const result = await generateReport(parsed.value.reportType, parsed.value.userId);
  return res.status(200).json(result);
}
