export declare const POST: import("../../../../../.__sprindle_route_definition").FileRouteDefinition<{
    json: {
        filename: string;
        contentType: string;
        size: number;
    };
}, Response & import("hono").TypedResponse<{
    data: {
        uploadUrl: string;
        asset: {
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
        };
        method: string;
        headers: {
            'Content-Type': string;
        };
        expiresIn: number;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">, "route">;
