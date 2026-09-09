import { z } from 'zod/v4';
export declare const optionalText: (max?: number) => z.ZodPreprocess<z.ZodOptional<z.ZodNullable<z.ZodString>>, unknown>;
export declare const uploadKey: z.ZodString;
export declare const storedAssetSchema: z.ZodObject<{
    kind: z.ZodLiteral<"file">;
    id: z.ZodString;
    url: z.ZodString;
    name: z.ZodString;
    mimeType: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type StoredAsset = z.output<typeof storedAssetSchema>;
export declare const storedAssetInput: z.ZodPipe<z.ZodObject<{
    kind: z.ZodLiteral<"file">;
    id: z.ZodString;
    url: z.ZodString;
    name: z.ZodString;
    mimeType: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>, z.ZodTransform<string, {
    kind: "file";
    id: string;
    url: string;
    name: string;
    mimeType?: string | undefined;
    size?: number | undefined;
    updatedAt?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>>;
export declare const selectionValues: <TItem extends z.ZodObject>(itemSchema: TItem) => z.ZodArray<TItem>;
export declare const selectionQuery: <TItem extends z.ZodObject>(itemSchema: TItem) => z.ZodPreprocess<z.ZodArray<TItem>, unknown>;
