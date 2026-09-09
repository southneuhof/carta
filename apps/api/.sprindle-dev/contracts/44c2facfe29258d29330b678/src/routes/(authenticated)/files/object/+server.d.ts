export declare const GET: import("../../../../../.__sprindle_route_definition").FileRouteDefinition<unknown, Response & import("hono").TypedResponse<undefined, 302, "redirect">, "route">;
export declare const DELETE: import("../../../../../.__sprindle_route_definition").FileRouteDefinition<{
    json: {
        key: string;
    };
}, Response & import("hono").TypedResponse<{
    ok: true;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">, "route">;
