import { defineEventHandler, getRouterParam, createError, setResponseHeaders } from 'h3';

const GPAPICS_URL = process.env.GPAPICS_URL || 'http://localhost:3000';
const GPAPICS_API_KEY = process.env.GPAPICS_API_KEY || '';

export default defineEventHandler(async (event) => {
    const mediaId = getRouterParam(event, 'mediaId');
    const variant = getRouterParam(event, 'variant');

    if (!mediaId || !variant || !['raw', 'thumb'].includes(variant)) {
        throw createError({ statusCode: 400, message: 'Invalid media request' });
    }

    const response = await fetch(`${GPAPICS_URL}/api/media/${mediaId}/${variant}`, {
        headers: {
            'X-API-Key': GPAPICS_API_KEY,
        },
    });

    if (!response.ok) {
        throw createError({ statusCode: response.status, message: 'Media not found' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const cacheControl = response.headers.get('cache-control') || 'public, max-age=86400';

    setResponseHeaders(event, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
});
