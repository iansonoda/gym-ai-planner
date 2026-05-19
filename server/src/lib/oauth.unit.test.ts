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

  it("reuses an existing provider account without requiring a verified email", async () => {
    mockedPrisma.oauth_accounts.findUnique.mockResolvedValue({
      user: { id: "user-1", email: "ian@example.com", name: "Ian", avatar_url: null, oauth_accounts: [] },
    });

    const result = await findOrCreateOAuthUser({
      provider: "google",
      providerAccountId: "google-123",
      email: null,
      emailVerified: false,
      name: null,
      avatarUrl: null,
    });

    expect(result.id).toBe("user-1");
    expect(mockedPrisma.users.findUnique).not.toHaveBeenCalled();
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

  it("recovers from duplicate user email creation by linking the existing user", async () => {
    const uniqueConflict = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

    mockedPrisma.oauth_accounts.findUnique.mockResolvedValue(null);
    mockedPrisma.users.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "user-1",
        email: "ian@example.com",
        name: "Ian",
        avatar_url: null,
      });
    mockedPrisma.users.create.mockRejectedValue(uniqueConflict);
    mockedPrisma.oauth_accounts.create.mockResolvedValue({});

    const result = await findOrCreateOAuthUser({
      provider: "google",
      providerAccountId: "google-456",
      email: "ian@example.com",
      emailVerified: true,
      name: "Ian",
      avatarUrl: null,
    });

    expect(result.id).toBe("user-1");
    expect(mockedPrisma.oauth_accounts.create).toHaveBeenCalledWith({
      data: {
        provider: "google",
        provider_account_id: "google-456",
        email: "ian@example.com",
        user_id: "user-1",
      },
    });
  });

  it("recovers from duplicate oauth account creation by returning the linked user", async () => {
    const uniqueConflict = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

    mockedPrisma.oauth_accounts.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        user: { id: "user-1", email: "ian@example.com", name: "Ian", avatar_url: null, oauth_accounts: [] },
      });
    mockedPrisma.users.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ian@example.com",
      name: "Ian",
      avatar_url: null,
    });
    mockedPrisma.oauth_accounts.create.mockRejectedValue(uniqueConflict);

    const result = await findOrCreateOAuthUser({
      provider: "github",
      providerAccountId: "gh-123",
      email: "ian@example.com",
      emailVerified: true,
      name: "Ian",
      avatarUrl: null,
    });

    expect(result.id).toBe("user-1");
    expect(mockedPrisma.oauth_accounts.findUnique).toHaveBeenCalledTimes(2);
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
