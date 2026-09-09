import type { Context } from 'hono';
import { z } from 'zod/v4';
export declare const listFilesConfig: {
    action: ({ c }: {
        c: Context;
    }) => Promise<Response & import("hono").TypedResponse<{
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
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
};
export declare const presignedUploadConfig: {
    openapi: {
        requestBody: z.ZodObject<{
            filename: z.ZodString;
            contentType: z.ZodString;
            size: z.ZodNumber;
        }, z.core.$strip>;
    };
    action: (args: {
        c: Context;
    }) => Promise<Response & import("hono").TypedResponse<{
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
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
};
export declare const fileObjectConfig: {
    action: ({ c }: {
        c: Context;
    }) => Promise<Response & import("hono").TypedResponse<undefined, 302, "redirect">>;
};
export declare const deleteFileConfig: {
    openapi: {
        requestBody: z.ZodObject<{
            key: z.ZodString;
        }, z.core.$strip>;
    };
    action: ({ c }: {
        c: Context;
    }) => Promise<Response & import("hono").TypedResponse<{
        ok: true;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
};
