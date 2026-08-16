# CX User Operations

Enter a user ID, download that user's Master or Taxation report as an Excel file.
The server proxies the internal WintWealth API (so the host and `X-AUTH-TOKEN`
never reach the browser), then streams the resulting file back through
`/api/download` so it saves as soon as the API responds. Recent requests are
kept in the browser (localStorage).

**Stack:** Next.js (App Router) + React + Tailwind, TypeScript. One app, no
database, no build config — Vercel detects and builds it with zero setup.

## Layout

```
app/
  page.tsx                       the single page (client component)
  layout.tsx                     document shell, icon + manifest metadata
  api/reports/generate/route.ts  proxies the report request
  api/download/route.ts          streams the file back as an attachment
  api/health/route.ts            reports whether env vars arrived
components/                      Header, ReportForm, ResultPanel, HistoryList, Toast
lib/
  reports.ts                     upstream call — server only
  download.ts                    download URL allowlist
  api.ts                         browser-side client
  history.ts, useToast.ts
public/                          favicon + app icons + manifest
```

## Endpoints

| Method | Path                    | Purpose                                           |
| ------ | ----------------------- | ------------------------------------------------- |
| POST   | `/api/reports/generate` | Proxy report request, return the file link        |
| GET    | `/api/download`         | Stream that link back as an `attachment` download |
| GET    | `/api/health`           | Health check + whether the token is configured    |

## Environment

Copy `.env.example` to `.env.local` (Next.js reads that automatically in dev):

- `WINTWEALTH_AUTH_TOKEN` — the `X-AUTH-TOKEN` sent to the report API. **Required.**
- `AGENT_ID` — query param `agentId` (default `333`).
- `WINTWEALTH_BASE_URL` — report API host (default `https://elb.api.wintwealth.com`).
- `DOWNLOAD_ALLOWED_HOSTS` — optional extra hosts `/api/download` may fetch from.

None of these are `NEXT_PUBLIC_`, so they stay on the server and never ship to
the browser bundle.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. `npm run build && npm start` runs the
production build; `npm run lint` typechecks.

## Deploy to Vercel

1. Vercel → **Add New → Project**, import this repo. It is detected as Next.js —
   accept the defaults, there is nothing to configure.
2. **Settings → Environment Variables**: add `WINTWEALTH_AUTH_TOKEN` for
   Production (and Preview, if you use previews).
3. Deploy, then open `/api/health`. If `reportsTokenConfigured` is `false` the
   env var did not reach the server — env var changes need a **redeploy** to
   take effect.

Report generation is allowed 60s via `export const maxDuration` in the route
files; raise it only on a plan that permits longer durations.

## Why downloads go through `/api/download`

The upstream link is on another origin, so the browser ignores the `download`
attribute on it and simply navigates — the user ends up on the file host and
loses the app. Proxying through our own origin lets us set
`Content-Disposition: attachment`, so the file saves in place while the page
stays put. The URL is checked against a host allowlist and must be `https`
before it is fetched, so the endpoint cannot be used as an open proxy.
