import type { TypedResponse } from 'hono';
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
export declare const POST: import("../../../../../../.__sprindle_route_definition").FileRouteDefinition<{
    json: {
        email: string;
        password: string;
    };
}, TypedResponse<SignInOutput, 200, "json">, "route">;
export {};
