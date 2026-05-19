import * as upload from './upload'

export const fileUpload = upload.fileUpload;
export function imageURLResolver(image: { url: string; path: string; data: string }) {
    return {
        imageURL: image?.url || '',
        thumbnailURL: image?.url || '',
    }
}
