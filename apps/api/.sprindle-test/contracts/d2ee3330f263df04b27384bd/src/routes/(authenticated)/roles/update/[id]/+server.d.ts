export declare const PATCH: import("../../../../../../.__sprindle_route_definition").FileRouteDefinition<{
    roleCode?: string | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    active?: boolean | undefined;
}, {
    data: {
        createdByUserId: string | null;
        updatedByUserId: string | null;
        createdAt: string;
        updatedAt: string;
        id: string;
        roleCode: string;
        name: string;
        description: string | null;
        active: boolean;
    };
} | {
    error: 'not_found';
}, "update">;
