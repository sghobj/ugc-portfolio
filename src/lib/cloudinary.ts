type CloudinaryCropMode = "limit" | "fill";

type CloudinaryImageOptions = {
    width: number;
    height?: number;
    crop?: CloudinaryCropMode;
};

const CLOUDINARY_HOST = "res.cloudinary.com";
const UPLOAD_SEGMENT = "/upload/";

const asPositiveInteger = (value: number): number => {
    if (!Number.isFinite(value) || value <= 0) {
        return 1;
    }

    return Math.round(value);
};

const isCloudinaryUploadUrl = (url: URL): boolean => {
    return url.hostname.endsWith(CLOUDINARY_HOST) && url.pathname.includes(UPLOAD_SEGMENT);
};

export const isCloudinaryUrl = (rawUrl: string): boolean => {
    if (!rawUrl) {
        return false;
    }

    try {
        const parsedUrl = new URL(rawUrl);
        return parsedUrl.hostname.endsWith(CLOUDINARY_HOST);
    } catch {
        return false;
    }
};

export const buildCloudinaryImageUrl = (
    rawUrl: string,
    { width, height, crop = "limit" }: CloudinaryImageOptions,
): string => {
    if (!rawUrl) {
        return rawUrl;
    }

    try {
        const parsedUrl = new URL(rawUrl);

        if (!isCloudinaryUploadUrl(parsedUrl)) {
            return rawUrl;
        }

        const transforms = [
            "f_auto",
            "q_auto:good",
            "dpr_auto",
            `w_${asPositiveInteger(width)}`,
            `c_${crop}`,
        ];

        if (typeof height === "number" && height > 0) {
            transforms.splice(4, 0, `h_${asPositiveInteger(height)}`);
        }

        const transformSegment = transforms.join(",");

        return rawUrl.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transformSegment}/`);
    } catch {
        return rawUrl;
    }
};
