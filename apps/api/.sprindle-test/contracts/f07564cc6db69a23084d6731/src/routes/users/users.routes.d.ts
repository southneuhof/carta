import type { FileRouteArgs, RouteParameters } from "./.r";
export declare const createUserConfig: {
    openapi: {
        requestBody: import("zod").ZodObject<{
            name: import("zod").ZodString;
            email: import("zod").ZodString;
            password: import("zod").ZodString;
            roleIds: import("zod").ZodArray<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>;
    };
    authorize: ((args: any) => Promise<void>)[];
    action: (args: FileRouteArgs<RouteParameters, object>) => Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 409, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 422, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
        message?: string | undefined;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        data: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            image: string | null;
            statusCode: string;
            createdAt: string;
            updatedAt: string;
        };
    }, 201, "json">)>;
};
