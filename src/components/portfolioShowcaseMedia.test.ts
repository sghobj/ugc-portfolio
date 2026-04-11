import { describe, expect, it } from "vitest";
import {
    dedupeMediaByIdentity,
    removeMediaPresentInCollections,
    resolveMediaIdentity,
    type ShowcaseMediaIdentity,
} from "@/components/portfolioShowcaseMedia";

type TestMedia = ShowcaseMediaIdentity & {
    label: string;
};

const createMedia = (overrides: Partial<TestMedia> = {}): TestMedia => ({
    id: "",
    mediaUrl: "",
    previewUrl: "",
    thumbnailUrl: "",
    playbackUrl: "",
    embedUrl: "",
    label: "",
    ...overrides,
});

describe("portfolioShowcaseMedia helpers", () => {
    it("uses id as primary identity key", () => {
        const identity = resolveMediaIdentity(
            createMedia({
                id: "asset-12",
                mediaUrl: "https://cdn.example.com/a.jpg",
            }),
        );

        expect(identity).toBe("id:asset-12");
    });

    it("falls back to media URL identity when id is missing", () => {
        const identity = resolveMediaIdentity(
            createMedia({
                mediaUrl: "HTTPS://CDN.EXAMPLE.COM/asset.jpg",
            }),
        );

        expect(identity).toBe("url:https://cdn.example.com/asset.jpg");
    });

    it("deduplicates media by shared identity", () => {
        const items = [
            createMedia({ id: "1", mediaUrl: "https://cdn.example.com/first.jpg", label: "first" }),
            createMedia({ id: "1", mediaUrl: "https://cdn.example.com/duplicate.jpg", label: "duplicate" }),
            createMedia({ id: "2", mediaUrl: "https://cdn.example.com/second.jpg", label: "second" }),
        ];

        const deduped = dedupeMediaByIdentity(items);

        expect(deduped.map((item) => item.label)).toEqual(["first", "second"]);
    });

    it("removes highlights that are already part of collections", () => {
        const highlightOnly = createMedia({ id: "h-1", mediaUrl: "https://cdn.example.com/highlight.jpg", label: "highlight-only" });
        const inCollection = createMedia({ id: "shared-1", mediaUrl: "https://cdn.example.com/shared.jpg", label: "in-collection" });
        const urlMatchHighlight = createMedia({
            id: "",
            mediaUrl: "https://cdn.example.com/url-match.jpg",
            label: "url-match-highlight",
        });

        const highlights = [highlightOnly, inCollection, urlMatchHighlight];
        const collections = [
            {
                entries: [
                    createMedia({ id: "shared-1", mediaUrl: "https://cdn.example.com/shared.jpg", label: "collection-id-match" }),
                    createMedia({ id: "collection-2", mediaUrl: "https://cdn.example.com/url-match.jpg", label: "collection-url-match" }),
                ],
            },
        ];

        const filtered = removeMediaPresentInCollections(highlights, collections);

        expect(filtered.map((item) => item.label)).toEqual(["highlight-only"]);
    });
});
