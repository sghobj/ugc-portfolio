type ShowcaseVideoCandidate = {
    kind: string;
    mediaUrl: string;
    mime: string;
};

const isVideoAsset = (url: string, mime = ""): boolean => {
    if (mime.toLowerCase().startsWith("video/")) {
        return true;
    }

    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
};

const isVideoMedia = (item: ShowcaseVideoCandidate): boolean => {
    if (item.kind === "video") {
        return true;
    }

    return isVideoAsset(item.mediaUrl, item.mime);
};

export const selectShowcaseVideos = <T extends ShowcaseVideoCandidate>(
    sourceMedia: T[],
    hasSeparatedShowcase: boolean,
    separatedVideos: T[],
): T[] => {
    if (hasSeparatedShowcase) {
        return separatedVideos;
    }

    return sourceMedia.filter((item) => isVideoMedia(item));
};
