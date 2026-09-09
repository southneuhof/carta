import { HttpError } from '@southneuhof/sprindle';
import type { RouteValidate } from '@southneuhof/sprindle/model';
import { type InferSelectModel } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
export declare const referencedDeleteMessage = "Referenced records must be deactivated before delete.";
/**
 * Loads the row identified by `id` or fails with `fail()`. The default failure
 * is a bare 404; FK-style checks pass their own factory, e.g.
 * `() => validationError('User not found.')`.
 */
export declare function requireExists<T extends PgTable>(table: T, id: string, fail?: () => HttpError): Promise<InferSelectModel<T>>;
export declare function isReferenced(table: PgTable, childColumn: PgColumn, id: string): Promise<boolean>;
export declare function guardNotReferenced(table: PgTable, childColumn: PgColumn, id: string): Promise<void>;
/**
 * Canonical-delete reference guard: answers the shared message when any child
 * table still references the id. Composable with a route's other validators
 * (`validate: [dispatchOtherChecks, deleteGuard([...])]`).
 */
export declare function deleteGuard(refs: ReadonlyArray<{
    table: PgTable;
    fkColumn: PgColumn;
}>): RouteValidate;
