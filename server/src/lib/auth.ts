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
