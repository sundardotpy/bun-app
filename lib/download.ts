// Streams the generated report back through our own origin so the browser saves
// it as a file instead of navigating away to the upstream link.
//
// The URL arrives from the browser, so it is validated against a host allowlist
// before we fetch it — otherwise this would be an open proxy (SSRF).

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Suffix-matched: "wintwealth.com" also allows "elb.api.wintwealth.com".
function allowedHosts(): string[] {
  const extra = (process.env.DOWNLOAD_ALLOWED_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  return ["wintwealth.com", "amazonaws.com", hostOf(process.env.WINTWEALTH_BASE_URL || ""), ...extra].filter(
    (h): h is string => Boolean(h)
  );
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
  return allowedHosts().some((entry) => host === entry || host.endsWith(`.${entry}`)) ? url : null;
}

// Keeps the filename safe to interpolate into a Content-Disposition header.
export function safeFilename(raw: string | null | undefined, fallback = "report.xlsx"): string {
  const cleaned = (raw || "").replace(/[^A-Za-z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned.slice(0, 120) : fallback;
}

export const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
