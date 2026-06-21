import { defineEventHandler, readBody, getHeader } from 'h3';
import { db } from '../../db';
import { oauthRefreshTokens } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * RFC 7009 — revoke a refresh token. Always returns 200 (so a caller can't
 * use error responses to enumerate valid tokens).
 */
export default defineEventHandler(async (event) => {
    const raw = await readBody(event);
    const body = typeof raw === 'string'
        ? Object.fromEntries(new URLSearchParams(raw))
        : raw;

    // (Optional) Basic-auth header for client creds — same parsing as /token.
    // We don't strictly require client auth to revoke a token a client owns.
    const basic = getHeader(event, 'authorization');
    if (basic?.startsWith('Basic ')) { /* ignored for revocation */ }

    const token = body.token || body.refresh_token;
    if (token) {
        await db
            .update(oauthRefreshTokens)
            .set({ revokedAt: new Date() })
            .where(eq(oauthRefreshTokens.token, token));
    }
    return { ok: true };
});
