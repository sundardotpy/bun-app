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
    credentials: "include",
  });
  return (await res.json()) as T;
}

export function generateReport(reportType: ReportType, userId: string) {
  return request<GenerateReportResponse>("/reports/generate", {
    method: "POST",
    body: JSON.stringify({ reportType, userId }),
  });
}

export function adminLogin(username: string, password: string) {
  return request<{ success: boolean; message?: string }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function adminLogout() {
  return request<{ success: boolean }>("/admin/logout", { method: "POST" });
}

export function adminMe() {
  return request<{ authenticated: boolean }>("/admin/me");
}

export interface ApiEndpoint {
  id: string;
  name: string;
  method: string;
  urlTemplate: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  updatedAt: string;
}

export function listEndpoints() {
  return request<{ success: boolean; endpoints: ApiEndpoint[] }>("/admin/endpoints");
}

export function createEndpoint(endpoint: ApiEndpoint) {
  return request<{ success: boolean; endpoint?: ApiEndpoint; message?: string }>("/admin/endpoints", {
    method: "POST",
    body: JSON.stringify(endpoint),
  });
}

export function updateEndpoint(id: string, endpoint: Omit<ApiEndpoint, "id" | "updatedAt">) {
  return request<{ success: boolean; endpoint?: ApiEndpoint; message?: string }>(`/admin/endpoints/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(endpoint),
  });
}

export function deleteEndpoint(id: string) {
  return request<{ success: boolean; message?: string }>(`/admin/endpoints/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
