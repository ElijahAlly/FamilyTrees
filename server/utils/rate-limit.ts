import type { H3Event } from 'h3';
import { createError, getRequestIP } from 'h3';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

interface RateLimiterOptions {
    windowMs: number;
    maxRequests: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
    const store = new Map<string, RateLimitEntry>();

    // Periodic cleanup every 5 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (entry.resetAt <= now) store.delete(key);
        }
    }, 5 * 60 * 1000);

    return { store, ...options };
}

type RateLimiter = ReturnType<typeof createRateLimiter>;

/**
 * Check rate limit. Throws 429 if exceeded.
 */
export function checkRateLimit(event: H3Event, limiter: RateLimiter, keyPrefix = ''): void {
    // Skip rate limiting in development
    if (process.env.NODE_ENV !== 'production') return;

    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let entry = limiter.store.get(key);
    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + limiter.windowMs };
        limiter.store.set(key, entry);
    }

    entry.count++;
    if (entry.count > limiter.maxRequests) {
        throw createError({
            statusCode: 429,
            statusMessage: 'Too many requests. Please try again later.',
        });
    }
}

// Pre-configured rate limiters
export const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 });
export const signupLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 3 });
export const inviteLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 10 });
