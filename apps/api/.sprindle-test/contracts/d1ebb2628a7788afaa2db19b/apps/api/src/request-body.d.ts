import type { Context } from 'hono';
/**
 * Reads a JSON object body. An empty body is `{}` (DELETE with no payload),
 * malformed JSON and non-object bodies answer 400 instead of masquerading as
 * field-validation issues.
 */
export declare function readJsonBody(c: Context): Promise<Record<string, unknown>>;
