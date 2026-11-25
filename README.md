# studNet

The four-pillar student network: Feed · Academics · Messages · Opportunities.

## Architecture

- `apps/web` — Next.js 16 App Router web app (single origin via `/api/v1` proxy)
- `apps/api` — NestJS API with Prisma/PostgreSQL, cookie auth, and guarded content routes
- `apps/worker` — BullMQ worker for background jobs
- `packages/shared` — shared types and constants

## Local setup

```powershell
npm install
npm run prisma:generate
./scripts/setup.ps1
docker compose up -d postgres redis
npm run db:setup
npm run dev
```

Web: `http://localhost:3000` · API health: `http://localhost:3000/api/v1/health`

Copy `.env.example` to `.env` before local setup. Docker must be running for PostgreSQL and Redis. Without Docker, the app still boots with resilient built-in demo data, but database-backed writes and registered users in `/content` require a database.

## Accounts after seeding

- `demo@studnet.app` / `StudnetDemo123!`
- `harun881@yahoo.com` / `harun881` (local studNet account only)

## Production deployment

The repository root is the deployment project root; Next.js builds from the `apps/web` workspace. `vercel.json` pins the install/build/output commands for npm workspaces. The production web build serves the NestJS API in-process through `apps/web/app/api/[path]/route.ts`, so no separate API container is required.

Set these deployment environment variables:

- `DATABASE_URL` — managed PostgreSQL connection string (pooled URL is recommended)
- `REDIS_URL` — managed Redis connection string (optional for web-only deployment; required for worker)
- `JWT_ACCESS_SECRET` — long random value (32+ bytes)
- `JWT_REFRESH_SECRET` — a second independent long random value
- `APP_ORIGIN` — the deployed HTTPS origin
- `API_ORIGIN` — same as `APP_ORIGIN` (the web app calls the NestJS API through its own `/api/v1` proxy)
- `SESSION_COOKIE_DOMAIN` — leave unset so cookies bind to the deployment host
- `SESSION_COOKIE_SECURE=true`

Run database migrations once after the managed database is available:

```powershell
npm run prisma:deploy
npm run db:seed
```

Deploy `apps/worker` separately if background jobs are required.

## Security defaults

- HttpOnly cookies with refresh token rotation
- Argon2id password hashing
- Helmet security headers, CORS allowlist, rate limiting
- Backend authorization on private resources
- Zod input validation
- No sensitive data in browser storage

## Known limitations

- The composer attaches selected photo/video metadata, but binary upload/storage is not implemented.
- File-backed local fallback users are development-only; production deployments must set `DATABASE_URL` and JWT secrets, then run migrations and seed.
- Deployment requires an authenticated hosting account and a GitHub repository/remote; these cannot be supplied by the application code.

## Verification

```powershell
npm run typecheck
npm run build
npm run smoke
```

The CI workflow provisions PostgreSQL and Redis, generates the Prisma client, typechecks, and builds all workspaces.
