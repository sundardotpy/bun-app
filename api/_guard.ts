import type { VercelRequest, VercelResponse } from "@vercel/node";

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

// Without this, an unexpected throw becomes Vercel's own FUNCTION_INVOCATION_FAILED
// page — an HTML body the browser client cannot parse, so the UI can only report
// "unexpected response". Wrapping every handler keeps the contract (always JSON)
// and puts the real error in the function logs.
export function guard(handler: Handler): Handler {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error(`[${req.method} ${req.url}] unhandled error:`, err);
      if (res.headersSent || res.writableEnded) return;
      return res.status(500).json({
        success: false,
        message: "The server hit an unexpected error. Please try again.",
        detail,
      });
    }
  };
}
