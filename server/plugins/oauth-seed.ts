import { defineNitroPlugin } from 'nitropack/runtime';
import { db } from '../db';
import { oauthClients } from '../db/schema';
import { sha256Hex } from '../utils/oauth';

/**
 * On boot, ensure the OAuth clients for our first-party properties exist.
 *
 * Clients are upserted (idempotent) so re-deploying with rotated secrets
 * picks them up automatically. Skips silently if the *_OAUTH_CLIENT_SECRET
 * env var is missing — you don't want a half-configured client lingering.
 */
interface ClientSeed {
    clientId: string;
    name: string;
    secretEnv: string;
    redirectUrisEnv: string;
    redirectUrisDefault: string[];
    allowedScopes: string[];
    isInternal: boolean;
}

const SEEDS: ClientSeed[] = [
    {
        clientId: 'photos',
        name: 'photos.mytrees.family',
        secretEnv: 'PHOTOS_OAUTH_CLIENT_SECRET',
        redirectUrisEnv: 'PHOTOS_OAUTH_REDIRECT_URIS',
        redirectUrisDefault: [
            'https://photos.mytrees.family/auth/callback',
            'http://localhost:3000/auth/callback',
        ],
        allowedScopes: ['profile', 'photos:read', 'photos:write', 'photos:admin'],
        isInternal: true,
    },
    {
        clientId: 'cinderella',
        name: 'cinderella.photography',
        secretEnv: 'CINDERELLA_OAUTH_CLIENT_SECRET',
        redirectUrisEnv: 'CINDERELLA_OAUTH_REDIRECT_URIS',
        // cinderella's NestJS backend uses a global `/api` prefix, so its OAuth
        // callback lives at `/api/auth/callback`, not `/auth/callback`.
        redirectUrisDefault: [
            'https://cinderella.photography/api/auth/callback',
            'http://localhost:3001/api/auth/callback',
        ],
        allowedScopes: ['profile', 'photos:read', 'photos:write'],
        isInternal: false,
    },
];

export default defineNitroPlugin(async () => {
    if (!process.env.JWT_SECRET) {
        // Schema migrations not yet applied / dev shell — don't crash.
        return;
    }
    for (const seed of SEEDS) {
        const secret = process.env[seed.secretEnv];
        if (!secret) {
            console.warn(`[oauth-seed] ${seed.clientId}: ${seed.secretEnv} not set — skipping`);
            continue;
        }
        const redirectUris =
            (process.env[seed.redirectUrisEnv]?.split(',').map((s) => s.trim()).filter(Boolean)) ||
            seed.redirectUrisDefault;

        try {
            await db
                .insert(oauthClients)
                .values({
                    clientId: seed.clientId,
                    name: seed.name,
                    clientSecretHash: sha256Hex(secret),
                    redirectUris,
                    allowedScopes: seed.allowedScopes,
                    isInternal: seed.isInternal,
                    isPublic: false,
                })
                .onConflictDoUpdate({
                    target: oauthClients.clientId,
                    set: {
                        name: seed.name,
                        clientSecretHash: sha256Hex(secret),
                        redirectUris,
                        allowedScopes: seed.allowedScopes,
                        isInternal: seed.isInternal,
                    },
                });
            console.log(`[oauth-seed] ${seed.clientId} ready`);
        } catch (err) {
            // Most likely the tables don't exist yet (first boot before migrate).
            console.warn(`[oauth-seed] could not upsert ${seed.clientId}:`, (err as Error).message);
        }
    }
});
