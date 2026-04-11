export type ShowcaseMediaIdentity = {
    id: string;
    mediaUrl: string;
    previewUrl: string;
    thumbnailUrl: string;
    playbackUrl: string;
    embedUrl: string;
};

const normalizeUrl = (value: string): string => value.trim().toLowerCase();

const resolveMediaUrlIdentity = (item: ShowcaseMediaIdentity): string => {
    const mediaUrl = [
        item.mediaUrl,
        item.previewUrl,
        item.thumbnailUrl,
        item.playbackUrl,
        item.embedUrl,
    ]
        .map((value) => normalizeUrl(value))
        .find((value) => value.length > 0);

    if (mediaUrl) {
        return `url:${mediaUrl}`;
    }

    return "";
};

const resolveMediaIdIdentity = (item: ShowcaseMediaIdentity): string => {
    const id = item.id.trim();
    if (id.length > 0) {
        return `id:${id}`;
    }

    return "";
};

export const resolveMediaIdentityTokens = (item: ShowcaseMediaIdentity): string[] => {
    const tokens: string[] = [];
    const idIdentity = resolveMediaIdIdentity(item);
    const urlIdentity = resolveMediaUrlIdentity(item);

    if (idIdentity.length > 0) {
        tokens.push(idIdentity);
    }

    if (urlIdentity.length > 0) {
        tokens.push(urlIdentity);
    }

    return tokens;
};

export const resolveMediaIdentity = (item: ShowcaseMediaIdentity): string => {
    const [primaryIdentity] = resolveMediaIdentityTokens(item);
    return primaryIdentity ?? "";
};

export const dedupeMediaByIdentity = <T extends ShowcaseMediaIdentity>(items: T[]): T[] => {
    const seen = new Set<string>();
    const deduped: T[] = [];

    for (const item of items) {
        const identity = resolveMediaIdentity(item);
        if (identity.length === 0 || !seen.has(identity)) {
            deduped.push(item);
        }

        if (identity.length > 0) {
            seen.add(identity);
        }
    }

    return deduped;
};

export const removeMediaPresentInCollections = <T extends ShowcaseMediaIdentity>(
    highlights: T[],
    collections: Array<{ entries: T[] }>,
): T[] => {
    const collectionMediaIdentities = new Set<string>();

    for (const collection of collections) {
        for (const entry of collection.entries) {
            for (const identity of resolveMediaIdentityTokens(entry)) {
                collectionMediaIdentities.add(identity);
            }
        }
    }

    return highlights.filter((item) => {
        const identities = resolveMediaIdentityTokens(item);
        if (identities.length === 0) {
            return true;
        }

        return identities.every((identity) => !collectionMediaIdentities.has(identity));
    });
};
