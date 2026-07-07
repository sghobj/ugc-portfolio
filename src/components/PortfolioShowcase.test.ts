import { describe, expect, it } from "vitest";
import { selectShowcaseVideos } from "./portfolioShowcaseSelectors";

const createVideo = (id: string) => ({
    id,
    kind: "video" as const,
    mediaUrl: `https://cdn.example.com/${id}.mp4`,
    mime: "video/mp4",
});

const createPhoto = (id: string) => ({
    id,
    kind: "photo" as const,
    mediaUrl: `https://cdn.example.com/${id}.jpg`,
    mime: "image/jpeg",
});

describe("selectShowcaseVideos", () => {
    it("keeps all source videos instead of truncating the carousel to four items", () => {
        const sourceMedia = [
            createVideo("video-1"),
            createPhoto("photo-1"),
            createVideo("video-2"),
            createVideo("video-3"),
            createVideo("video-4"),
            createVideo("video-5"),
        ];

        const videos = selectShowcaseVideos(sourceMedia, false, []);

        expect(videos).toHaveLength(5);
        expect(videos.map((video) => video.id)).toEqual([
            "video-1",
            "video-2",
            "video-3",
            "video-4",
            "video-5",
        ]);
    });

    it("keeps all separated showcase videos when dedicated video entries exist", () => {
        const separatedVideos = [
            createVideo("showcase-1"),
            createVideo("showcase-2"),
            createVideo("showcase-3"),
            createVideo("showcase-4"),
            createVideo("showcase-5"),
        ];

        const videos = selectShowcaseVideos([createVideo("fallback-1")], true, separatedVideos);

        expect(videos).toEqual(separatedVideos);
    });
});
