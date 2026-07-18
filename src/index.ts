import { join, normalize } from "node:path";
import { z } from "zod";
import { initDb, listEndpoints, getEndpoint, upsertEndpoint, deleteEndpoint } from "./db";
import { verifyCredentials, buildSessionCookie, buildClearCookie, isAuthenticated } from "./auth";
import { generateReport } from "./services/proxy";
import { json, readJson } from "./http";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

// Ensure the schema exists and is seeded before we start accepting traffic.
await initDb();

// ---- Validation schemas (parity with the original Express/zod backend) ----
const generateSchema = z.object({
  reportType: z.enum(["master", "taxation"]),
  userId: z.string().trim().min(1).max(64),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const endpointSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  name: z.string().trim().min(1).max(120),
  method: z.string().trim().min(1).max(10),
  urlTemplate: z.string().trim().min(1).max(2048),
  queryParams: z.record(z.string()),
  headers: z.record(z.string()),
});

// ---- Route handlers ----
async function reportsGenerate(req: Request): Promise<Response> {
  const parsed = generateSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return json({ success: false, message: "Please enter a valid user ID." }, { status: 400 });
  }
  const { reportType, userId } = parsed.data;
  return json(await generateReport(reportType, userId));
}

async function adminLogin(req: Request): Promise<Response> {
  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return json({ success: false, message: "Username and password are required." }, { status: 400 });
  }
  const { username, password } = parsed.data;
  if (!(await verifyCredentials(username, password))) {
    return json({ success: false, message: "Invalid username or password." }, { status: 401 });
  }
  return json({ success: true }, { cookies: [await buildSessionCookie()] });
}

function adminLogout(): Response {
  return json({ success: true }, { cookies: [buildClearCookie()] });
}

async function adminMe(req: Request): Promise<Response> {
  return json({ authenticated: await isAuthenticated(req) });
}

async function endpointsList(): Promise<Response> {
  return json({ success: true, endpoints: await listEndpoints() });
}

async function endpointsCreate(req: Request): Promise<Response> {
  const parsed = endpointSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return json({ success: false, message: parsed.error.issues[0]?.message || "Invalid endpoint." }, { status: 400 });
  }
  if (await getEndpoint(parsed.data.id)) {
    return json({ success: false, message: "An endpoint with this id already exists." }, { status: 409 });
  }
  const record = await upsertEndpoint(parsed.data);
  return json({ success: true, endpoint: record }, { status: 201 });
}

async function endpointsUpdate(req: Request, id: string): Promise<Response> {
  const parsed = endpointSchema.omit({ id: true }).safeParse(await readJson(req));
  if (!parsed.success) {
    return json({ success: false, message: parsed.error.issues[0]?.message || "Invalid endpoint." }, { status: 400 });
  }
  if (!(await getEndpoint(id))) {
    return json({ success: false, message: "Endpoint not found." }, { status: 404 });
  }
  const record = await upsertEndpoint({ id, ...parsed.data });
  return json({ success: true, endpoint: record });
}

async function endpointsDelete(id: string): Promise<Response> {
  if (!(await deleteEndpoint(id))) {
    return json({ success: false, message: "Endpoint not found." }, { status: 404 });
  }
  return json({ success: true });
}

// ---- API dispatch ----
async function handleApi(req: Request, pathname: string, method: string): Promise<Response> {
  if (pathname === "/api/health" && method === "GET") return json({ status: "ok" });
  if (pathname === "/api/reports/generate" && method === "POST") return reportsGenerate(req);

  if (pathname === "/api/admin/login" && method === "POST") return adminLogin(req);
  if (pathname === "/api/admin/logout" && method === "POST") return adminLogout();
  if (pathname === "/api/admin/me" && method === "GET") return adminMe(req);

  // Every /endpoints route requires an authenticated admin.
  if (pathname === "/api/admin/endpoints" || pathname.startsWith("/api/admin/endpoints/")) {
    if (!(await isAuthenticated(req))) {
      return json({ success: false, message: "Not authenticated" }, { status: 401 });
    }
    if (pathname === "/api/admin/endpoints") {
      if (method === "GET") return endpointsList();
      if (method === "POST") return endpointsCreate(req);
    }
    const match = pathname.match(/^\/api\/admin\/endpoints\/([^/]+)$/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      if (method === "PUT") return endpointsUpdate(req, id);
      if (method === "DELETE") return endpointsDelete(id);
    }
  }

  return json({ success: false, message: "Not found" }, { status: 404 });
}

// ---- Static file serving with SPA fallback ----
async function serveStatic(pathname: string): Promise<Response> {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(PUBLIC_DIR, relative === "/" ? "index.html" : relative);

  // Never allow escaping the public directory.
  if (!candidate.startsWith(PUBLIC_DIR)) {
    return new Response("Forbidden", { status: 403 });
  }

  const file = Bun.file(candidate);
  if (await file.exists()) {
    return new Response(file);
  }

  // SPA fallback — let the client router handle unknown non-API paths.
  const index = Bun.file(join(PUBLIC_DIR, "index.html"));
  if (await index.exists()) {
    return new Response(index, { headers: { "Content-Type": "text/html" } });
  }
  return new Response("Not found", { status: 404 });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname.startsWith("/api/")) {
      return handleApi(req, pathname, req.method);
    }
    return serveStatic(pathname);
  },
});

console.log(`report-downloader (bun) listening on port ${server.port}`);
