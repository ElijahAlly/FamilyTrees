import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
}

export function sha256Hex(input: string): string {
    return createHash('sha256').update(input).digest('hex');
}

/** base64url(sha256(verifier)) — RFC 7636 §4.2. */
export function pkceChallengeFromVerifier(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url');
}

/** Generate an opaque random token. */
export function randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
}

/** Verify that `code_verifier` matches a stored S256 / plain challenge. */
export function verifyPkce(
    method: string,
    storedChallenge: string,
    verifier: string,
): boolean {
    if (method === 'plain') return safeEqual(storedChallenge, verifier);
    // Default is S256
    const computed = pkceChallengeFromVerifier(verifier);
    return safeEqual(storedChallenge, computed);
}

/**
 * Validate scope request against client allow-list.
 * Returns the granted scope string (space-separated) or null if any
 * requested scope is not in the allow-list.
 */
export function validateScopes(
    requested: string | undefined,
    allowed: string[],
): string | null {
    const requestedList = (requested || '').split(/\s+/).filter(Boolean);
    if (!requestedList.length) return '';
    for (const s of requestedList) {
        if (!allowed.includes(s)) return null;
    }
    return requestedList.join(' ');
}

/** Allowed OAuth scopes recognized by this issuer. */
export const KNOWN_SCOPES = [
    'profile',          // userId, email, displayName
    'photos:read',
    'photos:write',
    'photos:admin',
] as const;

export type KnownScope = (typeof KNOWN_SCOPES)[number];
