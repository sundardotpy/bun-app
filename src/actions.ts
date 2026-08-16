// Account modification / reset actions. The full request specs (real URLs,
// methods, token) live here server-side and are NEVER sent to the browser.
// Only safe metadata (name + input fields) is exposed via toPublicDescriptor.

// Admin actions authenticate with a DIFFERENT token than the reports endpoint
// (verified: the reports token returns 401 on these endpoints). Set
// WINTWEALTH_ADMIN_TOKEN in the environment; falls back to the reports token.
// No token is hardcoded so the repo carries no secrets.
const TOKEN = process.env.WINTWEALTH_ADMIN_TOKEN || process.env.WINTWEALTH_AUTH_TOKEN || "";
const AGENT_ID = process.env.AGENT_ID || "333";
const ELB = process.env.WINTWEALTH_BASE_URL || "https://elb.api.wintwealth.com";
const API = process.env.WINTWEALTH_API_URL || "https://api.wintwealth.com";

export type FieldType = "number" | "string";

export interface ActionField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  default?: string;
}

interface ActionSpec {
  id: string;
  name: string;
  method: "POST" | "PUT" | "DELETE";
  danger: boolean; // destructive (reset/delete) — frontend asks for confirmation
  urlTemplate: string; // full URL; {{field}} placeholders are substituted from fields
  staticQuery: Record<string, string>;
  queryFields: string[]; // field names appended as query params
  bodyFields: string[]; // field names sent in the JSON body
  fields: ActionField[];
}

const SPECS: ActionSpec[] = [
  {
    id: "acf-link",
    name: "ACF Link",
    method: "POST",
    danger: false,
    urlTemplate: `${API}/admin/kyc/account-closing-form`,
    staticQuery: { agentId: AGENT_ID },
    queryFields: [],
    bodyFields: ["userId", "accountClosureReason"],
    fields: [
      { name: "userId", label: "User ID", type: "number", placeholder: "e.g. 2340315" },
      {
        name: "accountClosureReason",
        label: "Account closure reason",
        type: "string",
        default: "Demat Account not required",
      },
    ],
  },
  {
    id: "nominee-reset",
    name: "Nominee Reset",
    method: "DELETE",
    danger: true,
    urlTemplate: `${ELB}/admin/kyc/users/{{userId}}/delete-nominee`,
    staticQuery: { agentId: AGENT_ID, product: "OBP" },
    queryFields: [],
    bodyFields: [],
    fields: [{ name: "userId", label: "User ID", type: "number", placeholder: "e.g. 2317373" }],
  },
  {
    id: "kyc-reset",
    name: "KYC Reset",
    method: "DELETE",
    danger: true,
    urlTemplate: `${ELB}/admin/kyc/users/{{userId}}/delete`,
    staticQuery: { agentId: AGENT_ID },
    queryFields: [],
    bodyFields: [],
    fields: [{ name: "userId", label: "User ID", type: "number", placeholder: "e.g. 68516" }],
  },
  {
    id: "form121-reset",
    name: "Form 121 reset",
    method: "DELETE",
    danger: true,
    urlTemplate: `${ELB}/admin/form15-submissions`,
    staticQuery: { agentId: AGENT_ID },
    queryFields: ["formId", "userId"],
    bodyFields: [],
    fields: [
      { name: "formId", label: "Form ID", type: "number", placeholder: "e.g. 133904" },
      { name: "userId", label: "User ID", type: "number", placeholder: "e.g. 1254209" },
    ],
  },
  {
    id: "sip-date",
    name: "SIP Date modification",
    method: "POST",
    danger: false,
    urlTemplate: `${ELB}/admin/sip/modify`,
    staticQuery: { agentId: AGENT_ID },
    queryFields: [],
    bodyFields: ["userId", "sipId", "dayOfMonth"],
    fields: [
      { name: "userId", label: "User ID", type: "number", placeholder: "e.g. 1758986" },
      { name: "sipId", label: "SIP ID", type: "number", placeholder: "e.g. 59563" },
      { name: "dayOfMonth", label: "Day of month", type: "number", placeholder: "1–28" },
    ],
  },
  {
    id: "sip-amount",
    name: "SIP Amount modification",
    method: "POST",
    danger: false,
    urlTemplate: `${ELB}/admin/sip/modify`,
    staticQuery: { agentId: AGENT_ID },
    queryFields: [],
    bodyFields: ["userId", "sipId", "amount"],
    fields: [
      { name: "userId", label: "User ID", type: "number", placeholder: "e.g. 1758986" },
      { name: "sipId", label: "SIP ID", type: "number", placeholder: "e.g. 59563" },
      { name: "amount", label: "Amount (₹)", type: "number", placeholder: "e.g. 30000" },
    ],
  },
];

const SPEC_BY_ID = new Map(SPECS.map((s) => [s.id, s]));

// Safe, browser-facing shape — no URLs, methods, query, or token.
export interface PublicAction {
  id: string;
  name: string;
  danger: boolean;
  fields: ActionField[];
}

export function listPublicActions(): PublicAction[] {
  return SPECS.map((s) => ({ id: s.id, name: s.name, danger: s.danger, fields: s.fields }));
}

export interface ActionResult {
  success: boolean;
  status?: number;
  message: string;
}

type CoercedFields = Record<string, string | number>;

// Validate + coerce raw field input against a spec. Returns an error string on failure.
function coerceFields(spec: ActionSpec, raw: unknown): { values: CoercedFields } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Please fill in all fields." };
  const input = raw as Record<string, unknown>;
  const values: CoercedFields = {};

  for (const field of spec.fields) {
    const rawValue = input[field.name];
    if (rawValue === undefined || rawValue === null || `${rawValue}`.trim() === "") {
      return { error: `Please enter ${field.label}.` };
    }
    if (field.type === "number") {
      const num = Number(rawValue);
      if (!Number.isFinite(num)) return { error: `${field.label} must be a number.` };
      values[field.name] = num;
    } else {
      values[field.name] = `${rawValue}`.trim();
    }
  }
  return { values };
}

export async function executeAction(id: string, rawFields: unknown): Promise<ActionResult> {
  const spec = SPEC_BY_ID.get(id);
  if (!spec) return { success: false, message: "Unknown action." };

  const coerced = coerceFields(spec, rawFields);
  if ("error" in coerced) return { success: false, message: coerced.error };
  const { values } = coerced;

  // Build the URL: substitute path placeholders, then append query params.
  const path = spec.urlTemplate.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) =>
    encodeURIComponent(String(values[key] ?? ""))
  );
  const url = new URL(path);
  for (const [k, v] of Object.entries(spec.staticQuery)) url.searchParams.set(k, v);
  for (const name of spec.queryFields) url.searchParams.set(name, String(values[name]));

  const headers: Record<string, string> = { "X-AUTH-TOKEN": TOKEN };
  let body: string | undefined;
  if (spec.bodyFields.length > 0) {
    headers["Content-Type"] = "application/json";
    const payload: CoercedFields = {};
    for (const name of spec.bodyFields) payload[name] = values[name];
    body = JSON.stringify(payload);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { method: spec.method, headers, body });
  } catch {
    return { success: false, message: "Could not reach the service. Please try again shortly." };
  }

  let parsed: any = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }

  if (response.ok) {
    return { success: true, status: response.status, message: parsed?.message || "Done." };
  }

  // Surface the upstream error message (a short string) — never the URL/token.
  const message =
    parsed?.message || parsed?.errorType || `Request failed (HTTP ${response.status}).`;
  return { success: false, status: response.status, message };
}
