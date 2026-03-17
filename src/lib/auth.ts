import { createAuthClient } from '@neondatabase/neon-js/auth';

export const authClient = createAuthClient(
    import.meta.env.VITE_NEON_AUTH_URL
);

export async function getAuthToken() {
    const sessionResult = await authClient.getSession();
    const sessionData = sessionResult?.data;

    if (sessionData && "session" in sessionData && sessionData.session?.token) {
        return sessionData.session.token;
    }

    return null;
}
