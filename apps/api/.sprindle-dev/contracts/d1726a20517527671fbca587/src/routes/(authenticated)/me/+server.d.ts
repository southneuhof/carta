export declare const GET: import("../../../../.__sprindle_route_definition").FileRouteDefinition<unknown, Response & import("hono").TypedResponse<{
    data: {
        userId: string;
        user: {
            id: string;
            name: string;
            email: string;
            statusCode: string;
        };
        roleCodes: string[];
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">, "route">;
