export declare const POST: import("../../../../../.__sprindle_route_definition").FileRouteDefinition<{
    json: {
        name: string;
        email: string;
        password: string;
        roleIds: string[];
    };
}, (Response & import("hono").TypedResponse<{
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
}, 201, "json">), "route">;
