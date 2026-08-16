# Report Downloader

Enter a user ID, pull the Master or Taxation report as an Excel file. The server
proxies the internal WintWealth API server-side (so the host and `X-AUTH-TOKEN`
never reach the browser), then streams the resulting file back through
`/api/download` so it saves as an attachment the moment the API responds.
Recent requests are kept in the browser (localStorage).

- **Frontend:** React + Vite + Tailwind.
- **Config:** no database, no admin login — token, agentId and base URL come from environment variables.
- **Deploy targets:** Vercel (serverless functions in `api/`) *or* Render / local (single Bun process in `src/`).

Both deployments share the same logic in `src/` — `src/index.ts` is the Bun
entrypoint, `api/*.ts` are thin Vercel wrappers around the same modules.

## Endpoints

| Method | Path                    | Purpose                                           |
| ------ | ----------------------- | ------------------------------------------------- |
| POST   | `/api/reports/generate` | Proxy report request, return the file link        |
| GET    | `/api/download`         | Stream that link back as an `attachment` download |
| GET    | `/api/health`           | Health check + whether the token is configured    |

Everything else serves the frontend (SPA fallback).

## Environment

Copy `.env.example` to `.env`. Vars:

- `WINTWEALTH_AUTH_TOKEN` — the `X-AUTH-TOKEN` sent to the report API. **Required.**
- `AGENT_ID` — query param `agentId` (default `333`).
- `WINTWEALTH_BASE_URL` — report API host (default `https://elb.api.wintwealth.com`).
- `DOWNLOAD_ALLOWED_HOSTS` — optional extra hosts `/api/download` may fetch from.
- `PORT` — Bun server only; defaults to `3000`.

## Deploy to Vercel

`vercel.json` builds the Vite app to `frontend/dist` and deploys every file in
`api/` as a serverless function.

1. Vercel → **Add New → Project**, import this repo. Leave the framework preset
   as **Other** — `vercel.json` supplies the build and output settings.
2. **Settings → Environment Variables**: add `WINTWEALTH_AUTH_TOKEN` for
   Production (and Preview, if you use previews).
3. Deploy, then open `/api/health`. It reports `reportsTokenConfigured` — if
   that is `false`, the env var did not reach the function and reports will
   fail. Env var changes need a **redeploy** to apply.

Report generation is allowed 60s (`functions.maxDuration` in `vercel.json`);
raise it only on a plan that permits longer durations.

## Run locally / deploy to Render (Bun)

```bash
bun install
bun run build     # builds the frontend into ./public
bun run start     # serves API + frontend on http://localhost:3000
```

`bun run dev` runs just the server with reload; `cd frontend && bun run dev`
runs Vite with `/api` proxied to port 3000.

For Render: **New → Blueprint** against this repo (uses `render.yaml`), then set
`WINTWEALTH_AUTH_TOKEN` in the dashboard.

## Why downloads go through `/api/download`

The upstream link is on another origin, so a browser ignores the `download`
attribute on it and simply navigates — the user lands on (or away to) the file
host and loses the app. Proxying through our own origin lets us set
`Content-Disposition: attachment`, so the file saves in place. The URL is
validated against a host allowlist before being fetched, so the endpoint cannot
be used as an open proxy.
