# Report Downloader (Bun + Supabase)

Bun port of the report-downloader tool. Enter a user ID, pull the Master or
Taxation report as an Excel file (the backend proxies the internal WintWealth
API server-side and returns a signed S3 link the browser downloads directly).
Admin panel (gear icon, login-gated) edits the API collection Postman-style.

- **Runtime:** [Bun](https://bun.sh) `Bun.serve` — serves the API and the built React frontend.
- **DB:** Supabase Postgres via [postgres.js](https://github.com/porsager/postgres).
- **Auth:** single admin account, `Bun.password` (bcrypt) + JWT session cookie (`jose`).
- **Frontend:** React + Vite + Tailwind (unchanged from the original app), built to static files.
- **Deploy target:** Render (Docker).

## Endpoints

| Method | Path                          | Auth  | Purpose                          |
| ------ | ----------------------------- | ----- | -------------------------------- |
| POST   | `/api/reports/generate`       | –     | Proxy report request, return S3 link |
| POST   | `/api/admin/login`            | –     | Set admin session cookie         |
| POST   | `/api/admin/logout`           | –     | Clear session                    |
| GET    | `/api/admin/me`               | –     | Session check                    |
| GET/POST/PUT/DELETE | `/api/admin/endpoints[/:id]` | admin | Edit the API collection |
| GET    | `/api/health`                 | –     | Health check (Render probe)      |

## Environment

Copy `.env.example` to `.env` and fill in the Supabase password. Key vars:

- `DATABASE_URL` — Supabase connection string (incl. password).
- `DATABASE_SSL` — `require` for Supabase, `disable` for a local Postgres.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — admin login (`kitten` / `1707`).
- `JWT_SECRET` — session signing secret (use a long random value in prod).
- `WINTWEALTH_AUTH_TOKEN` — seeds the `X-AUTH-TOKEN` header on first boot only.

The `api_endpoints` table is created and seeded automatically on first boot.

## Run locally

Everything through Docker (no local Bun needed) — spins up a throwaway Postgres:

```bash
docker compose up --build
# open http://localhost:3000
```

With a local Bun install instead:

```bash
bun install
# set DATABASE_URL / DATABASE_SSL in your shell or .env, then:
bun run dev
```

## Deploy to Render

1. Push this folder to a Git repo.
2. Render → **New → Blueprint**, select the repo (uses `render.yaml`).
3. Set the secret env vars in the dashboard: `DATABASE_URL` (your Supabase
   string with password) and `ADMIN_PASSWORD`. `JWT_SECRET` is auto-generated.
4. Deploy. Render builds the Dockerfile and health-checks `/api/health`.

Render provides `PORT` automatically; the app binds to it.
