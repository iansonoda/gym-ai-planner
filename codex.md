# Codex Execution Brief

## Goal

Implement zero-infra caching, rate limiting, and analytics for GymAI without changing the existing profile or plan response payloads.

## Decisions

- Use in-memory caches for authenticated read endpoints only.
- Do not cache `POST /api/plan/generate` responses across requests; intentional regenerations must still create new versions.
- Rate limit all `/api/*` traffic lightly by IP and `POST /api/plan/generate` more aggressively by authenticated user.
- Store both client and server analytics in Postgres through Prisma.
- Keep analytics fire-and-forget on the client and non-blocking on the server.

## Required Changes

- Backend:
  - Add shared cache, rate-limit, request, analytics, and runtime helpers under `server/src/lib/`.
  - Add `analytics_events` to Prisma plus a SQL migration.
  - Mount a new analytics router and global API limiter in `server/src/app.ts`.
  - Add profile/current-plan caching and cache invalidation in the profile and plan routers.
  - Add plan-generation rate limiting and in-flight dedupe in the plan router.
- Frontend:
  - Add a lightweight analytics helper with browser session ID persistence.
  - Track route page views in `src/App.tsx`.
  - Track profile save and plan-generation requested/succeeded/failed events in `src/context/AuthContext.tsx`.
- Verification:
  - Expand unit and integration tests for cache behavior, rate limiting, analytics ingestion, analytics persistence, and concurrent generation dedupe.

## Defaults

- `CACHE_PROFILE_TTL_MS=300000`
- `CACHE_CURRENT_PLAN_TTL_MS=120000`
- `API_RATE_LIMIT_WINDOW_MS=900000`
- `API_RATE_LIMIT_MAX=120`
- `PLAN_RATE_LIMIT_WINDOW_MS=900000`
- `PLAN_RATE_LIMIT_MAX=5`
- `ANALYTICS_ENABLED=true`
