import type { TypedResponse } from 'hono';
import { z } from 'zod/v4';
type AuthHandler = {
    handler(request: Request): Promise<Response>;
};
type SignInOutput = {
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
};
export declare function createAuthRoutes(getAuth: () => AuthHandler): {
    signInEmail: {
        openapi: {
            requestBody: z.ZodObject<{
                email: z.ZodString;
                password: z.ZodString;
            }, z.core.$strip>;
        };
        action: (args: {
            c: {
                req: {
                    raw: Request;
                };
            };
        }) => Promise<TypedResponse<SignInOutput, 200, 'json'>>;
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
export {};
