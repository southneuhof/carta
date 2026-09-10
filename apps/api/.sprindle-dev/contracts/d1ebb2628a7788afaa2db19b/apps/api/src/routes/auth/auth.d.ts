export declare function createAuth({ allowSignUp }?: {
    allowSignUp?: boolean;
}): import("better-auth").Auth<{
    secret: string;
    baseURL: string;
    trustedOrigins: string[];
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    emailAndPassword: {
        enabled: true;
        disableSignUp: boolean;
    };
    databaseHooks: {
        session: {
            create: {
                before: (session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } & Record<string, unknown>) => Promise<boolean>;
            };
        };
    };
}>;
export declare function getAuth(): import("better-auth").Auth<{
    secret: string;
    baseURL: string;
    trustedOrigins: string[];
    database: (options: import("better-auth").BetterAuthOptions) => import("better-auth").DBAdapter<import("better-auth").BetterAuthOptions>;
    emailAndPassword: {
        enabled: true;
        disableSignUp: boolean;
    };
    databaseHooks: {
        session: {
            create: {
                before: (session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined;
                    userAgent?: string | null | undefined;
                } & Record<string, unknown>) => Promise<boolean>;
            };
        };
    };
}>;
