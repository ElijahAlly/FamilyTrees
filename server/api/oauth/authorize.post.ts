import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod/v4';
import { db } from '../../db';
import { oauthAuthorizationCodes, oauthClients } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { randomToken, validateScopes } from '../../utils/oauth';
import { requireAuth } from '../../utils/auth';

/**
 * Consent submit. Browser POSTs here from the /oauth/authorize page after
 * the user (already authenticated on mytrees.family) approves the request.
 *
 * Returns `{ redirectUrl }`. The browser navigates there to complete the
 * flow — keeping it as JSON (rather than a 302) lets the SPA send the
 * Authorization header without dealing with opaque cross-origin redirects.
 */
const schema = z.object({
    clientId: z.string(),
    redirectUri: z.url(),
    scope: z.string().optional(),
    state: z.string().optional(),
    codeChallenge: z.string().min(43).max(128),
    codeChallengeMethod: z.enum(['S256', 'plain']).default('S256'),
    decision: z.enum(['allow', 'deny']),
});

export default defineEventHandler(async (event) => {
    const { userId } = requireAuth(event);
    const body = schema.parse(await readBody(event));

    const [client] = await db
        .select()
        .from(oauthClients)
        .where(eq(oauthClients.clientId, body.clientId))
        .limit(1);

    if (!client) {
        throw createError({ statusCode: 400, statusMessage: 'Unknown client' });
    }
    if (!client.redirectUris.includes(body.redirectUri)) {
        throw createError({ statusCode: 400, statusMessage: 'redirect_uri not registered' });
    }

    const url = new URL(body.redirectUri);
    if (body.state) url.searchParams.set('state', body.state);

    if (body.decision === 'deny') {
        url.searchParams.set('error', 'access_denied');
        return { redirectUrl: url.toString() };
    }

    const grantedScope = validateScopes(body.scope, client.allowedScopes);
    if (grantedScope === null) {
        url.searchParams.set('error', 'invalid_scope');
        return { redirectUrl: url.toString() };
    }

    const code = randomToken(24);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(oauthAuthorizationCodes).values({
        code,
        clientId: client.clientId,
        userId,
        redirectUri: body.redirectUri,
        scope: grantedScope,
        codeChallenge: body.codeChallenge,
        codeChallengeMethod: body.codeChallengeMethod,
        expiresAt,
    });

    url.searchParams.set('code', code);
    return { redirectUrl: url.toString() };
});
