import type { DataWriteHook } from '@southneuhof/sprindle/hono';
/**
 * Server-owned audit stamps for canonical create and update routes.
 */
export declare function auditStamp(): DataWriteHook;
