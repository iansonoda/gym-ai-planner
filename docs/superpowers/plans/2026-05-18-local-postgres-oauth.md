# Local Postgres OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Neon Auth with app-owned Google/GitHub OAuth, Postgres-backed sessions, local Docker Postgres, and session-based frontend API calls.

**Architecture:** Express owns auth using Passport and HTTP-only sessions stored in Postgres. React loads the current user from `/api/auth/me` and sends cookie-backed requests with `credentials: "include"`. Prisma owns app and auth tables in the same Postgres database.

**Tech Stack:** React 19, Vite, TypeScript, Express 5, Prisma 7, PostgreSQL, Passport.js, express-session, connect-pg-simple, Docker Compose, Vitest, Supertest/node-mocks-http.

---

## File Structure

- Create `docker-compose.yml`: local Postgres service only.
- Modify `server/package.json`: add Passport/session dependencies and Prisma scripts.
- Modify `package.json`: remove root Neon dependency after frontend code stops importing it.
- Modify `server/prisma/schema.prisma`: add `users`, `oauth_accounts`, session model support, and relations from existing app tables.
- Create `server/prisma/migrations/20260518140000_add_app_auth/migration.sql`: auth and session tables plus foreign keys.
- Modify `server/src/lib/prisma.ts`: export the existing `pg` pool for the session store.
- Replace `server/src/lib/auth.ts`: session-based auth middleware and request types.
- Create `server/src/lib/oauth.ts`: provider profile normalization and find-or-create/link behavior.
- Create `server/src/lib/session.ts`: Express session middleware configuration.
- Create `server/src/routes/auth.ts`: `/api/auth/*` routes.
- Modify `server/src/app.ts`: credentials CORS, session/passport setup, auth router.
- Modify `server/src/lib/analytics.ts`: keep `auth?.userId` behavior working with the new `AuthContext`.
- Modify `server/src/routes/analytics.ts`: keep optional auth resolution on the session auth path.
- Modify `test/helpers/server-test-utils.ts`: session test helpers replace bearer headers.
- Modify `test/helpers/express-test-utils.ts`: support cookies/session state where needed.
- Create `server/src/lib/oauth.unit.test.ts`: provider linking behavior.
- Replace `server/src/lib/auth.unit.test.ts`: session middleware auth behavior.
- Create `server/src/routes/auth.unit.test.ts`: auth route behavior.
- Modify `server/src/routes/app.integration.test.ts` and `server/src/routes/plan.perf.test.ts`: mock session auth instead of bearer auth.
- Replace `src/lib/auth.ts`: session API helpers.
- Modify `src/lib/api.ts`: include credentials, remove Authorization.
- Modify `src/lib/analytics.ts`: include credentials, remove Authorization.
- Modify `src/context/AuthContext.tsx`: load `/api/auth/me`, call logout/dev login helpers.
- Modify `src/context/auth-context.ts`: expose `signOut` and `devLogin`.
- Modify `src/types/index.ts`: add optional `name`, `avatarUrl`, and `providers` to `User`.
- Modify `src/App.tsx`: remove `NeonAuthUIProvider`.
- Replace `src/pages/Auth.tsx`: app-owned auth screen.
- Replace `src/pages/Account.tsx`: simple app-owned account page.
- Modify `src/pages/Onboarding.tsx`: replace `SignedIn`/`RedirectToSignIn` with local auth checks.
- Modify `src/components/layout/Navbar.tsx`: replace `UserButton`.
- Modify `src/index.css`: remove Neon CSS import and Neon-specific selectors.
- Modify `src/lib/api.unit.test.ts` and `src/lib/analytics.unit.test.ts`.
- Create `src/context/AuthContext.unit.test.tsx`: verify the provider loads `/api/auth/me` through `getCurrentUser`.
- Modify `README.md`: new Docker Postgres and OAuth local setup.

---

### Task 1: Dependencies, Docker Postgres, And Prisma Scripts

**Files:**
- Create: `docker-compose.yml`
- Modify: `server/package.json`
- Modify: `package.json`
- Test: `server/package.json`, `package.json`

- [ ] **Step 1: Add the local Postgres Compose file**

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: gymai-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: gymai
      POSTGRES_USER: gymai
      POSTGRES_PASSWORD: gymai
    ports:
      - "5432:5432"
    volumes:
      - gymai-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gymai -d gymai"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  gymai-postgres-data:
```

- [ ] **Step 2: Install server auth/session dependencies**

Run:

```bash
npm install --prefix server passport passport-google-oauth20 passport-github2 express-session connect-pg-simple
npm install -D --prefix server @types/passport @types/passport-google-oauth20 @types/passport-github2 @types/express-session @types/connect-pg-simple
```

Expected: `server/package.json` and `server/package-lock.json` include the new packages.

- [ ] **Step 3: Remove root Neon dependency after code removal**

Do this after Tasks 5-6 remove all imports:

```bash
npm uninstall @neondatabase/neon-js
```

Expected: root `package.json` no longer lists `@neondatabase/neon-js`.

- [ ] **Step 4: Add Prisma scripts to `server/package.json`**

Set the scripts block to include:

```json
{
  "scripts": {
    "test": "npm run test --prefix ..",
    "dev:server": "tsx watch src/index.ts",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio"
  }
}
```

- [ ] **Step 5: Verify package metadata**

Run:

```bash
npm install --package-lock-only
npm install --prefix server --package-lock-only
```

Expected: both commands complete without package resolution errors.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml package.json package-lock.json server/package.json server/package-lock.json
git commit -m "chore: add local postgres and auth dependencies"
```

---

### Task 2: Prisma Auth Schema And Migration

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/20260518140000_add_app_auth/migration.sql`
- Test: Prisma schema validation

- [ ] **Step 1: Update Prisma schema**

Add these models and relations to `server/prisma/schema.prisma`:

```prisma
model users {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email String @unique @db.VarChar(255)
  name String? @db.VarChar(255)
  avatar_url String? @db.Text
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  oauth_accounts oauth_accounts[]
  user_profile user_profiles?
  training_plans training_plans[]
  analytics_events analytics_events[]
}

model oauth_accounts {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id String @db.Uuid
  provider String @db.VarChar(40)
  provider_account_id String @db.VarChar(255)
  email String @db.VarChar(255)
  created_at DateTime @default(now()) @db.Timestamptz(6)

  user users @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([provider, provider_account_id], map: "oauth_accounts_provider_provider_account_id_key")
  @@index([email], map: "idx_oauth_accounts_email")
  @@index([user_id], map: "idx_oauth_accounts_user_id")
}
```

Update existing models with relations:

```prisma
model user_profiles {
  user_id String @id @db.Uuid
  // existing fields stay unchanged
  user users @relation(fields: [user_id], references: [id], onDelete: Cascade)
}

model training_plans {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id String @db.Uuid
  // existing fields stay unchanged
  user users @relation(fields: [user_id], references: [id], onDelete: Cascade)
  @@index([user_id], map: "idx_training_plans_user_id")
}

model analytics_events {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id String? @db.Uuid
  // existing fields stay unchanged
  user users? @relation(fields: [user_id], references: [id], onDelete: SetNull)
}
```

- [ ] **Step 2: Add migration SQL**

Create `server/prisma/migrations/20260518140000_add_app_auth/migration.sql`:

```sql
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauth_accounts_provider_provider_account_id_key"
    ON "oauth_accounts"("provider", "provider_account_id");
CREATE INDEX "idx_oauth_accounts_email" ON "oauth_accounts"("email");
CREATE INDEX "idx_oauth_accounts_user_id" ON "oauth_accounts"("user_id");

CREATE TABLE "user_sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX "idx_user_sessions_expire" ON "user_sessions"("expire");

ALTER TABLE "oauth_accounts"
    ADD CONSTRAINT "oauth_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "training_plans"
    ADD CONSTRAINT "training_plans_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
```

- [ ] **Step 3: Validate schema**

Run:

```bash
npm run db:generate --prefix server
```

Expected: Prisma client generation succeeds and updates `server/generated/`.

- [ ] **Step 4: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/20260518140000_add_app_auth/migration.sql
git commit -m "feat: add app auth schema"
```

---

### Task 3: OAuth Account Linking Service

**Files:**
- Create: `server/src/lib/oauth.ts`
- Create: `server/src/lib/oauth.unit.test.ts`
- Test: `server/src/lib/oauth.unit.test.ts`

- [ ] **Step 1: Write failing tests**

Create `server/src/lib/oauth.unit.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findOrCreateOAuthUser, normalizeEmail } from "./oauth";
import { prisma } from "./prisma";

vi.mock("./prisma", () => ({
  prisma: {
    oauth_accounts: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    users: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as {
  oauth_accounts: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  users: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
};

describe("normalizeEmail", () => {
  it("trims and lowercases email addresses", () => {
    expect(normalizeEmail("  IAN@Example.COM ")).toBe("ian@example.com");
  });
});

describe("findOrCreateOAuthUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reuses an existing provider account", async () => {
    mockedPrisma.oauth_accounts.findUnique.mockResolvedValue({
      user: { id: "user-1", email: "ian@example.com", name: "Ian", avatar_url: null, oauth_accounts: [] },
    });

    const result = await findOrCreateOAuthUser({
      provider: "google",
      providerAccountId: "google-123",
      email: "ian@example.com",
      emailVerified: true,
      name: "Ian",
      avatarUrl: null,
    });

    expect(result.id).toBe("user-1");
    expect(mockedPrisma.users.create).not.toHaveBeenCalled();
  });

  it("links a new provider to an existing verified email", async () => {
    mockedPrisma.oauth_accounts.findUnique.mockResolvedValue(null);
    mockedPrisma.users.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ian@example.com",
      name: "Ian",
      avatar_url: null,
    });
    mockedPrisma.oauth_accounts.create.mockResolvedValue({});

    const result = await findOrCreateOAuthUser({
      provider: "github",
      providerAccountId: "gh-123",
      email: "IAN@example.com",
      emailVerified: true,
      name: "Ian",
      avatarUrl: "https://example.com/avatar.png",
    });

    expect(result.id).toBe("user-1");
    expect(mockedPrisma.oauth_accounts.create).toHaveBeenCalledWith({
      data: {
        provider: "github",
        provider_account_id: "gh-123",
        email: "ian@example.com",
        user_id: "user-1",
      },
    });
  });

  it("creates a user for a first verified provider login", async () => {
    mockedPrisma.oauth_accounts.findUnique.mockResolvedValue(null);
    mockedPrisma.users.findUnique.mockResolvedValue(null);
    mockedPrisma.users.create.mockResolvedValue({
      id: "user-2",
      email: "ian@example.com",
      name: "Ian",
      avatar_url: null,
    });
    mockedPrisma.oauth_accounts.create.mockResolvedValue({});

    const result = await findOrCreateOAuthUser({
      provider: "google",
      providerAccountId: "google-456",
      email: "ian@example.com",
      emailVerified: true,
      name: "Ian",
      avatarUrl: null,
    });

    expect(result.id).toBe("user-2");
    expect(mockedPrisma.users.create).toHaveBeenCalledWith({
      data: {
        email: "ian@example.com",
        name: "Ian",
        avatar_url: null,
      },
    });
  });

  it("rejects unverified provider emails", async () => {
    await expect(findOrCreateOAuthUser({
      provider: "google",
      providerAccountId: "google-789",
      email: "ian@example.com",
      emailVerified: false,
      name: null,
      avatarUrl: null,
    })).rejects.toThrow("A verified email is required to sign in.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:unit -- server/src/lib/oauth.unit.test.ts
```

Expected: FAIL because `server/src/lib/oauth.ts` does not exist.

- [ ] **Step 3: Implement OAuth user linking**

Create `server/src/lib/oauth.ts`:

```ts
import { prisma } from "./prisma";

export type OAuthProvider = "google" | "github";

export interface OAuthProfileInput {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string | null | undefined;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
}

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  providers?: OAuthProvider[];
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUser(user: { id: string; email: string; name: string | null; avatar_url: string | null }): AppUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
  };
}

export async function findOrCreateOAuthUser(input: OAuthProfileInput): Promise<AppUser> {
  if (!input.email || !input.emailVerified) {
    throw new Error("A verified email is required to sign in.");
  }

  const email = normalizeEmail(input.email);

  const existingAccount = await prisma.oauth_accounts.findUnique({
    where: {
      provider_provider_account_id: {
        provider: input.provider,
        provider_account_id: input.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount?.user) {
    return mapUser(existingAccount.user);
  }

  let user = await prisma.users.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.users.create({
      data: {
        email,
        name: input.name,
        avatar_url: input.avatarUrl,
      },
    });
  } else if ((!user.name && input.name) || (!user.avatar_url && input.avatarUrl)) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: {
        name: user.name ?? input.name,
        avatar_url: user.avatar_url ?? input.avatarUrl,
        updated_at: new Date(),
      },
    });
  }

  await prisma.oauth_accounts.create({
    data: {
      user_id: user.id,
      provider: input.provider,
      provider_account_id: input.providerAccountId,
      email,
    },
  });

  return mapUser(user);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm run test:unit -- server/src/lib/oauth.unit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/oauth.ts server/src/lib/oauth.unit.test.ts
git commit -m "feat: add oauth user linking"
```

---

### Task 4: Session Middleware And Auth Middleware

**Files:**
- Modify: `server/src/lib/prisma.ts`
- Create: `server/src/lib/session.ts`
- Replace: `server/src/lib/auth.ts`
- Replace: `server/src/lib/auth.unit.test.ts`
- Test: `server/src/lib/auth.unit.test.ts`

- [ ] **Step 1: Write failing session auth tests**

Replace `server/src/lib/auth.unit.test.ts` with:

```ts
import type { NextFunction, Request, Response } from "express";
import { describe, expect, it } from "vitest";
import { requireAuth, resolveOptionalAuth } from "./auth";

function response() {
  return {
    statusCode: 200,
    jsonBody: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.jsonBody = payload;
      return this;
    },
  };
}

describe("session requireAuth", () => {
  it("rejects requests without a session user", async () => {
    const req = { user: undefined, isAuthenticated: () => false } as unknown as Request;
    const res = response() as Response & { statusCode: number; jsonBody: unknown };
    let nextCalled = false;

    await requireAuth(req, res, (() => { nextCalled = true; }) as NextFunction);

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonBody).toEqual({ error: "Authentication required" });
  });

  it("attaches authenticated session context", async () => {
    const req = {
      user: { id: "550e8400-e29b-41d4-a716-446655440000", email: "ian@example.com", name: null, avatarUrl: null },
      isAuthenticated: () => true,
    } as unknown as Request;
    const res = response() as Response;
    let nextCalled = false;

    await requireAuth(req, res, (() => { nextCalled = true; }) as NextFunction);

    expect(nextCalled).toBe(true);
    expect((req as any).auth.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});

describe("resolveOptionalAuth", () => {
  it("returns null when the request is anonymous", async () => {
    const req = { user: undefined, isAuthenticated: () => false } as unknown as Request;
    await expect(resolveOptionalAuth(req)).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:unit -- server/src/lib/auth.unit.test.ts
```

Expected: FAIL because current auth middleware expects Neon bearer tokens.

- [ ] **Step 3: Export the Postgres pool**

Modify `server/src/lib/prisma.ts`:

```ts
import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;

export const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

- [ ] **Step 4: Add session middleware**

Create `server/src/lib/session.ts`:

```ts
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./prisma";

const PgSession = connectPgSimple(session);

export function createSessionMiddleware() {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is required");
  }

  const isProduction = process.env.NODE_ENV === "production";

  return session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: false,
    }),
    name: "gymai.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  });
}
```

- [ ] **Step 5: Replace auth middleware**

Replace `server/src/lib/auth.ts`:

```ts
import type { NextFunction, Request, Response } from "express";
import type { AppUser } from "./oauth";

declare global {
  namespace Express {
    interface User extends AppUser {}
  }
}

export interface AuthContext {
  user: AppUser;
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

function getSessionUser(req: Request): AppUser | null {
  if (typeof req.isAuthenticated === "function" && !req.isAuthenticated()) {
    return null;
  }

  const user = req.user as AppUser | undefined;
  return user?.id ? user : null;
}

export async function resolveOptionalAuth(req: Request): Promise<AuthContext | null> {
  const user = getSessionUser(req);
  return user ? { user, userId: user.id } : null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = await resolveOptionalAuth(req);

  if (!auth) {
    return res.status(401).json({ error: "Authentication required" });
  }

  (req as AuthenticatedRequest).auth = auth;
  return next();
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
npm run test:unit -- server/src/lib/auth.unit.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/src/lib/prisma.ts server/src/lib/session.ts server/src/lib/auth.ts server/src/lib/auth.unit.test.ts
git commit -m "feat: add session auth middleware"
```

---

### Task 5: Passport And Auth Routes

**Files:**
- Create: `server/src/routes/auth.ts`
- Modify: `server/src/app.ts`
- Create: `server/src/routes/auth.unit.test.ts`
- Test: `server/src/routes/auth.unit.test.ts`

- [ ] **Step 1: Write failing auth route tests**

Create `server/src/routes/auth.unit.test.ts` with mocked Passport/session behavior:

```ts
import { describe, expect, it, vi } from "vitest";
import { invokeExpressRoute } from "../../../test/helpers/express-test-utils";

vi.mock("../lib/prisma", () => ({
  prisma: {
    users: {
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "dev@example.com",
        name: "Dev User",
        avatar_url: null,
      }),
    },
    oauth_accounts: {
      findMany: vi.fn().mockResolvedValue([{ provider: "dev" }]),
    },
  },
  pool: {},
}));

import { createApp } from "../app";

describe("auth routes", () => {
  it("returns 401 for anonymous /api/auth/me", async () => {
    const app = createApp();

    const res = await invokeExpressRoute(app, {
      method: "GET",
      url: "/api/auth/me",
    });

    expect(res.status).toBe(401);
  });

  it("blocks dev login in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const app = createApp();

    const res = await invokeExpressRoute(app, {
      method: "POST",
      url: "/api/auth/dev-login",
    });

    process.env.NODE_ENV = originalEnv;
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:unit -- server/src/routes/auth.unit.test.ts
```

Expected: FAIL because `server/src/routes/auth.ts` and app wiring do not exist.

- [ ] **Step 3: Implement auth router**

Create `server/src/routes/auth.ts`:

```ts
import { Router, type Request, type Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { findOrCreateOAuthUser, type AppUser } from "../lib/oauth";
import { prisma } from "../lib/prisma";

export const authRouter = Router();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function configurePassport() {
  passport.serializeUser((user, done) => done(null, (user as AppUser).id));

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.users.findUnique({ where: { id } });
      if (!user) return done(null, false);
      done(null, { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url });
    } catch (error) {
      done(error);
    }
  });

  passport.use(new GoogleStrategy({
    clientID: requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    callbackURL: `${requireEnv("API_BASE_URL")}/api/auth/google/callback`,
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value ?? null;
      const emailVerified = profile.emails?.[0]?.verified === true;
      const user = await findOrCreateOAuthUser({
        provider: "google",
        providerAccountId: profile.id,
        email,
        emailVerified,
        name: profile.displayName ?? null,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      });
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }));

  passport.use(new GitHubStrategy({
    clientID: requireEnv("GITHUB_CLIENT_ID"),
    clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
    callbackURL: `${requireEnv("API_BASE_URL")}/api/auth/github/callback`,
    scope: ["user:email"],
  }, async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const emailRecord = profile.emails?.find((item: { value?: string; verified?: boolean }) => item.verified)
        ?? profile.emails?.[0];
      const user = await findOrCreateOAuthUser({
        provider: "github",
        providerAccountId: profile.id,
        email: emailRecord?.value ?? null,
        emailVerified: emailRecord?.verified === true,
        name: profile.displayName ?? profile.username ?? null,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      });
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }));
}

function authSuccessRedirect() {
  return `${process.env.APP_ORIGIN || "http://localhost:5173"}/profile`;
}

function authFailureRedirect() {
  return `${process.env.APP_ORIGIN || "http://localhost:5173"}/auth/sign-in?error=oauth`;
}

authRouter.get("/me", async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const providers = await prisma.oauth_accounts.findMany({
    where: { user_id: (req.user as AppUser).id },
    select: { provider: true },
  });
  return res.json({ user: { ...(req.user as AppUser), providers: providers.map((account) => account.provider) } });
});

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get("/google/callback", passport.authenticate("google", {
  failureRedirect: authFailureRedirect(),
  successRedirect: authSuccessRedirect(),
}));

authRouter.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
authRouter.get("/github/callback", passport.authenticate("github", {
  failureRedirect: authFailureRedirect(),
  successRedirect: authSuccessRedirect(),
}));

authRouter.post("/logout", (req: Request, res: Response) => {
  req.logout((logoutError) => {
    if (logoutError) return res.status(500).json({ error: "Failed to sign out" });
    req.session.destroy((sessionError) => {
      if (sessionError) return res.status(500).json({ error: "Failed to destroy session" });
      res.clearCookie("gymai.sid");
      return res.json({ success: true });
    });
  });
});

authRouter.post("/dev-login", async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  const user = await prisma.users.create({
    data: {
      email: "dev@example.com",
      name: "Dev User",
      avatar_url: null,
    },
  }).catch(async () => prisma.users.findUniqueOrThrow({ where: { email: "dev@example.com" } }));

  req.login({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url }, (error) => {
    if (error) return res.status(500).json({ error: "Failed to create dev session" });
    return res.json({ user: req.user });
  });
});
```

- [ ] **Step 4: Wire sessions, Passport, auth routes, and credentialed CORS**

Modify `server/src/app.ts`:

```ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { analyticsRouter } from "./routes/analytics";
import { authRouter, configurePassport } from "./routes/auth";
import { apiRateLimiter } from "./lib/server-runtime";
import { createRateLimitMiddleware } from "./lib/rate-limit";
import { getRequestIp } from "./lib/request";
import { profileRouter } from "./routes/profile";
import { planRouter } from "./routes/plan";
import { createSessionMiddleware } from "./lib/session";

let passportConfigured = false;

export function createApp() {
  const app = express();
  const appOrigin = process.env.APP_ORIGIN || "http://localhost:5173";

  if (!passportConfigured) {
    configurePassport();
    passportConfigured = true;
  }

  app.use(cors({
    origin: appOrigin,
    credentials: true,
    exposedHeaders: ["X-Cache", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(createSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/api/auth", authRouter);
  app.use("/api", createRateLimitMiddleware(apiRateLimiter, {
    key: (req) => `ip:${getRequestIp(req)}`,
    limit: Number(process.env.API_RATE_LIMIT_MAX || 120),
    windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 900000),
    message: "Too many API requests. Please try again shortly.",
  }));

  app.use("/api/analytics", analyticsRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/plan", planRouter);

  return app;
}
```

- [ ] **Step 5: Run auth route tests**

Run:

```bash
npm run test:unit -- server/src/routes/auth.unit.test.ts server/src/lib/auth.unit.test.ts
```

Expected: PASS. Set `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `APP_ORIGIN`, and `API_BASE_URL` inside the test `beforeEach` when the router initializes Passport.

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/auth.ts server/src/routes/auth.unit.test.ts server/src/app.ts
git commit -m "feat: add passport auth routes"
```

---

### Task 6: Update Server Route Tests For Session Auth

**Files:**
- Modify: `test/helpers/server-test-utils.ts`
- Modify: `server/src/routes/app.integration.test.ts`
- Modify: `server/src/routes/plan.perf.test.ts`
- Test: server route integration tests

- [ ] **Step 1: Update test helper constants**

Change `TEST_USER_ID` to a UUID and replace bearer helpers:

```ts
export const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

export function createAuthenticatedSessionUser() {
  return {
    id: TEST_USER_ID,
    email: "test@example.com",
    name: "Test User",
    avatarUrl: null,
  };
}

export function createAuthenticatedHeaders() {
  return {
    "x-test-auth": TEST_USER_ID,
  };
}
```

- [ ] **Step 2: Update auth mocks in integration/perf tests**

Replace mocked `requireAuth` and `resolveOptionalAuth` bodies with:

```ts
requireAuth: vi.fn(async (req, res, next) => {
  if (!req.header("x-test-auth")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.auth = {
    user: {
      id: TEST_USER_ID,
      email: "test@example.com",
      name: "Test User",
      avatarUrl: null,
    },
    userId: TEST_USER_ID,
  };

  return next();
}),
resolveOptionalAuth: vi.fn(async (req) => {
  if (!req.header("x-test-auth")) {
    return null;
  }

  return {
    user: {
      id: TEST_USER_ID,
      email: "test@example.com",
      name: "Test User",
      avatarUrl: null,
    },
    userId: TEST_USER_ID,
  };
}),
```

- [ ] **Step 3: Run integration tests**

Run:

```bash
npm run test:integration -- server/src/routes/app.integration.test.ts server/src/routes/plan.perf.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add test/helpers/server-test-utils.ts server/src/routes/app.integration.test.ts server/src/routes/plan.perf.test.ts
git commit -m "test: update server routes for session auth"
```

---

### Task 7: Frontend Auth Client And API Credentials

**Files:**
- Replace: `src/lib/auth.ts`
- Modify: `src/lib/api.ts`
- Modify: `src/lib/analytics.ts`
- Modify: `src/lib/api.unit.test.ts`
- Modify: `src/lib/analytics.unit.test.ts`
- Test: frontend unit tests

- [ ] **Step 1: Update failing API tests**

Replace auth-token expectations in `src/lib/api.unit.test.ts`:

```ts
it("sends profile requests with cookie credentials", async () => {
  vi.mocked(fetch).mockResolvedValue(createJsonResponse({ success: true }));

  await api.saveProfile({
    goal: "strength",
    experience: "beginner",
    daysPerWeek: 4,
    sessionDuration: 60,
    equipment: "full_gym",
    injuries: "",
    generalNotes: "",
    preferredSplit: "upper_lower",
  });

  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:3001/api/profile",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );
});

it("sends GET requests with cookie credentials", async () => {
  vi.mocked(fetch).mockResolvedValue(createJsonResponse({ id: "plan_1" }));

  await api.getCurrentPlan();

  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:3001/api/plan/current",
    expect.objectContaining({
      credentials: "include",
    }),
  );
});
```

Update `src/lib/analytics.unit.test.ts` to expect:

```ts
expect(fetch).toHaveBeenCalledWith(
  "http://localhost:3001/api/analytics/events",
  expect.objectContaining({
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
  }),
);
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test:unit -- src/lib/api.unit.test.ts src/lib/analytics.unit.test.ts
```

Expected: FAIL because code still imports `getAuthToken` and sends Authorization headers.

- [ ] **Step 3: Replace frontend auth helpers**

Replace `src/lib/auth.ts`:

```ts
import type { User } from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || "Failed to load user");
  }

  const data = await res.json();
  return data.user;
}

export async function signOut() {
  const res = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || "Failed to sign out");
  }
}

export async function devLogin(): Promise<User> {
  const res = await fetch(`${BASE_URL}/api/auth/dev-login`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || "Failed to create dev session");
  }

  const data = await res.json();
  return data.user;
}
```

- [ ] **Step 4: Update API client**

Modify `src/lib/api.ts` to remove `getAuthToken` and use:

```ts
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function post(path: string, body: object) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  }
  return res.json();
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  }
  return res.json();
}
```

- [ ] **Step 5: Update analytics client**

Modify `src/lib/analytics.ts` fetch call to include:

```ts
credentials: "include",
headers: {
  "Content-Type": "application/json",
},
```

Remove any `getAuthToken` import and Authorization header handling.

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test:unit -- src/lib/api.unit.test.ts src/lib/analytics.unit.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/lib/api.ts src/lib/analytics.ts src/lib/api.unit.test.ts src/lib/analytics.unit.test.ts
git commit -m "feat: use cookie sessions in frontend clients"
```

---

### Task 8: Frontend Auth Provider And UI Removal Of Neon

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/context/auth-context.ts`
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/App.tsx`
- Replace: `src/pages/Auth.tsx`
- Replace: `src/pages/Account.tsx`
- Modify: `src/pages/Onboarding.tsx`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/index.css`
- Test: frontend unit/build

- [ ] **Step 1: Update user and context types**

In `src/types/index.ts`, change `User`:

```ts
export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  providers?: string[];
  createdAt?: string;
}
```

In `src/context/auth-context.ts`, add:

```ts
signOut: () => Promise<void>;
devLogin: () => Promise<void>;
```

- [ ] **Step 2: Update `AuthContext.tsx`**

Replace Neon session loading with:

```ts
import { devLogin as createDevSession, getCurrentUser, signOut as destroySession } from "@/lib/auth";
```

Use `getCurrentUser()` in `loadUser()`. Add:

```ts
const signOut = useCallback(async () => {
  await destroySession();
  setNeonUser(null);
  setPlan(null);
}, []);

const devLogin = useCallback(async () => {
  const user = await createDevSession();
  setNeonUser(user);
  const planData = await api.getCurrentPlan().catch(() => null);
  setPlan(planData ? mapPlan(planData as PlanResponse) : null);
}, []);
```

Rename `neonUser` state to `user` during this edit.

- [ ] **Step 3: Remove Neon provider from app root**

In `src/App.tsx`, remove:

```ts
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import { authClient } from "./lib/auth";
```

Return:

```tsx
<AuthProvider>
  <BrowserRouter>
    {/* existing route tree */}
  </BrowserRouter>
</AuthProvider>
```

- [ ] **Step 4: Replace `Auth.tsx`**

Use app-owned buttons:

```tsx
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const isDev = import.meta.env.DEV;

<a href={`${API_URL}/api/auth/google`}>
  <Button type="button">Continue with Google</Button>
</a>
<a href={`${API_URL}/api/auth/github`}>
  <Button type="button" variant="secondary">Continue with GitHub</Button>
</a>
{isDev ? (
  <Button type="button" variant="ghost" onClick={async () => { await devLogin(); navigate("/profile"); }}>
    Continue as Dev User
  </Button>
) : null}
```

Keep the current marketing copy and layout, but remove `AuthView`.

- [ ] **Step 5: Replace `Account.tsx`**

Render local account controls:

```tsx
const { user, signOut } = useAuth();
if (!user) return <Navigate to="/auth/sign-in" replace />;

<p>{user.email}</p>
<p>{user.providers?.join(", ") || "OAuth"}</p>
<Button onClick={async () => { await signOut(); navigate("/"); }}>
  Sign out
</Button>
```

- [ ] **Step 6: Replace Neon route guards**

In `src/pages/Onboarding.tsx`, remove Neon imports and replace:

```tsx
if (!user) {
  return <Navigate to="/auth/sign-in" replace />;
}

return (
  <div className="min-h-screen pt-24 pb-12 px-6">
    {/* existing content */}
  </div>
);
```

- [ ] **Step 7: Replace navbar account control**

In `src/components/layout/Navbar.tsx`, remove `UserButton` and render:

```tsx
<Button variant="ghost" size="sm" onClick={signOut}>
  Sign Out
</Button>
```

or keep sign-out on the account page and show a compact link with the user's email.

- [ ] **Step 8: Remove Neon CSS**

In `src/index.css`, remove:

```css
@import "@neondatabase/neon-js/ui/tailwind";
```

Remove `.neon-auth-shell` override blocks.

- [ ] **Step 9: Add AuthProvider load test**

Create `src/context/AuthContext.unit.test.tsx`:

```tsx
// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthProvider from "./AuthContext";
import { useAuth } from "./useAuth";
import { getCurrentUser } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
  signOut: vi.fn(),
  devLogin: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    getCurrentPlan: vi.fn().mockRejectedValue(new Error("No plan")),
  },
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

function Probe() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <span>Loading</span>;
  return <span>{user?.email ?? "Anonymous"}</span>;
}

describe("AuthProvider", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the current session user from the auth API", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "dev@example.com",
      name: "Dev User",
      avatarUrl: null,
      providers: ["dev"],
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("dev@example.com")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 10: Verify no Neon imports remain**

Run:

```bash
rg -n "@neondatabase|Neon|neon-auth|AuthView|AccountView|UserButton|SignedIn|RedirectToSignIn" src server package.json server/package.json
```

Expected: no runtime references remain. README may still mention Neon until Task 9.

- [ ] **Step 11: Build and test frontend**

Run:

```bash
npm run test:unit -- src/lib/api.unit.test.ts src/lib/analytics.unit.test.ts src/context/AuthContext.unit.test.tsx
npm run build
```

Expected: PASS and build succeeds.

- [ ] **Step 12: Uninstall Neon package**

Run:

```bash
npm uninstall @neondatabase/neon-js
```

- [ ] **Step 13: Commit**

```bash
git add src package.json package-lock.json
git commit -m "feat: replace neon auth frontend"
```

---

### Task 9: README And Environment Documentation

**Files:**
- Modify: `README.md`
- Test: docs commands

- [ ] **Step 1: Update tech stack**

Replace:

```md
- Auth: Neon Auth
```

with:

```md
- Auth: Express sessions with Passport.js, Google OAuth, and GitHub OAuth
```

- [ ] **Step 2: Update local setup**

Document root `.env`:

```env
VITE_API_URL="http://localhost:3001"
```

Document `server/.env`:

```env
DATABASE_URL="postgresql://gymai:gymai@localhost:5432/gymai"
SESSION_SECRET="replace-with-a-long-random-string"
APP_ORIGIN="http://localhost:5173"
API_BASE_URL="http://localhost:3001"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
OPEN_ROUTER_KEY="your-openrouter-key"
PORT=3001
```

Add local DB commands:

```bash
docker compose up -d postgres
npm run db:generate --prefix server
npm run db:migrate --prefix server
```

Add dev login note:

```md
In development, the sign-in page includes a dev login button that creates a local session without Google or GitHub credentials. It is disabled when `NODE_ENV=production`.
```

- [ ] **Step 3: Verify docs commands exist**

Run:

```bash
npm run --prefix server
```

Expected: output lists `db:generate`, `db:migrate`, `db:reset`, and `db:studio`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update local auth setup"
```

---

### Task 10: Full Verification

**Files:**
- Verification task. Source edits are limited to failures found by the commands below.
- Test: full test/build flow

- [ ] **Step 1: Start local database**

Run:

```bash
docker compose up -d postgres
```

Expected: Postgres container becomes healthy.

- [ ] **Step 2: Apply Prisma setup**

Run:

```bash
npm run db:generate --prefix server
npm run db:migrate --prefix server
```

Expected: Prisma generate and migrations succeed.

- [ ] **Step 3: Run unit tests**

Run:

```bash
npm run test:unit
```

Expected: PASS.

- [ ] **Step 4: Run integration tests**

Run:

```bash
npm run test:integration
```

Expected: PASS.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Run metrics**

Run:

```bash
npm run test:metrics
```

Expected: PASS and `test-results/metrics-summary.json` updates.

- [ ] **Step 7: Manual dev login smoke test**

Run server:

```bash
npm run dev:server --prefix server
```

Run frontend:

```bash
npm run dev
```

Manual checks:

- Visit `/auth/sign-in`.
- Click dev login.
- Confirm redirect to `/profile` or `/onboarding`.
- Complete onboarding if no profile exists.
- Generate a plan.
- Open account page and confirm email/providers render.
- Sign out and confirm protected pages redirect to sign in.

- [ ] **Step 8: Final cleanup**

Run:

```bash
git status --short
rg -n "@neondatabase|NEON|Neon|neon" src server README.md package.json server/package.json
```

Expected: no unexpected worktree changes and no Neon runtime references.

- [ ] **Step 9: Commit verification fixes**

When verification required fixes, stage the files reported by `git status --short` that belong to this migration and commit them:

```bash
git add server/src/lib/auth.ts server/src/routes/auth.ts src/lib/auth.ts src/context/AuthContext.tsx README.md
git commit -m "fix: complete oauth migration verification"
```

When no verification fixes were required, skip this step and do not create an empty commit.

---

## Self-Review

Spec coverage:

- Direct Google/GitHub OAuth through Express and Passport is covered in Tasks 3 and 5.
- HTTP-only Postgres sessions are covered in Tasks 2, 4, and 5.
- Local Docker Postgres is covered in Tasks 1 and 10.
- Fresh auth cutover and app-owned user IDs are covered in Task 2.
- Frontend removal of Neon and cookie credentials are covered in Tasks 7 and 8.
- README and AWS deferral are covered in Task 9.
- Tests and manual verification are covered throughout and finalized in Task 10.

Placeholder scan:

- The plan contains concrete file paths, commands, and code snippets for each implementation task.

Type consistency:

- `AppUser.id`, `AuthContext.userId`, and existing route `userId` usage all use string UUIDs.
- Frontend `User.avatarUrl` matches server `AppUser.avatarUrl`; database field remains `avatar_url`.
- Provider names are `google` and `github` in service code, routes, and UI.
