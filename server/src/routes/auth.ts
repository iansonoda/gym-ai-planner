import { Router, type Request, type Response } from "express";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findOrCreateOAuthUser, type AppUser } from "../lib/oauth";
import { prisma } from "../lib/prisma";

export const authRouter = Router();

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function appOrigin() {
  return process.env.APP_ORIGIN || "http://localhost:5173";
}

function apiBaseUrl() {
  return process.env.API_BASE_URL || "http://localhost:3001";
}

function authSuccessRedirect() {
  return `${appOrigin()}/profile`;
}

function authFailureRedirect() {
  return `${appOrigin()}/auth/sign-in?error=oauth`;
}

function mapDatabaseUser(user: { id: string; email: string; name: string | null; avatar_url: string | null }): AppUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
  };
}

export function configurePassport() {
  passport.serializeUser((user, done) => {
    done(null, (user as AppUser).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.users.findUnique({ where: { id } });

      if (!user) {
        return done(null, false);
      }

      return done(null, mapDatabaseUser(user));
    } catch (error) {
      return done(error);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: requireEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
        callbackURL: `${apiBaseUrl()}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
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

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: requireEnv("GITHUB_CLIENT_ID"),
        clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
        callbackURL: `${apiBaseUrl()}/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const emailRecord =
            profile.emails?.find((item: { value?: string; verified?: boolean }) => item.verified) ??
            profile.emails?.[0];
          const user = await findOrCreateOAuthUser({
            provider: "github",
            providerAccountId: profile.id,
            email: emailRecord?.value ?? null,
            emailVerified: emailRecord?.verified === true,
            name: profile.displayName ?? profile.username ?? null,
            avatarUrl: profile.photos?.[0]?.value ?? null,
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
}

authRouter.get("/me", async (req: Request, res: Response) => {
  const user = req.user as AppUser | undefined;

  if (!user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const providers = await prisma.oauth_accounts.findMany({
    where: { user_id: user.id },
    select: { provider: true },
  });

  return res.json({
    user: {
      ...user,
      providers: providers.map((account) => account.provider),
    },
  });
});

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: authFailureRedirect(),
    successRedirect: authSuccessRedirect(),
  }),
);

authRouter.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
authRouter.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: authFailureRedirect(),
    successRedirect: authSuccessRedirect(),
  }),
);

authRouter.post("/logout", (req: Request, res: Response) => {
  req.logout((logoutError) => {
    if (logoutError) {
      return res.status(500).json({ error: "Failed to sign out" });
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return res.status(500).json({ error: "Failed to destroy session" });
      }

      res.clearCookie("gymai.sid");
      return res.json({ success: true });
    });
  });
});

authRouter.post("/dev-login", async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  let user = await prisma.users.findUnique({ where: { email: "dev@example.com" } });

  if (!user) {
    user = await prisma.users.create({
      data: {
        email: "dev@example.com",
        name: "Dev User",
        avatar_url: null,
      },
    });
  }

  req.login(mapDatabaseUser(user), (error) => {
    if (error) {
      return res.status(500).json({ error: "Failed to create dev session" });
    }

    return res.json({ user: req.user });
  });
});
