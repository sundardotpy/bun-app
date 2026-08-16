import type { VercelRequest, VercelResponse } from "@vercel/node";
import { executeAction } from "../../src/actions";
import { parseActionInput } from "../../src/validate";
import { readBody } from "../_body";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const raw = req.query.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) {
    return res.status(400).json({ success: false, message: "Unknown action." });
  }

  const parsed = parseActionInput(readBody(req));
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message });
  }

  const result = await executeAction(id, parsed.value);
  const status = result.success ? 200 : result.status && result.status >= 400 ? result.status : 400;
  return res.status(status).json(result);
}
