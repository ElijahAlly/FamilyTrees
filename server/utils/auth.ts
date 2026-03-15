import type { H3Event } from 'h3';
import { createError } from 'h3';

export interface AuthContext {
    userId: string;
    email: string;
}

/**
 * Get the authenticated user from the event context.
 * Throws 401 if not authenticated.
 */
export function requireAuth(event: H3Event): AuthContext {
    const auth = event.context.auth as AuthContext | undefined;
    if (!auth?.userId) {
        throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
    }
    return auth;
}
