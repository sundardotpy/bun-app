import postgres from "postgres";
import type { ApiEndpointRecord } from "./types";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Point it at your Supabase connection string.");
}

// Supabase requires SSL. `require` uses TLS without verifying the cert chain,
// which is what Supabase's pooler/direct connections expect. For a local
// Postgres (docker) set DATABASE_SSL=disable.
const sslSetting = (process.env.DATABASE_SSL || "require").toLowerCase();
const ssl = sslSetting === "disable" || sslSetting === "false" ? false : "require";

const sql = postgres(DATABASE_URL, {
  ssl,
  max: Number(process.env.DATABASE_POOL_MAX || 5),
  idle_timeout: 20,
  connect_timeout: 15,
});

interface EndpointRow {
  id: string;
  name: string;
  method: string;
  url_template: string;
  query_params: Record<string, string> | null;
  headers: Record<string, string> | null;
  updated_at: Date | string;
}

function rowToRecord(row: EndpointRow): ApiEndpointRecord {
  return {
    id: row.id,
    name: row.name,
    method: row.method,
    urlTemplate: row.url_template,
    queryParams: row.query_params ?? {},
    headers: row.headers ?? {},
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function initDb(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS api_endpoints (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url_template TEXT NOT NULL,
      query_params JSONB NOT NULL DEFAULT '{}'::jsonb,
      headers JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await seedIfEmpty();
}

async function seedIfEmpty(): Promise<void> {
  const rows = await sql<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM api_endpoints`;
  if (rows[0].c > 0) return;

  const token = process.env.WINTWEALTH_AUTH_TOKEN || "yhojirGToF0t2EdUdO-XFA";

  await upsertEndpoint({
    id: "master-report",
    name: "Master Report",
    method: "GET",
    urlTemplate: "https://elb.api.wintwealth.com/admin/users/{{userId}}/master-report",
    queryParams: { agentId: "333" },
    headers: { "X-AUTH-TOKEN": token },
  });

  await upsertEndpoint({
    id: "taxation-report",
    name: "Taxation Report",
    method: "GET",
    urlTemplate: "https://elb.api.wintwealth.com/admin/users/{{userId}}/taxation-report",
    queryParams: { agentId: "333" },
    headers: { "X-AUTH-TOKEN": token },
  });
}

export async function listEndpoints(): Promise<ApiEndpointRecord[]> {
  const rows = await sql<EndpointRow[]>`SELECT * FROM api_endpoints ORDER BY name ASC`;
  return rows.map(rowToRecord);
}

export async function getEndpoint(id: string): Promise<ApiEndpointRecord | undefined> {
  const rows = await sql<EndpointRow[]>`SELECT * FROM api_endpoints WHERE id = ${id}`;
  return rows[0] ? rowToRecord(rows[0]) : undefined;
}

export async function upsertEndpoint(record: Omit<ApiEndpointRecord, "updatedAt">): Promise<ApiEndpointRecord> {
  await sql`
    INSERT INTO api_endpoints (id, name, method, url_template, query_params, headers, updated_at)
    VALUES (
      ${record.id},
      ${record.name},
      ${record.method},
      ${record.urlTemplate},
      ${sql.json(record.queryParams)},
      ${sql.json(record.headers)},
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      method = EXCLUDED.method,
      url_template = EXCLUDED.url_template,
      query_params = EXCLUDED.query_params,
      headers = EXCLUDED.headers,
      updated_at = now()
  `;
  return (await getEndpoint(record.id))!;
}

export async function deleteEndpoint(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM api_endpoints WHERE id = ${id}`;
  return result.count > 0;
}

export default sql;
