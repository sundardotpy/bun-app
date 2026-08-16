export type ReportType = "master" | "taxation";

export interface GenerateReportResponse {
  success: boolean;
  downloadUrl?: string;
  message: string;
  accountDeletionSuspected?: boolean;
}

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.");
  }

  // The API always answers with JSON. Anything else means the request never
  // reached a function (e.g. it fell through to the SPA's index.html), so say
  // that plainly instead of throwing an opaque JSON parse error.
  const text = await res.text();
  let data: unknown = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (data === null || typeof data !== "object") {
    throw new ApiError(
      res.status === 404
        ? "The API is not responding at /api. The deployment may be misconfigured."
        : `Unexpected response from the server (HTTP ${res.status}).`
    );
  }

  return data as T;
}

export function generateReport(reportType: ReportType, userId: string) {
  return request<GenerateReportResponse>("/reports/generate", {
    method: "POST",
    body: JSON.stringify({ reportType, userId }),
  });
}

// ---- Downloading ----

const REPORT_SLUG: Record<ReportType, string> = {
  master: "master-report",
  taxation: "taxation-report",
};

export function reportFilename(reportType: ReportType, userId: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${REPORT_SLUG[reportType]}-${userId}-${date}.xlsx`;
}

// Route the upstream file through our own origin. Same-origin + an attachment
// header means the browser saves the file instead of navigating away from the
// app (which is what a cross-origin link does when `download` is ignored).
export function downloadHref(url: string, filename: string): string {
  const params = new URLSearchParams({ url, filename });
  return `/api/download?${params.toString()}`;
}

export function triggerDownload(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = downloadHref(url, filename);
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
