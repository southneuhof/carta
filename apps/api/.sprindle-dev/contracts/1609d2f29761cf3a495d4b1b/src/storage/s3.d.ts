type PresignedUploadInput = {
    key: string;
    contentType: string;
};
export declare function createPresignedUpload({ key, contentType }: PresignedUploadInput): Promise<{
    url: string;
    expiresIn: number;
}>;
export declare function createPresignedDownload(key: string): Promise<{
    url: string;
    expiresIn: number;
}>;
export declare function putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
export declare function getObjectBytes(key: string): Promise<Uint8Array>;
export declare function listObjects(prefix: string): Promise<import("@aws-sdk/client-s3").ListObjectsV2CommandOutput>;
export declare function deleteObject(key: string): Promise<void>;
export declare function copyObject(sourceKey: string, destinationKey: string): Promise<void>;
export {};
