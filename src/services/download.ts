// Streams the generated report file back through our own origin so the browser
// always saves it as a file (Content-Disposition: attachment) instead of
// navigating away to the upstream/S3 link.
//
// The URL arrives from the browser, so it is validated against a host allowlist
// before we fetch it — otherwise this endpoint would be an open proxy (SSRF).

const BASE_URL = process.env.WINTWEALTH_BASE_URL || "https://elb.api.wintwealth.com";
const API_URL = process.env.WINTWEALTH_API_URL || "https://api.wintwealth.com";

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

// Suffix-matched: "wintwealth.com" allows "elb.api.wintwealth.com".
function allowedHosts(): string[] {
  const extra = (process.env.DOWNLOAD_ALLOWED_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  return [
    "wintwealth.com",
    "amazonaws.com",
    hostOf(BASE_URL),
    hostOf(API_URL),
    ...extra,
  ].filter((h): h is string => Boolean(h));
}

export function parseDownloadUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  const allowed = allowedHosts().some((entry) => host === entry || host.endsWith(`.${entry}`));
  return allowed ? url : null;
}

// Keeps the filename safe for a Content-Disposition header.
export function safeFilename(raw: string | null | undefined, fallback = "report.xlsx"): string {
  const cleaned = (raw || "").replace(/[^A-Za-z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned.slice(0, 120) : fallback;
}

export const DEFAULT_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export interface UpstreamFile {
  ok: boolean;
  status: number;
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
  contentLength: string | null;
}

export async function fetchReportFile(url: URL): Promise<UpstreamFile> {
  const response = await fetch(url.toString());
  return {
    ok: response.ok,
    status: response.status,
    body: response.body,
    contentType: response.headers.get("content-type") || DEFAULT_CONTENT_TYPE,
    contentLength: response.headers.get("content-length"),
  };
}
