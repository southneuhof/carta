export declare const GET: import("../../../../.__sprindle_route_definition").FileRouteDefinition<unknown, Response & import("hono").TypedResponse<{
    data: ({
        id: string;
        parentId: string | null;
        kind: 'folder';
        name: string;
    } | {
        kind: "file";
        id: string;
        url: string;
        name: string;
        mimeType?: string | undefined;
        size?: number | undefined;
        updatedAt?: string | undefined;
        metadata?: {
            [x: string]: import("hono/utils/types").JSONValue;
        } | undefined;
    })[];
    meta: {
        total: number;
        totalPage: number;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">, "route">;
