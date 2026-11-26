# studNet

The four-pillar student network: Feed, Academics, Messages, Opportunities.

## Architecture

- `apps/web` - Next.js 16 App Router web app
- `apps/api` - NestJS API, Prisma/PostgreSQL, cookie auth, Socket.IO, R2 signed uploads
- `apps/worker` - BullMQ worker
- `packages/shared` - shared types and constants

External services: Neon PostgreSQL, Upstash Redis, Cloudflare R2, Sentry.

## Local setup

```powershell
npm install
npm run prisma:generate
docker compose up -d postgres redis
copy .env.example .env
npm run prisma:deploy
npm run dev
```

Web: `http://localhost:3000`; API health: `http://localhost:4000/api/v1/health`.
Registration is open in local development. Seeding is disabled unless `ALLOW_DEV_SEED=true` and no demo
accounts are created.

## Production deployment

Deploy the API and worker as persistent Fly.io services using `fly.api.toml` and `fly.worker.toml`. CI
validates the workspace with `npm run typecheck` and `npm run build`, runs `prisma migrate deploy` on the
API service, and deploys the backend services. Set `FLY_API_TOKEN` as a GitHub secret.

The frontend is configured for vercel. You will install its Cloudflare Pages GitHub integration manually; the final domain is not set yet. Once it is known, add it to `APP_ORIGIN` on the API and set `NEXT_PUBLIC_API_ORIGIN`, `NEXT_PUBLIC_SENTRY_DSN`, and `API_ORIGIN` for the frontend deployment.

Required API secrets (Fly secrets): `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `REDIS_URL`,
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `APP_ORIGIN`, `API_ORIGIN`, `SENTRY_DSN`, `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.
The API fails closed if `DATABASE_URL` or production `REDIS_URL`/JWT secrets are absent.

Socket.IO uses the Upstash Redis adapter and must run on the persistent API machine (`auto_stop_machines =
false`, `min_machines_running = 1`).

## Security defaults

- HttpOnly cookies with refresh token rotation
- Argon2id password hashing
- Helmet security headers, CORS allowlist, rate limiting
- Backend authorization on private resources
- Zod input validation
- No hardcoded demo users or fallback auth in production

## Verification

```powershell
npm run typecheck
npm run build
npm run test:e2e
```
