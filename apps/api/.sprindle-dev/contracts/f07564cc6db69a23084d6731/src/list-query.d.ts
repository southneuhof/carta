import { type SQL } from 'drizzle-orm';
export declare const reservedQueryKeys: ReadonlySet<string>;
export declare function equalityFilters(query: Record<string, unknown>, columns: Record<string, unknown>, options?: {
    ignore?: ReadonlySet<string>;
    reservedKeys?: ReadonlySet<string>;
}): SQL[];
export declare function searchCondition(query: Record<string, unknown>, columns: Record<string, unknown>, searchable: readonly string[]): SQL | undefined;
export declare function orderClause(query: Record<string, unknown>, columns: Record<string, unknown>, fallback: SQL[]): SQL[];
