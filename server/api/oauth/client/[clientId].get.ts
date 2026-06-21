import { defineEventHandler, createError, getRouterParam } from 'h3';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { oauthClients } from '../../../db/schema';

/**
 * Public client metadata for the consent screen — only safe-to-expose fields.
 * Never include client_secret_hash, redirect URIs, or scope policy here.
 */
export default defineEventHandler(async (event) => {
    const clientId = getRouterParam(event, 'clientId');
    if (!clientId) {
        throw createError({ statusCode: 400, statusMessage: 'clientId required' });
    }

    const [client] = await db
        .select({ name: oauthClients.name })
        .from(oauthClients)
        .where(eq(oauthClients.clientId, clientId))
        .limit(1);

    if (!client) {
        throw createError({ statusCode: 404, statusMessage: 'Unknown client' });
    }

    return { name: client.name };
});
