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
        permissions: ("create-role-assignments" | "create-role-permissions" | "create-roles" | "create-users" | "delete-role-assignments" | "delete-role-permissions" | "delete-roles" | "detail-permissions" | "detail-roles" | "detail-users" | "list-permissions" | "list-role-assignments" | "list-role-permissions" | "list-roles" | "list-users" | "update-roles" | "update-users" | "view-permissions" | "view-roles" | "view-users")[];
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">, "route">;
