export declare const PATCH: import("../../../../../../.__sprindle_route_definition").FileRouteDefinition<{
    name?: string | undefined;
    statusCode?: string | undefined;
}, {
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
} | {
    error: 'not_found';
}, "update">;
