export declare const GET: import("../../../../../../.__sprindle_route_definition").FileRouteDefinition<unknown, {
    data: {
        id: string;
        roleCode: string;
        name: string;
        description: string | null;
        active: boolean;
        assigned: boolean;
    }[];
    total: number;
} | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">), "route">;
