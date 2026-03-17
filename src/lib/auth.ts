import { createAuthClient } from '@neondatabase/neon-js/auth';

export const authClient = createAuthClient(
    import.meta.env.VITE_NEON_AUTH_URL
);

export async function getAuthToken() {
    const clientWithToken = authClient as ReturnType<typeof createAuthClient> & {
        getJWTToken?: () => Promise<string | null>;
    };

    return clientWithToken.getJWTToken?.() ?? null;
}
