import * as upload from './upload'

export const fileUpload = upload.fileUpload;
export function imageURLResolver(image: string) {
    console.log('Resolving image URL for:', image);
    return {
        imageURL: image,
        thumbnailURL: image
    };
}