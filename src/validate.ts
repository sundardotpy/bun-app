import { z } from "zod";
import type { ReportType } from "./types";

// Shared request validation. Used by both the Bun server (src/index.ts) and the
// Vercel serverless functions (api/*) so the two deployments behave identically.

const generateSchema = z.object({
  reportType: z.enum(["master", "taxation"]),
  userId: z.string().trim().min(1).max(64),
});

export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function parseGenerateInput(body: unknown): ParseResult<{ reportType: ReportType; userId: string }> {
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return { ok: false, message: "Please enter a valid user ID." };
  return { ok: true, value: parsed.data };
}
