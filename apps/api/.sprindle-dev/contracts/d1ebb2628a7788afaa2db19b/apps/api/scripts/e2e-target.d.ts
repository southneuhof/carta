export declare const E2E_DATABASE_NAME: string;
export declare const E2E_BUCKET_NAME = "carta-e2e";
export declare const E2E_DATABASE_PURPOSE = "e2e";
type E2eTarget = {
    databaseName: string | undefined;
    bucket: string | undefined;
    purpose: string | undefined;
};
export declare function assertE2eStorageTarget(bucket?: string | undefined): asserts bucket is string;
export declare function assertE2eTarget(target: E2eTarget): void;
export declare function connectedDatabaseName(): Promise<string>;
export declare function assertConnectedE2eTarget(): Promise<void>;
export {};
