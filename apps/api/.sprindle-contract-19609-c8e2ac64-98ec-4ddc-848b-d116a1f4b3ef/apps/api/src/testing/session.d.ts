export type TestSession = {
    userId: string;
    roleId: string;
    /** First cookie pair from better-auth's sign-in response headers. */
    cookie: string;
};
/** Collision-free identifier namespaced per test family. */
export declare function testId(prefix: string): string;
/**
 * Signs in a fresh user holding exactly `permissionCodes` as global-scope
 * grants, registers teardown, and returns the session. Business rows the spec
 * creates stay the spec's responsibility.
 */
export declare function createSystemSession(permissionCodes: readonly string[], label?: string): Promise<TestSession>;
/** Runs and clears every registered session teardown (use in afterEach/afterAll). */
export declare function cleanupSessions(): Promise<void>;
