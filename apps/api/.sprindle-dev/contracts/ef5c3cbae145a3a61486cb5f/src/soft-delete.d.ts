import type { AnyColumn } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { FileRequestArgs, FileValidationIssue, RouteParameters } from '@southneuhof/sprindle';
type SoftDeleteTable = PgTable & {
    id: PgColumn;
    deletedAt: PgColumn;
    deletedByUserId: PgColumn;
    deletedReason?: PgColumn;
    updatedByUserId: PgColumn;
    updatedAt: PgColumn;
};
export declare function softDeleteValues(columns: Record<string, PgColumn>, userId: string, reason?: string): Record<string, unknown>;
/**
 * Soft delete as a canonical delete route. Flags `deleted=true` on the parent
 * row (0 matched rows -> 404), then applies the identical flag update to every
 * cascade child inside the same transaction; a child with zero rows is fine.
 * Writes go through `getDb()` because the source's delete hard-deletes.
 */
export declare function softDeleteRoute(options: {
    table: SoftDeleteTable;
    authorize: Array<(args: FileRequestArgs<RouteParameters, object>) => void | Response | FileValidationIssue | Promise<void | Response | FileValidationIssue>>;
    reason?: string;
    cascade?: Array<{
        table: SoftDeleteTable;
        fkColumn: AnyColumn;
    }>;
}): import("@southneuhof/sprindle/routes").FileRouteDefinition<unknown, {
    ok: true;
} | {
    error: 'not_found';
}, "delete">;
export {};
