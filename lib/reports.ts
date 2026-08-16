// Report generation. The upstream host and X-AUTH-TOKEN live here on the server
// and never reach the browser — the client only ever sees the resulting file URL.
// There is no database: environment variables are the single source of truth.

export type ReportType = "master" | "taxation";

export interface GenerateReportResult {
  success: boolean;
  downloadUrl?: string;
  message: string;
  accountDeletionSuspected?: boolean;
}

const PATH_BY_TYPE: Record<ReportType, string> = {
  master: "master-report",
  taxation: "taxation-report",
};

export function isReportType(value: unknown): value is ReportType {
  return value === "master" || value === "taxation";
}

function buildRequest(reportType: ReportType, userId: string) {
  const baseUrl = process.env.WINTWEALTH_BASE_URL || "https://elb.api.wintwealth.com";
  const agentId = process.env.AGENT_ID || "333";

  const url = new URL(`${baseUrl}/admin/users/${encodeURIComponent(userId)}/${PATH_BY_TYPE[reportType]}`);
  url.searchParams.set("agentId", agentId);

  return {
    url: url.toString(),
    headers: { "X-AUTH-TOKEN": process.env.WINTWEALTH_AUTH_TOKEN || "" },
  };
}

export async function generateReport(reportType: ReportType, userId: string): Promise<GenerateReportResult> {
  if (!process.env.WINTWEALTH_AUTH_TOKEN) {
    return { success: false, message: "Report API token is not configured on the server." };
  }

  let request: ReturnType<typeof buildRequest>;
  try {
    request = buildRequest(reportType, userId);
  } catch {
    // Only reachable if WINTWEALTH_BASE_URL is not a valid URL.
    return { success: false, message: "The report service is not configured correctly." };
  }

  let response: Response;
  try {
    response = await fetch(request.url, { method: "GET", headers: request.headers, cache: "no-store" });
  } catch {
    return { success: false, message: "Could not reach the report service. Please try again shortly." };
  }

  let body: { reportUrl?: string; message?: string; errorCode?: number; errorType?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.ok && body?.reportUrl) {
    return {
      success: true,
      downloadUrl: body.reportUrl,
      message: body.message || "Report generated successfully.",
    };
  }

  // A 500 from this endpoint usually means the account is mid-deletion rather
  // than that anything is actually broken, so it gets its own message.
  const isAccountDeletionSuspect =
    response.status === 500 && (body?.errorCode === 500 || body?.errorType === "INTERNAL_SERVER_ERROR");

  if (isAccountDeletionSuspect) {
    return {
      success: false,
      accountDeletionSuspected: true,
      message: "This user may have an account deletion request raised. Please verify before retrying.",
    };
  }

  return { success: false, message: "Something went wrong while generating the report. Please try again." };
}
