import { getEndpoint } from "../config";
import type { ReportType } from "../types";

const REPORT_TYPE_TO_ENDPOINT_ID: Record<ReportType, string> = {
  master: "master-report",
  taxation: "taxation-report",
};

export function buildRequest(reportType: ReportType, userId: string) {
  const endpointId = REPORT_TYPE_TO_ENDPOINT_ID[reportType];
  const endpoint = getEndpoint(endpointId);
  if (!endpoint) {
    throw new Error(`No API collection entry configured for "${reportType}"`);
  }

  const url = new URL(endpoint.urlTemplate.replace(/{{\s*userId\s*}}/g, encodeURIComponent(userId)));
  for (const [key, value] of Object.entries(endpoint.queryParams)) {
    url.searchParams.set(key, value);
  }

  return {
    method: endpoint.method || "GET",
    url: url.toString(),
    headers: endpoint.headers,
  };
}
