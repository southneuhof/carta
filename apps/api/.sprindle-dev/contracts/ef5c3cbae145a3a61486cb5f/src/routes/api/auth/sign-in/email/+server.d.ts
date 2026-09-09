export declare const POST: import("../../../../../../.__sprindle_route_definition").FileRouteDefinition<{
    json: {
        email: string;
        password: string;
    };
}, import("hono").TypedResponse<{
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
}, 200, "json">, "route">;
