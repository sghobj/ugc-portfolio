// TEMPORARY visual-verification page. Safe to delete.
import VideoReels from "@/components/VideoReels";
import type { UgcWorkContent, UgcWorkMediaContent } from "@/hooks/useUgcContent";

// Public HLS test stream — stands in for a Bunny Stream .m3u8 playbackUrl.
const HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const poster = (seed: string) => `https://picsum.photos/seed/${seed}/450/800`;

const hlsVideo = (id: string, title: string, category: string): UgcWorkMediaContent => ({
    id,
    kind: "video",
    title,
    description: "",
    hook: "The hook",
    goal: "Bookings",
    style: "Cinematic",
    instagramUrl: "",
    imageUrl: poster(id),
    sourceUrl: `${HLS}?id=${id}`,
    provider: "bunny",
    embedUrl: "https://iframe.mediadelivery.net/embed/000/demo",
    playbackUrl: `${HLS}?id=${id}`,
    thumbnailUrl: poster(id),
    imageAlt: "",
    width: 1080,
    height: 1920,
    mime: "application/x-mpegURL",
    isCollaboration: true,
    metricViews: null,
    metricLikes: null,
    metricShares: null,
    metricSaves: null,
    categories: [category],
});

const myWork: UgcWorkContent = {
    sectionName: "",
    title: "",
    text: "",
    media: [
        hlsVideo("hls-a", "Bunny HLS reel", "Hotels & Resorts"),
        hlsVideo("hls-b", "Second reel", "Travel"),
    ],
};

const DesignPreview = () => (
    <div className="bg-background text-foreground">
        <VideoReels myWork={myWork} showcase={{ collections: [], highlights: [], videos: [] }} />
    </div>
);

export default DesignPreview;
