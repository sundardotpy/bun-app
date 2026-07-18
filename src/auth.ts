import { SignJWT, jwtVerify } from "jose";
import { parseCookies } from "./http";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "kitten";

// Hashed once at boot so the plaintext only ever lives in the env var.
const ADMIN_PASSWORD_HASH = await Bun.password.hash(process.env.ADMIN_PASSWORD || "1707", {
  algorithm: "bcrypt",
  cost: 10,
});

const COOKIE_NAME = "rd_admin_session";
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const IS_PROD = process.env.NODE_ENV === "production";

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  return Bun.password.verify(password, ADMIN_PASSWORD_HASH);
}

export async function buildSessionCookie(): Promise<string> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(ADMIN_USERNAME)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(JWT_SECRET);

  const attrs = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${TOKEN_TTL_SECONDS}`,
  ];
  if (IS_PROD) attrs.push("Secure");
  return attrs.join("; ");
}

export function buildClearCookie(): string {
  const attrs = [`${COOKIE_NAME}=`, "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=0"];
  if (IS_PROD) attrs.push("Secure");
  return attrs.join("; ");
}

export async function isAuthenticated(req: Request): Promise<boolean> {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
