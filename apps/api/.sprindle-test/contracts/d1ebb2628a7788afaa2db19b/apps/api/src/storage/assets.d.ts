import type { MiddlewareHandler } from 'hono';
import type { RouteAfter } from '@southneuhof/sprindle/model';
import { z } from 'zod/v4';
import { type StoredAsset } from '../schema';
export type StoredAssetMetadata = {
    size?: number;
    updatedAt?: string | Date;
    metadata?: Record<string, unknown>;
};
export declare function assetRequestContext(): MiddlewareHandler;
export declare function runWithAssetRequestUrl<T>(url: string, callback: () => T | Promise<T>): T | Promise<T>;
export declare function storedAsset(key: string, metadata?: StoredAssetMetadata): StoredAsset;
export declare function projectStoredAssets(value: unknown): unknown;
export declare function publicRecord<TSchema extends z.ZodType>(schema: TSchema, value: unknown): z.output<TSchema>;
export declare function publicRecords<TSchema extends z.ZodType>(schema: TSchema, values: unknown[]): z.output<TSchema>[];
export declare function storedAssetModel<TSchema extends z.ZodType>(schema: TSchema): {
    schema: TSchema;
    run: (record: unknown) => z.infer<TSchema>;
};
export declare const storedAssetResponse: RouteAfter;
