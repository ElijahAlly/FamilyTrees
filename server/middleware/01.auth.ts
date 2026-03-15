import { defineEventHandler, getHeader, createError } from 'h3';
import { verifyToken } from '../utils/jwt';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/verify-otp',
    '/api/auth/check-user-exists',
    '/api/get-family-by-id',
    '/api/get-families-by-name',
    '/api/get-families-by-person-id',
    '/api/get-families-by-created-by-person-id',
    '/api/get-random-people',
    '/api/get-plans',
    '/api/get-all-matching-by-name',
    '/api/invites/verify',
    '/api/temp-access/verify',
];

function isPublicRoute(path: string): boolean {
    // Non-API routes (pages, assets) are always public
    if (!path.startsWith('/api/')) return true;
    // OpenAPI docs
    if (path.startsWith('/api/_openapi')) return true;
    // Nuxt internal APIs (icons, etc.)
    if (path.startsWith('/api/_nuxt')) return true;
    // GPapics media proxy
    if (path.startsWith('/api/gpapics-media/')) return true;
    return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

export default defineEventHandler(async (event) => {
    const path = (event.path || '').split('?')[0];

    if (isPublicRoute(path)) return;

    const authHeader = getHeader(event, 'authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    try {
        const payload = await verifyToken(token);
        event.context.auth = { userId: payload.userId, email: payload.email };
    } catch {
        throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' });
    }
});
