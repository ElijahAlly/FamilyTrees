import type { H3Event } from 'h3';
import { readBody, createError } from 'h3';
import { z } from 'zod/v4';

/**
 * Read and validate request body against a Zod schema.
 * Throws 400 with validation errors on failure.
 */
export async function validateBody<T>(event: H3Event, schema: z.ZodType<T>): Promise<T> {
    const body = await readBody(event);
    const result = schema.safeParse(body);
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation error',
            data: { errors: z.prettifyError(result.error) },
        });
    }
    return result.data;
}
