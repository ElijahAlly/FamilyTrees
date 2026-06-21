import { defineEventHandler, getHeader, createError } from 'h3';
import { db } from '../../db';
import { authUsers, people } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '../../utils/jwt';

/**
 * OAuth2 UserInfo endpoint (subset of OIDC).
 * Caller presents the access token issued by /api/oauth/token.
 */
export default defineEventHandler(async (event) => {
    const header = getHeader(event, 'authorization');
    if (!header?.startsWith('Bearer '))
        throw createError({ statusCode: 401, statusMessage: 'Bearer token required' });

    let claims;
    try {
        claims = await verifyToken(header.slice('Bearer '.length));
    } catch {
        throw createError({ statusCode: 401, statusMessage: 'Invalid or expired token' });
    }

    const scopes = (claims.scope || '').split(/\s+/).filter(Boolean);
    if (!scopes.includes('profile')) {
        // Always return at least sub (subject) per OIDC; the `profile` scope
        // adds email/name.
        return { sub: claims.userId };
    }

    const [user] = await db
        .select({ id: authUsers.id, email: authUsers.email, createdAt: authUsers.createdAt })
        .from(authUsers)
        .where(eq(authUsers.id, claims.userId))
        .limit(1);
    if (!user)
        throw createError({ statusCode: 404, statusMessage: 'User not found' });

    const [profile] = await db
        .select({ firstName: people.firstName, lastName: people.lastName, profilePicture: people.profilePicture })
        .from(people)
        .where(eq(people.userId, user.id))
        .limit(1);

    return {
        sub: user.id,
        email: user.email,
        email_verified: true,
        name: profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : undefined,
        given_name: profile?.firstName,
        family_name: profile?.lastName,
        picture: profile?.profilePicture || undefined,
    };
});
