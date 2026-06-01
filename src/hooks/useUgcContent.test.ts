import { describe, expect, it } from "vitest";
import { normalizeUgcContent } from "./useUgcContent";

const createPhoto = (id: string, sortOrder?: number) => ({
    id,
    kind: "photo",
    title: id,
    sortOrder,
    media: {
        url: `https://cdn.example.com/${id}.jpg`,
        mime: "image/jpeg",
    },
});

describe("normalizeUgcContent", () => {
    it("sorts collection media by admin sort order so the cover is first", () => {
        const content = normalizeUgcContent({
            collections: [
                {
                    id: "collection-1",
                    name: "Collection",
                    media: [
                        createPhoto("later", 2),
                        createPhoto("cover", 0),
                        createPhoto("second", 1),
                        createPhoto("unsorted"),
                    ],
                },
            ],
        });

        expect(content.showcase.collections[0].media.map((item) => item.id)).toEqual([
            "cover",
            "second",
            "later",
            "unsorted",
        ]);
    });
});
