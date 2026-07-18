# Report Downloader (Bun)

Enter a user ID, pull the Master or Taxation report as an Excel file. The Bun
server proxies the internal WintWealth API server-side (so the host and
`X-AUTH-TOKEN` never reach the browser) and returns a signed S3 link the browser
downloads directly. Recent requests are kept in the browser (localStorage).

- **Runtime:** [Bun](https://bun.sh) `Bun.serve` — one process serves the API and the built React frontend.
- **Config:** no database, no admin login — report config (token, agentId, base URL) comes from environment variables.
- **Frontend:** React + Vite + Tailwind, built to static files served from `/public`.
- **Deploy target:** Render (native Bun, no Docker).

## Endpoints

| Method | Path                    | Purpose                              |
| ------ | ----------------------- | ------------------------------------ |
| POST   | `/api/reports/generate` | Proxy report request, return S3 link |
| GET    | `/api/health`           | Health check (Render probe)          |

Everything else serves the frontend (SPA fallback).

## Environment

Copy `.env.example` to `.env`. Vars:

- `WINTWEALTH_AUTH_TOKEN` — the `X-AUTH-TOKEN` sent to the report API.
- `AGENT_ID` — query param `agentId` (default `333`).
- `WINTWEALTH_BASE_URL` — report API host (default `https://elb.api.wintwealth.com`).
- `PORT` — defaults to `3000` (Render sets this automatically).

## Run locally

```bash
bun install
bun run build     # builds the frontend into ./public
bun run start     # serves on http://localhost:3000
```

`bun run dev` runs just the server with reload (build the frontend first).

## Deploy to Render (native Bun)

Render's Node runtime includes Bun, so no Docker is needed.

1. Push this repo to GitHub.
2. Render → **New → Blueprint**, select the repo (uses `render.yaml`), or create a
   **Web Service** manually with:
   - **Build Command:** `bun install && bun run build`
   - **Start Command:** `bun run start`
   - **Health Check Path:** `/api/health`
3. Set the env var `WINTWEALTH_AUTH_TOKEN` in the dashboard. `AGENT_ID` and
   `WINTWEALTH_BASE_URL` have defaults.
4. Deploy. A successful boot logs `report-downloader (bun) listening on port …`.

Free tier works (nothing is persisted server-side); it cold-starts after idle.
