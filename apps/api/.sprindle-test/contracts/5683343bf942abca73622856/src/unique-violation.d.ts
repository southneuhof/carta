import type { Context } from 'hono';
/**
 * Postgres reports failed unique constraints as SQLSTATE 23505. Drizzle wraps
 * driver errors, so the code may sit on the error itself or anywhere along its
 * `cause` chain.
 */
export declare function isUniqueViolation(error: unknown): boolean;
export declare function onError(error: Error, c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    message: string | undefined;
    issues: {
        field?: string;
        message: string;
    }[] | undefined;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    message: string;
}, 400, "json">)>;
