export declare const PUT: import("../../../../../../../.__sprindle_route_definition").FileRouteDefinition<unknown, {
    data: {
        id: string;
        roleCode: string;
        name: string;
        description: string | null;
        active: boolean;
        assigned: boolean;
    }[];
} | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">), "route">;
export declare const DELETE: import("../../../../../../../.__sprindle_route_definition").FileRouteDefinition<unknown, {
    data: {
        id: string;
        roleCode: string;
        name: string;
        description: string | null;
        active: boolean;
        assigned: boolean;
    }[];
} | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">), "route">;
