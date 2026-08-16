import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fetchReportFile, parseDownloadUrl, safeFilename } from "../src/services/download";
import { guard } from "./_guard";

export default guard(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const rawName = Array.isArray(req.query.filename) ? req.query.filename[0] : req.query.filename;

  const url = parseDownloadUrl(rawUrl);
  if (!url) {
    return res.status(400).json({ success: false, message: "That download link is not allowed." });
  }

  let upstream;
  try {
    upstream = await fetchReportFile(url);
  } catch {
    return res.status(502).json({ success: false, message: "Could not fetch the report file." });
  }

  if (!upstream.ok || !upstream.body) {
    return res
      .status(502)
      .json({ success: false, message: "The report link has expired. Please generate it again." });
  }

  const filename = safeFilename(rawName);
  res.setHeader("Content-Type", upstream.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  if (upstream.contentLength) res.setHeader("Content-Length", upstream.contentLength);

  // Stream straight through — avoids buffering the whole workbook in memory and
  // sidesteps the serverless response size limit for buffered responses.
  await pipeline(Readable.fromWeb(upstream.body as any), res);
});
