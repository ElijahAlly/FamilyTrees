import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is required');
    return new TextEncoder().encode(secret);
};

/**
 * Minimal identity claim shape produced by the OTP login flow.
 * Resource servers (photos.mytrees.family) accept any token signed with the
 * shared JWT_SECRET; the `scope` and `aud` claims are optional and only
 * populated for OAuth-issued access tokens.
 */
export interface JWTPayload {
    userId: string;
    email: string;
    displayName?: string;
    scope?: string;             // space-separated OAuth scopes
    aud?: string | string[];    // intended audience (e.g. 'photos.mytrees.family')
    clientId?: string;          // the OAuth client this token was issued to
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSecret());
}

/** OAuth access tokens — shorter-lived, scoped, audience-restricted. */
export async function signAccessToken(
    payload: JWTPayload,
    opts: { ttl?: string } = {},
): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(opts.ttl ?? '1h')
        .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, getSecret());
    return {
        userId: payload.userId as string,
        email: payload.email as string,
        displayName: (payload.displayName as string) || undefined,
        scope: (payload.scope as string) || undefined,
        aud: (payload.aud as string | string[]) || undefined,
        clientId: (payload.clientId as string) || undefined,
    };
}
