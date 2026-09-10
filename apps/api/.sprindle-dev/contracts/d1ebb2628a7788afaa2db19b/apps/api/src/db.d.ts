import { Pool } from 'pg';
export declare function getDb(): import("drizzle-orm/node-postgres").NodePgDatabase<import("drizzle-orm").TablesRelationalConfig> & {
    $client: Pool;
};
export declare function getDomainSchema(): import("@southneuhof/sprindle/model").DomainSchema;
export type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbOrTx = Db | Tx;
/** Registers teardown work that must run before the pool closes (tests only). */
export declare function setPoolCloseHook(hook: () => Promise<void>): void;
export declare function closeDb(): Promise<void>;
