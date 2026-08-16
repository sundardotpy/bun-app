import type { ApiEndpointRecord } from "./types";

// Report API config comes from environment variables (set them in Render / .env).
// There's no database and no admin UI — env vars are the single source of truth.
// No token is hardcoded so the repo carries no secrets; set WINTWEALTH_AUTH_TOKEN.
const TOKEN = process.env.WINTWEALTH_AUTH_TOKEN || "";
const AGENT_ID = process.env.AGENT_ID || "333";
const BASE_URL = process.env.WINTWEALTH_BASE_URL || "https://elb.api.wintwealth.com";

const store = new Map<string, ApiEndpointRecord>([
  [
    "master-report",
    {
      id: "master-report",
      name: "Master Report",
      method: "GET",
      urlTemplate: `${BASE_URL}/admin/users/{{userId}}/master-report`,
      queryParams: { agentId: AGENT_ID },
      headers: { "X-AUTH-TOKEN": TOKEN },
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "taxation-report",
    {
      id: "taxation-report",
      name: "Taxation Report",
      method: "GET",
      urlTemplate: `${BASE_URL}/admin/users/{{userId}}/taxation-report`,
      queryParams: { agentId: AGENT_ID },
      headers: { "X-AUTH-TOKEN": TOKEN },
      updatedAt: new Date().toISOString(),
    },
  ],
]);

export function getEndpoint(id: string): ApiEndpointRecord | undefined {
  return store.get(id);
}
