import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listPublicActions } from "../../src/actions";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }
  return res.status(200).json({ actions: listPublicActions() });
}
