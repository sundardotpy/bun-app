export interface ApiEndpointRecord {
  id: string;
  name: string;
  method: string;
  urlTemplate: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  updatedAt: string;
}

export type ReportType = "master" | "taxation";

export interface GenerateReportResult {
  success: boolean;
  downloadUrl?: string;
  message: string;
  accountDeletionSuspected?: boolean;
}
