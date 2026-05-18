# Local Postgres And OAuth Migration Design

## Goal

Migrate GymAI away from Neon Auth and Neon-host-oriented setup to app-owned OAuth 2.0 authentication, local Dockerized Postgres for development, and an AWS-ready architecture that can be implemented later.

The first implementation phase will not deploy to AWS. It will prepare the application for future AWS deployment while keeping the coding scope focused on local Docker Postgres, Passport-based OAuth, Postgres-backed sessions, and removal of Neon Auth dependencies.

## Current Context

GymAI is a React 19, Vite, TypeScript frontend with an Express API and Prisma/Postgres backend. The server already uses Prisma with `pg`, so the database migration is primarily local infrastructure, configuration, scripts, and documentation.

The current auth coupling is stronger:

- The frontend imports `@neondatabase/neon-js/auth` and Neon React auth components.
- `AuthProvider` loads the user from the Neon auth client.
- API calls attach a Neon bearer token.
- The Express auth middleware verifies Neon JWTs through a JWKS URL.
- Protected app data is keyed by Neon-provided UUID user IDs.

There is no requirement to preserve existing Neon user data. This is a fresh auth cutover.

## Chosen Approach

Use direct Google and GitHub OAuth through the Express server with Passport.js.

The server will own authentication and session state. The frontend will not store bearer tokens. Instead, Express will set an HTTP-only session cookie, and frontend requests will use `credentials: "include"`.

Local development will use Docker Compose for Postgres only. Vite and Express will continue to run through npm scripts. AWS deployment will be documented as a future target, not implemented in this phase.

## Architecture

The target local architecture is:

```text
React/Vite -> Express API + Passport -> Docker Postgres via Prisma
```

Auth flow:

1. The user clicks "Continue with Google" or "Continue with GitHub".
2. The frontend sends the browser to `/api/auth/google` or `/api/auth/github`.
3. Passport starts the provider OAuth flow.
4. The provider redirects to the Express callback route.
5. The server validates the provider profile and email verification status.
6. The server finds or creates an app-owned user.
7. The server links the OAuth provider account.
8. The server stores a Postgres-backed session and sets an HTTP-only cookie.
9. The frontend loads the current user from `/api/auth/me`.
10. Protected API routes read authenticated user context from the session.

Development auth flow:

1. In non-production environments, the frontend can call `/api/auth/dev-login`.
2. The server creates or reuses a fixed development user.
3. The server creates a normal session for that user.
4. The rest of the app exercises the same session-based auth path as real OAuth.

## Data Model

Add app-owned auth tables through Prisma migrations.

### `users`

- `id`: UUID primary key
- `email`: unique normalized lowercase email
- `name`: nullable display name
- `avatar_url`: nullable image URL
- `created_at`: timestamp
- `updated_at`: timestamp

### `oauth_accounts`

- `id`: UUID primary key
- `user_id`: foreign key to `users.id`
- `provider`: `google` or `github`
- `provider_account_id`: provider subject or account id
- `email`: normalized provider email
- `created_at`: timestamp
- Unique constraint on `(provider, provider_account_id)`

Provider linking behavior:

- If a verified provider email matches an existing user, link the provider account to that user.
- If no user exists for a verified provider email, create a new user.
- If an existing provider account is found, reuse its linked user.
- If the provider does not supply a verified email, reject login with a clear auth error.

### Sessions

Use `express-session` with `connect-pg-simple` as the Postgres-backed session store, with Passport session support.

The session table stores:

- session id
- serialized session data
- expiry

Logout destroys only the current browser session.

### Existing App Tables

Keep the current app tables:

- `user_profiles`
- `training_plans`
- `analytics_events`

Their `user_id` fields remain UUIDs and will point to app-owned `users.id` for new accounts. Add foreign keys to `users.id`:

- `user_profiles.user_id` references `users.id` with cascade delete.
- `training_plans.user_id` references `users.id` with cascade delete.
- `analytics_events.user_id` references `users.id` with set-null on delete because analytics events can be retained without a user.

No legacy Neon user rows are migrated or rewritten.

## Server API

Add auth routes:

- `GET /api/auth/me`: returns the current user when signed in; returns `401` when not signed in.
- `GET /api/auth/google`: starts Google OAuth.
- `GET /api/auth/google/callback`: completes Google OAuth.
- `GET /api/auth/github`: starts GitHub OAuth.
- `GET /api/auth/github/callback`: completes GitHub OAuth.
- `POST /api/auth/logout`: destroys the current session.
- `POST /api/auth/dev-login`: development only; creates a session for a fixed test user.

Replace Neon JWT middleware:

- `requireAuth` reads the session and attaches authenticated user context.
- `resolveOptionalAuth` reads the session when present, so analytics can attach `user_id`.
- Missing auth returns `401`.
- Missing server auth/session configuration returns a server configuration error.

## Frontend

Remove Neon-specific frontend auth:

- Remove `@neondatabase/neon-js` auth client usage.
- Remove Neon React auth components.
- Remove Neon auth CSS imports and Neon-specific styling wrappers.
- Stop sending bearer tokens from `api.ts` and analytics calls.

Add app-owned auth behavior:

- `AuthProvider` calls `/api/auth/me` on load.
- API requests use `credentials: "include"`.
- Auth pages render app-owned Google and GitHub sign-in buttons.
- A dev-login button is visible only in development.
- Account page shows the signed-in user's email, connected providers, and a sign-out control.
- Navbar replaces `UserButton` with app-owned account/sign-out UI.

Routes remain:

- `/auth/sign-in`
- `/auth/sign-up`
- `/profile`
- `/onboarding`
- `/account/profile`

## Configuration

Keep separate environment files:

- Root `.env` for frontend public variables such as `VITE_API_URL`.
- `server/.env` for server secrets and backend-only configuration.

Server variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `APP_ORIGIN`
- `API_BASE_URL`
- `OPEN_ROUTER_KEY`
- existing rate limit variables remain supported with their current defaults

Local Docker Postgres connection example:

```env
DATABASE_URL="postgresql://gymai:gymai@localhost:5432/gymai"
```

CORS and cookies:

- CORS allows `APP_ORIGIN`.
- CORS enables `credentials: true`.
- Session cookie is HTTP-only.
- Local development cookies are non-secure.
- Production cookies are secure and use an explicit same-site policy.

## Local Database

Add `docker-compose.yml` for Postgres only.

Vite and Express continue running through npm. Add server scripts for Prisma operations:

- `db:generate`
- `db:migrate`
- `db:reset`
- `db:studio`

The local setup flow should be:

1. Start Postgres with Docker Compose.
2. Configure `server/.env`.
3. Run Prisma generate.
4. Run Prisma migrations.
5. Start the Express server.
6. Start the Vite frontend.

## AWS Direction

AWS deployment is deferred.

The future target architecture is:

- Frontend hosted on S3 and CloudFront.
- API deployed as a containerized service.
- Production Postgres hosted on RDS.
- Secrets stored outside source control, likely in AWS-native secret/config services.

The first implementation should avoid decisions that block this target, but should not add AWS infrastructure yet.

## Testing

Update tests during the migration.

Server coverage:

- `requireAuth` rejects unauthenticated session requests.
- `requireAuth` attaches the session user when authenticated.
- `/api/auth/me` returns the current user.
- `/api/auth/logout` destroys only the current session.
- `/api/auth/dev-login` works outside production.
- `/api/auth/dev-login` is blocked in production.
- Existing route integration tests move from mocked bearer auth to mocked session auth.
- Provider-linking service tests cover:
  - creating a user on first verified OAuth login
  - linking Google and GitHub by verified email
  - rejecting unverified or missing email
  - reusing an existing provider account

Frontend coverage:

- `api.ts` uses `credentials: "include"` instead of Authorization headers.
- `AuthProvider` loads `/api/auth/me`.
- Auth/account UI no longer depends on Neon components.

Manual verification:

1. Start Docker Postgres.
2. Run Prisma migrate/generate.
3. Start Express and Vite.
4. Use dev login to create a local session.
5. Confirm onboarding works.
6. Confirm plan generation works.
7. Confirm profile loading works.
8. Confirm account page displays the user.
9. Confirm logout destroys the current session.
10. Confirm analytics still records anonymous and authenticated events.

## Out Of Scope

- AWS deployment implementation.
- Preserving or migrating old Neon user data.
- Password authentication.
- Full account-management UI.
- Provider disconnect/reconnect workflows.
- Sign out everywhere.
- Redis sessions.
- Production Dockerfiles for this phase.

## Acceptance Criteria

- Neon Auth is removed from runtime code.
- The app supports Google and GitHub OAuth through Express and Passport.
- The app supports a development-only mock login endpoint.
- Authenticated state is represented by HTTP-only Postgres-backed sessions.
- Protected API routes use session auth.
- Frontend API calls include credentials and no longer send Neon bearer tokens.
- Local Postgres runs through Docker Compose.
- Prisma migrations create the required auth/session schema.
- Tests cover the migrated auth/session behavior.
- README documents the new local setup.
