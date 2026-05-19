import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./prisma";

const PgSession = connectPgSimple(session);

export function createSessionMiddleware() {
  const sessionSecret =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV === "test" ? "test-session-secret" : undefined);

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
