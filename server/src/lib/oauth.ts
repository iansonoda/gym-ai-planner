import { Prisma } from "../../generated/prisma/client";
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

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError
    ? error.code === "P2002"
    : typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function findProviderAccount(input: OAuthProfileInput) {
  return prisma.oauth_accounts.findUnique({
    where: {
      provider_provider_account_id: {
        provider: input.provider,
        provider_account_id: input.providerAccountId,
      },
    },
    include: { user: true },
  });
}

export async function findOrCreateOAuthUser(input: OAuthProfileInput): Promise<AppUser> {
  const existingAccount = await findProviderAccount(input);

  if (existingAccount?.user) {
    return mapUser(existingAccount.user);
  }

  if (!input.email || !input.emailVerified) {
    throw new Error("A verified email is required to sign in.");
  }

  const email = normalizeEmail(input.email);

  let user = await prisma.users.findUnique({ where: { email } });

  if (!user) {
    try {
      user = await prisma.users.create({
        data: {
          email,
          name: input.name,
          avatar_url: input.avatarUrl,
        },
      });
    } catch (error) {
      if (!isUniqueConflict(error)) {
        throw error;
      }

      user = await prisma.users.findUnique({ where: { email } });
      if (!user) {
        throw error;
      }
    }
  } else if ((!user.name && input.name) || (!user.avatar_url && input.avatarUrl)) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: {
        name: user.name ?? input.name,
        avatar_url: user.avatar_url ?? input.avatarUrl,
        updated_at: new Date(),
      },
    }) ?? user;
  }

  try {
    await prisma.oauth_accounts.create({
      data: {
        user_id: user.id,
        provider: input.provider,
        provider_account_id: input.providerAccountId,
        email,
      },
    });
  } catch (error) {
    if (!isUniqueConflict(error)) {
      throw error;
    }

    const linkedAccount = await findProviderAccount(input);
    if (linkedAccount?.user) {
      return mapUser(linkedAccount.user);
    }

    throw error;
  }

  return mapUser(user);
}
