export type ReportType = "master" | "taxation";

export interface GenerateReportResponse {
  success: boolean;
  downloadUrl?: string;
  message: string;
  accountDeletionSuspected?: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  return (await res.json()) as T;
}

export function generateReport(reportType: ReportType, userId: string) {
  return request<GenerateReportResponse>("/reports/generate", {
    method: "POST",
    body: JSON.stringify({ reportType, userId }),
  });
}
