import { buildRequest } from "./collection";
import type { GenerateReportResult, ReportType } from "../types";

export async function generateReport(reportType: ReportType, userId: string): Promise<GenerateReportResult> {
  let request;
  try {
    request = await buildRequest(reportType, userId);
  } catch {
    return { success: false, message: "This report type is not configured yet." };
  }

  let response: Response;
  try {
    response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
    });
  } catch {
    return { success: false, message: "Could not reach the report service. Please try again shortly." };
  }

  let body: any = null;
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

  const isAccountDeletionSuspect =
    response.status === 500 && (body?.errorCode === 500 || body?.errorType === "INTERNAL_SERVER_ERROR");

  if (isAccountDeletionSuspect) {
    return {
      success: false,
      accountDeletionSuspected: true,
      message: "This user may have an account deletion request raised. Please verify before retrying.",
    };
  }

  return {
    success: false,
    message: "Something went wrong while generating the report. Please try again.",
  };
}
