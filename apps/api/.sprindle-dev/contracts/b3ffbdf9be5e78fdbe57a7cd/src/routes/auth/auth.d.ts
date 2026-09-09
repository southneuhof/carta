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
export declare const domain: {
    readonly tables: {
        readonly sessions: import("drizzle-orm/pg-core").PgTableWithColumns<{
            name: "sessions";
            schema: undefined;
            columns: {
                id: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").SetIsPrimaryKey<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>>, {
                    name: string;
                    tableName: "sessions";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                expiresAt: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>, {
                    name: string;
                    tableName: "sessions";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                token: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                    name: string;
                    tableName: "sessions";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                createdAt: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                    name: string;
                    tableName: "sessions";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                updatedAt: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                    name: string;
                    tableName: "sessions";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                ipAddress: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                    name: string;
                    tableName: "sessions";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                userAgent: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                    name: string;
                    tableName: "sessions";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                userId: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                    name: string;
                    tableName: "sessions";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
            };
            dialect: 'pg';
        }>;
        readonly accounts: import("drizzle-orm/pg-core").PgTableWithColumns<{
            name: "accounts";
            schema: undefined;
            columns: {
                id: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").SetIsPrimaryKey<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                accountId: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                providerId: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                userId: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                accessToken: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                refreshToken: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                idToken: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                accessTokenExpiresAt: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTimestampBuilder, {
                    name: string;
                    tableName: "accounts";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                refreshTokenExpiresAt: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTimestampBuilder, {
                    name: string;
                    tableName: "accounts";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                scope: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                password: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: false;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                createdAt: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                updatedAt: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                    name: string;
                    tableName: "accounts";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
            };
            dialect: 'pg';
        }>;
        readonly verifications: import("drizzle-orm/pg-core").PgTableWithColumns<{
            name: "verifications";
            schema: undefined;
            columns: {
                id: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").SetIsPrimaryKey<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>>, {
                    name: string;
                    tableName: "verifications";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                identifier: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                    name: string;
                    tableName: "verifications";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                value: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                    name: string;
                    tableName: "verifications";
                    dataType: "string";
                    data: string;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                expiresAt: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>, {
                    name: string;
                    tableName: "verifications";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: true;
                    hasDefault: false;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                createdAt: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                    name: string;
                    tableName: "verifications";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
                updatedAt: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                    name: string;
                    tableName: "verifications";
                    dataType: "object date";
                    data: Date;
                    driverParam: string;
                    notNull: true;
                    hasDefault: true;
                    isPrimaryKey: false;
                    isAutoincrement: false;
                    hasRuntimeDefault: false;
                    enumValues: undefined;
                    identity: undefined;
                    generated: undefined;
                }>;
            };
            dialect: 'pg';
        }>;
    };
    readonly entities: readonly [];
};
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
export declare const authRoutes: {
    signInEmail: {
        openapi: {
            requestBody: import("zod").ZodObject<{
                email: import("zod").ZodString;
                password: import("zod").ZodString;
            }, import("zod/v4/core").$strip>;
        };
        action: (args: {
            c: {
                req: {
                    raw: Request;
                };
            };
        }) => Promise<import("hono").TypedResponse<{
            redirect: boolean;
            token: string;
            user: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                image?: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        }, 200, 'json'>>;
    };
    getSession: {
        action: ({ c }: {
            c: {
                req: {
                    raw: Request;
                };
            };
        }) => Promise<Response>;
    };
    signOut: {
        action: ({ c }: {
            c: {
                req: {
                    raw: Request;
                };
            };
        }) => Promise<Response>;
    };
};
declare const _default: {
    domain: {
        readonly tables: {
            readonly sessions: import("drizzle-orm/pg-core").PgTableWithColumns<{
                name: "sessions";
                schema: undefined;
                columns: {
                    id: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").SetIsPrimaryKey<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>>, {
                        name: string;
                        tableName: "sessions";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    expiresAt: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>, {
                        name: string;
                        tableName: "sessions";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    token: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                        name: string;
                        tableName: "sessions";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    createdAt: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                        name: string;
                        tableName: "sessions";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    updatedAt: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                        name: string;
                        tableName: "sessions";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    ipAddress: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                        name: string;
                        tableName: "sessions";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    userAgent: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                        name: string;
                        tableName: "sessions";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    userId: import("drizzle-orm/pg-core").PgBuildColumn<"sessions", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                        name: string;
                        tableName: "sessions";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                };
                dialect: 'pg';
            }>;
            readonly accounts: import("drizzle-orm/pg-core").PgTableWithColumns<{
                name: "accounts";
                schema: undefined;
                columns: {
                    id: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").SetIsPrimaryKey<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    accountId: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    providerId: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    userId: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    accessToken: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    refreshToken: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    idToken: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    accessTokenExpiresAt: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTimestampBuilder, {
                        name: string;
                        tableName: "accounts";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    refreshTokenExpiresAt: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTimestampBuilder, {
                        name: string;
                        tableName: "accounts";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    scope: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    password: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: false;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    createdAt: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    updatedAt: import("drizzle-orm/pg-core").PgBuildColumn<"accounts", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                        name: string;
                        tableName: "accounts";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                };
                dialect: 'pg';
            }>;
            readonly verifications: import("drizzle-orm/pg-core").PgTableWithColumns<{
                name: "verifications";
                schema: undefined;
                columns: {
                    id: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").SetIsPrimaryKey<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>>, {
                        name: string;
                        tableName: "verifications";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    identifier: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                        name: string;
                        tableName: "verifications";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    value: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTextBuilder<[string, ...string[]]>>, {
                        name: string;
                        tableName: "verifications";
                        dataType: "string";
                        data: string;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    expiresAt: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>, {
                        name: string;
                        tableName: "verifications";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: true;
                        hasDefault: false;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    createdAt: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                        name: string;
                        tableName: "verifications";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                    updatedAt: import("drizzle-orm/pg-core").PgBuildColumn<"verifications", import("drizzle-orm/pg-core").SetHasDefault<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgTimestampBuilder>>, {
                        name: string;
                        tableName: "verifications";
                        dataType: "object date";
                        data: Date;
                        driverParam: string;
                        notNull: true;
                        hasDefault: true;
                        isPrimaryKey: false;
                        isAutoincrement: false;
                        hasRuntimeDefault: false;
                        enumValues: undefined;
                        identity: undefined;
                        generated: undefined;
                    }>;
                };
                dialect: 'pg';
            }>;
        };
        readonly entities: readonly [];
    };
    authRoutes: {
        signInEmail: {
            openapi: {
                requestBody: import("zod").ZodObject<{
                    email: import("zod").ZodString;
                    password: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
            };
            action: (args: {
                c: {
                    req: {
                        raw: Request;
                    };
                };
            }) => Promise<import("hono").TypedResponse<{
                redirect: boolean;
                token: string;
                user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    image?: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            }, 200, 'json'>>;
        };
        getSession: {
            action: ({ c }: {
                c: {
                    req: {
                        raw: Request;
                    };
                };
            }) => Promise<Response>;
        };
        signOut: {
            action: ({ c }: {
                c: {
                    req: {
                        raw: Request;
                    };
                };
            }) => Promise<Response>;
        };
    };
};
export default _default;
