import { defineEventHandler, readBody, getHeader, createError, setResponseHeader } from 'h3';
import { z } from 'zod/v4';
import { db } from '../../db';
import {
    authUsers,
    oauthAuthorizationCodes,
    oauthClients,
    oauthRefreshTokens,
    people,
} from '../../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import {
    randomToken,
    safeEqual,
    sha256Hex,
    verifyPkce,
} from '../../utils/oauth';
import { signAccessToken } from '../../utils/jwt';

const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TTL_DAYS = 30;

/**
 * OAuth2 token endpoint — RFC 6749 §3.2.
 *
 * Supported grants:
 *   - authorization_code (with PKCE; client_secret optional for public clients)
 *   - refresh_token
 */
const codeSchema = z.object({
    grant_type: z.literal('authorization_code'),
    code: z.string(),
    redirect_uri: z.url(),
    client_id: z.string(),
    client_secret: z.string().optional(),
    code_verifier: z.string().min(43).max(128),
});

const refreshSchema = z.object({
    grant_type: z.literal('refresh_token'),
    refresh_token: z.string(),
    client_id: z.string(),
    client_secret: z.string().optional(),
    scope: z.string().optional(),
});

const oauthError = (status: number, error: string, description: string) =>
    createError({
        statusCode: status,
        statusMessage: description,
        data: { error, error_description: description },
    });

const authenticateClient = async (
    clientId: string,
    providedSecret: string | undefined,
) => {
    const [client] = await db
        .select()
        .from(oauthClients)
        .where(eq(oauthClients.clientId, clientId))
        .limit(1);

    if (!client) throw oauthError(401, 'invalid_client', 'Unknown client');

    // Public clients (SPA/mobile) don't have a secret — PKCE provides the binding.
    if (client.isPublic) return client;

    if (!providedSecret)
        throw oauthError(401, 'invalid_client', 'Client secret required');
    if (!safeEqual(client.clientSecretHash, sha256Hex(providedSecret)))
        throw oauthError(401, 'invalid_client', 'Bad client secret');

    return client;
};

export default defineEventHandler(async (event) => {
    setResponseHeader(event, 'Cache-Control', 'no-store');

    const raw = await readBody(event);
    // Also accept form-encoded bodies (most OAuth clients send those)
    const body = typeof raw === 'string'
        ? Object.fromEntries(new URLSearchParams(raw))
        : raw;

    // Allow client_secret via Basic auth header too (RFC 6749 §2.3.1)
    const basic = getHeader(event, 'authorization');
    if (basic?.startsWith('Basic ')) {
        const decoded = Buffer.from(basic.slice(6), 'base64').toString('utf-8');
        const sep = decoded.indexOf(':');
        if (sep > 0) {
            body.client_id = body.client_id || decoded.slice(0, sep);
            body.client_secret = body.client_secret || decoded.slice(sep + 1);
        }
    }

    // --- Authorization Code grant ---
    if (body.grant_type === 'authorization_code') {
        const parsed = codeSchema.parse(body);
        const client = await authenticateClient(parsed.client_id, parsed.client_secret);

        const [stored] = await db
            .select()
            .from(oauthAuthorizationCodes)
            .where(eq(oauthAuthorizationCodes.code, parsed.code))
            .limit(1);

        if (!stored)
            throw oauthError(400, 'invalid_grant', 'Unknown code');
        if (stored.usedAt)
            throw oauthError(400, 'invalid_grant', 'Code already used');
        if (stored.expiresAt < new Date())
            throw oauthError(400, 'invalid_grant', 'Code expired');
        if (stored.clientId !== client.clientId)
            throw oauthError(400, 'invalid_grant', 'Code/client mismatch');
        if (stored.redirectUri !== parsed.redirect_uri)
            throw oauthError(400, 'invalid_grant', 'redirect_uri mismatch');
        if (!verifyPkce(stored.codeChallengeMethod, stored.codeChallenge, parsed.code_verifier))
            throw oauthError(400, 'invalid_grant', 'PKCE verification failed');

        // Burn the code (single-use)
        await db
            .update(oauthAuthorizationCodes)
            .set({ usedAt: new Date() })
            .where(eq(oauthAuthorizationCodes.code, parsed.code));

        // Look up the user — include displayName from their `people` row if any
        const [user] = await db
            .select()
            .from(authUsers)
            .where(eq(authUsers.id, stored.userId))
            .limit(1);
        if (!user)
            throw oauthError(400, 'invalid_grant', 'User vanished');

        const [profile] = await db
            .select({ firstName: people.firstName, lastName: people.lastName })
            .from(people)
            .where(eq(people.userId, user.id))
            .limit(1);

        const displayName = profile
            ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
            : undefined;

        const accessToken = await signAccessToken(
            {
                userId: user.id,
                email: user.email,
                displayName,
                scope: stored.scope,
                aud: client.clientId,
                clientId: client.clientId,
            },
            { ttl: ACCESS_TOKEN_TTL },
        );

        const refreshToken = randomToken(32);
        await db.insert(oauthRefreshTokens).values({
            token: refreshToken,
            clientId: client.clientId,
            userId: user.id,
            scope: stored.scope,
            expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
        });

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: refreshToken,
            scope: stored.scope,
        };
    }

    // --- Refresh grant ---
    if (body.grant_type === 'refresh_token') {
        const parsed = refreshSchema.parse(body);
        const client = await authenticateClient(parsed.client_id, parsed.client_secret);

        const [stored] = await db
            .select()
            .from(oauthRefreshTokens)
            .where(
                and(
                    eq(oauthRefreshTokens.token, parsed.refresh_token),
                    isNull(oauthRefreshTokens.revokedAt),
                ),
            )
            .limit(1);
        if (!stored)
            throw oauthError(400, 'invalid_grant', 'Unknown or revoked refresh token');
        if (stored.expiresAt < new Date())
            throw oauthError(400, 'invalid_grant', 'Refresh token expired');
        if (stored.clientId !== client.clientId)
            throw oauthError(400, 'invalid_grant', 'Token/client mismatch');

        // Narrowing scope on refresh is allowed (RFC 6749 §6).
        let nextScope = stored.scope;
        if (parsed.scope !== undefined) {
            const requested = parsed.scope.split(/\s+/).filter(Boolean);
            const original = stored.scope.split(/\s+/).filter(Boolean);
            if (!requested.every((s) => original.includes(s)))
                throw oauthError(400, 'invalid_scope', 'Cannot widen scope on refresh');
            nextScope = requested.join(' ');
        }

        const [user] = await db
            .select()
            .from(authUsers)
            .where(eq(authUsers.id, stored.userId))
            .limit(1);
        if (!user)
            throw oauthError(400, 'invalid_grant', 'User vanished');

        // Rotate: revoke old, issue new (RFC 6749 §10.4 recommended)
        const newRefresh = randomToken(32);
        await db.transaction(async (tx) => {
            await tx
                .update(oauthRefreshTokens)
                .set({ revokedAt: new Date() })
                .where(eq(oauthRefreshTokens.token, stored.token));
            await tx.insert(oauthRefreshTokens).values({
                token: newRefresh,
                clientId: client.clientId,
                userId: user.id,
                scope: nextScope,
                expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
            });
        });

        const accessToken = await signAccessToken(
            {
                userId: user.id,
                email: user.email,
                scope: nextScope,
                aud: client.clientId,
                clientId: client.clientId,
            },
            { ttl: ACCESS_TOKEN_TTL },
        );

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: newRefresh,
            scope: nextScope,
        };
    }

    throw oauthError(400, 'unsupported_grant_type', 'Unsupported grant_type');
});
