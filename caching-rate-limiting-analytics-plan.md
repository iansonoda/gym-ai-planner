# Caching, Rate Limiting, and Analytics v1

## Summary

- Add zero-infra backend caching, strict per-user plan-generation throttling, and first-party product/backend analytics without Redis or a hosted analytics vendor.
- Keep the current stack: React client, Express API, Prisma/Postgres, Neon Auth, OpenRouter.
- Preserve the existing profile and plan response shapes while adding cache and rate-limit headers plus a new analytics endpoint.

## Implementation

- Add in-memory caches for authenticated `GET /api/profile` and `GET /api/plan/current`.
- Invalidate the profile cache after `POST /api/profile` and the current-plan cache after `POST /api/plan/generate`.
- Add `X-Cache: HIT|MISS` to the cached GET routes.
- Add a global API limiter for `/api/*` keyed by IP with a default `15m / 120 requests`.
- Add a stricter plan-generation limiter for `POST /api/plan/generate` keyed by authenticated user with a default `15m / 5 requests`.
- Add in-flight dedupe for identical concurrent plan-generation requests so duplicate clicks share one AI call and one DB write.
- Add a Prisma-backed `analytics_events` table and `POST /api/analytics/events`.
- Track client page views and key product events, and persist server-side cache/rate-limit/generation events.

## Public Interfaces

- New endpoint: `POST /api/analytics/events`
- New optional env vars:
  - `CACHE_PROFILE_TTL_MS=300000`
  - `CACHE_CURRENT_PLAN_TTL_MS=120000`
  - `API_RATE_LIMIT_WINDOW_MS=900000`
  - `API_RATE_LIMIT_MAX=120`
  - `PLAN_RATE_LIMIT_WINDOW_MS=900000`
  - `PLAN_RATE_LIMIT_MAX=5`
  - `ANALYTICS_ENABLED=true`
- Existing GET endpoints expose `X-Cache`.
- Limited API responses return `429` JSON plus rate-limit headers.

## Acceptance

- Repeated authenticated reads of `/api/profile` and `/api/plan/current` hit in-memory cache until invalidated or expired.
- Rapid repeated plan-generation requests are throttled and identical concurrent requests are deduplicated.
- Client page views, profile saves, and plan-generation lifecycle events are persisted.
- Server cache hits, cache misses, rate-limit violations, and plan-generation outcomes are persisted in `analytics_events`.
- Tests cover cache behavior, rate limiting, analytics validation, anonymous/authenticated analytics ingestion, and concurrent generation dedupe.
