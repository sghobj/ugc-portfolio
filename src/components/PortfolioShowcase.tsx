import { type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Clapperboard, Layers, Play, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type {
    UgcShowcaseCollectionContent,
    UgcShowcaseContent,
    UgcWorkContent,
    UgcWorkMediaContent,
} from "@/hooks/useUgcContent";
import { mockPortfolioData } from "@/data/mockPortfolioData";
import { buildCloudinaryImageUrl, isCloudinaryUrl } from "@/lib/cloudinary";
import { PhotoProtectionOverlay, protectedImageProps } from "@/components/PhotoProtection";

type PortfolioShowcaseProps = {
    myWork?: UgcWorkContent;
    showcase?: UgcShowcaseContent;
};

type StoryMedia = {
    id: string;
    kind: "photo" | "video" | "";
    title: string;
    description: string;
    hook: string;
    goal: string;
    style: string;
    mediaUrl: string;
    previewUrl: string;
    provider: "cloudinary" | "bunny" | "";
    embedUrl: string;
    playbackUrl: string;
    thumbnailUrl: string;
    mime: string;
    categories: string[];
    track: string;
    width?: number;
    height?: number;
};

type StoryCollection = {
    id: string;
    title: string;
    subtitle: string;
    story: string;
    highlights: string[];
    entries: StoryMedia[];
    track: string;
};

type Orientation = "portrait" | "landscape" | "square";
type ShowcaseLane = "collections" | "highlights";

const IMAGE_WIDTHS = [640, 960, 1280];
const IMAGE_SIZES = "(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 31vw";

const TRACK_RULES: Array<{ label: string; keywords: string[] }> = [
    {
        label: "Hotels & Resorts",
        keywords: ["hotel", "resort", "hospitality", "suite", "stay", "spa", "amenity"],
    },
    {
        label: "Airlines & Transit",
        keywords: ["airline", "flight", "airport", "cabin", "aviation", "lounge", "traveler"],
    },
    {
        label: "Destinations & Travel",
        keywords: ["travel", "destination", "tourism", "journey", "roadtrip", "adventure", "trip"],
    },
];

const stripMarkdownInline = (value: string): string => {
    return value
        .replace(/!\[[^\]]*]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
        .replace(/[_*`~>#-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const toTitleCase = (value: string): string => {
    return value
        .split(/[\s/_-]+/)
        .filter(Boolean)
        .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
        .join(" ");
};

const slugify = (value: string): string => {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
};

const trimOrFallback = (value: string, fallback: string): string => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
};

const dedupe = (values: string[]): string[] => {
    return Array.from(new Set(values.filter((value) => value.length > 0)));
};

const truncateText = (value: string, maxLength = 170): string => {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength).trimEnd()}...`;
};

const isVideoAsset = (url: string, mime = ""): boolean => {
    if (mime.toLowerCase().startsWith("video/")) {
        return true;
    }

    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
};

const isIframeEmbedUrl = (url: string): boolean =>
    /iframe\.mediadelivery\.net\/embed\//i.test(url);

const isVideoMedia = (item: Pick<StoryMedia, "kind" | "mediaUrl" | "mime">): boolean => {
    if (item.kind === "video") {
        return true;
    }

    return isVideoAsset(item.mediaUrl, item.mime);
};

const isBunnyVideo = (item: Pick<StoryMedia, "kind" | "provider" | "embedUrl">): boolean =>
    item.kind === "video" && item.provider === "bunny" && item.embedUrl.trim().length > 0;

const getVideoPlaybackUrl = (item: StoryMedia): string => {
    if (item.playbackUrl.trim().length > 0) {
        return item.playbackUrl;
    }

    if (item.mediaUrl.trim().length > 0) {
        return item.mediaUrl;
    }

    return "";
};

const getPreviewUrl = (item: StoryMedia): string => {
    if (item.previewUrl.trim().length > 0 && !isIframeEmbedUrl(item.previewUrl)) {
        return item.previewUrl;
    }

    if (item.thumbnailUrl.trim().length > 0 && !isIframeEmbedUrl(item.thumbnailUrl)) {
        return item.thumbnailUrl;
    }

    if (item.mediaUrl.trim().length > 0 && !isIframeEmbedUrl(item.mediaUrl)) {
        return item.mediaUrl;
    }

    if (item.playbackUrl.trim().length > 0 && !isIframeEmbedUrl(item.playbackUrl)) {
        return item.playbackUrl;
    }

    return "";
};

const canUseInlineVideoPreview = (item: StoryMedia): boolean =>
    isVideoMedia(item) &&
    !isBunnyVideo(item) &&
    isVideoAsset(getVideoPlaybackUrl(item), item.mime);

const getOrientation = (width?: number, height?: number): Orientation => {
    if (!width || !height || width <= 0 || height <= 0) {
        return "square";
    }

    const ratio = width / height;

    if (ratio >= 1.2) {
        return "landscape";
    }

    if (ratio <= 0.85) {
        return "portrait";
    }

    return "square";
};

const getAspectRatio = (width?: number, height?: number): number | null => {
    if (!width || !height || width <= 0 || height <= 0) {
        return null;
    }

    return width / height;
};

const getOptimizedImageUrl = (url: string, width: number, height?: number): string => {
    if (!isCloudinaryUrl(url)) {
        return url;
    }

    return buildCloudinaryImageUrl(url, {
        width,
        height,
        crop: typeof height === "number" ? "fill" : "limit",
    });
};

const getImageSrcSet = (url: string, height?: number): string | undefined => {
    if (!isCloudinaryUrl(url)) {
        return undefined;
    }

    return IMAGE_WIDTHS
        .map((width) => `${getOptimizedImageUrl(url, width, height)} ${width}w`)
        .join(", ");
};

const getImageSizes = (url: string): string | undefined => {
    if (!isCloudinaryUrl(url)) {
        return undefined;
    }

    return IMAGE_SIZES;
};

const resolveStoryTrack = (
    categories: string[],
    title: string,
    description: string,
    goal: string,
    style: string,
): string => {
    const searchSpace = [
        ...categories,
        title,
        description,
        goal,
        style,
    ]
        .join(" ")
        .toLowerCase();

    for (const rule of TRACK_RULES) {
        if (rule.keywords.some((keyword) => searchSpace.includes(keyword))) {
            return rule.label;
        }
    }

    if (categories.length > 0) {
        return toTitleCase(categories[0]);
    }

    return "Signature Campaigns";
};

const toStoryMediaFromCms = (entry: UgcWorkMediaContent): StoryMedia => {
    const categories = dedupe(entry.categories.map((category) => category.trim()));
    const title = trimOrFallback(entry.title, "Untitled Story Frame");
    const description = trimOrFallback(
        entry.description,
        "Narrative-driven frame designed to guide the viewer from attention to action.",
    );
    const hook = trimOrFallback(entry.hook, title);
    const goal = trimOrFallback(entry.goal, "Brand awareness");
    const style = trimOrFallback(entry.style, "Editorial storytelling");

    return {
        id: entry.id,
        kind: entry.kind,
        title,
        description,
        hook,
        goal,
        style,
        mediaUrl: entry.sourceUrl || entry.playbackUrl || entry.embedUrl || entry.imageUrl,
        previewUrl: entry.thumbnailUrl || entry.imageUrl || entry.sourceUrl || entry.playbackUrl,
        provider: entry.provider,
        embedUrl: entry.embedUrl,
        playbackUrl: entry.playbackUrl,
        thumbnailUrl: entry.thumbnailUrl,
        mime: entry.mime,
        categories,
        track: resolveStoryTrack(categories, title, description, goal, style),
        width: entry.width,
        height: entry.height,
    };
};

const toStoryCollectionFromCms = (
    collection: UgcShowcaseCollectionContent,
    index: number,
): StoryCollection => {
    const entries = collection.media.map((entry) => toStoryMediaFromCms(entry));
    const fallbackTitle = `Collection ${index + 1}`;
    const title = trimOrFallback(collection.name, fallbackTitle);
    const description = trimOrFallback(
        collection.description,
        "A narrative-first campaign collection designed to guide attention to action.",
    );
    const story = trimOrFallback(
        collection.story,
        "A strategic campaign sequence built to connect emotional storytelling with business outcomes.",
    );
    const goals = dedupe(entries.map((entry) => entry.goal));
    const styles = dedupe(entries.map((entry) => entry.style));
    const inferredTrack = resolveStoryTrack([], title, `${description} ${story}`, goals.join(" "), styles.join(" "));
    const track =
        entries[0]?.track ??
        inferredTrack;

    return {
        id: trimOrFallback(collection.id, `${slugify(title)}-${index + 1}`),
        title,
        subtitle: `${entries.length} assets in this collection`,
        story,
        highlights: collection.insights.length > 0
            ? collection.insights
            : [
                description,
                goals.length > 0
                    ? `Primary goals: ${goals.slice(0, 2).join(" / ")}.`
                    : "Primary goals: awareness and conversion.",
                styles.length > 0
                    ? `Creative direction: ${styles.slice(0, 2).join(" / ")}.`
                    : "Creative direction: cinematic and editorial.",
            ],
        entries,
        track,
    };
};

const toStoryMediaFromMock = (
    item: (typeof mockPortfolioData.items)[number],
    index: number,
): StoryMedia => {
    const categories = dedupe(
        [item.category, item.photoCategory ?? "", ...item.tags]
            .map((value) => value.trim())
            .filter(Boolean),
    );
    const title = trimOrFallback(item.title, `Story Frame ${index + 1}`);
    const description = trimOrFallback(
        item.description,
        item.caption || "Narrative-driven frame crafted for campaign storytelling.",
    );
    const hook = trimOrFallback(item.formatType || "", title);
    const goal = trimOrFallback(item.goal || "", "Brand awareness");
    const style = trimOrFallback(item.style || "", "Editorial storytelling");

    return {
        id: item.id,
        kind: item.kind,
        title,
        description,
        hook,
        goal,
        style,
        mediaUrl: item.coverImage.url,
        previewUrl: item.coverImage.url,
        provider: "",
        embedUrl: "",
        playbackUrl: item.kind === "video" ? item.coverImage.url : "",
        thumbnailUrl: item.coverImage.url,
        mime: item.kind === "photo" ? "image/jpeg" : "",
        categories,
        track: resolveStoryTrack(categories, title, description, goal, style),
    };
};

const buildCollections = (mediaItems: StoryMedia[]): StoryCollection[] => {
    const grouped = new Map<string, StoryMedia[]>();

    for (const item of mediaItems) {
        const current = grouped.get(item.track) ?? [];
        current.push(item);
        grouped.set(item.track, current);
    }

    return Array.from(grouped.entries())
        .map(([track, entries], index) => {
            const goals = dedupe(entries.map((entry) => entry.goal));
            const styles = dedupe(entries.map((entry) => entry.style));
            const beats = entries
                .slice(0, 3)
                .map((entry) => stripMarkdownInline(entry.hook || entry.title))
                .filter(Boolean);

            const sequence =
                beats.length > 0
                    ? beats.join(" -> ")
                    : "Attention -> Trust -> Conversion";

            const story = `This track is sequenced as a full campaign narrative: ${sequence}. Every asset supports the same brand promise so the audience feels one connected story.`;

            return {
                id: `${slugify(track)}-${index + 1}`,
                title: track,
                subtitle: `${entries.length} assets in this collection`,
                story,
                highlights: [
                    `${entries.length} assets mapped to one journey arc.`,
                    goals.length > 0
                        ? `Primary goals: ${goals.slice(0, 2).join(" / ")}.`
                        : "Primary goals: awareness and conversion.",
                    styles.length > 0
                        ? `Creative direction: ${styles.slice(0, 2).join(" / ")}.`
                        : "Creative direction: cinematic and editorial.",
                ],
                entries: entries.slice(0, 6),
                track,
            };
        })
        .sort((a, b) => b.entries.length - a.entries.length);
};

const markdownComponents = {
    p: ({ children }: { children?: ReactNode }) => <p className="mb-3 last:mb-0">{children}</p>,
    ul: ({ children }: { children?: ReactNode }) => (
        <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
        <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
    strong: ({ children }: { children?: ReactNode }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: { children?: ReactNode }) => (
        <em className="italic text-foreground/90">{children}</em>
    ),
    a: ({ children, href }: { children?: ReactNode; href?: string }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:opacity-80"
        >
            {children}
        </a>
    ),
};

const PortfolioShowcase = ({ myWork, showcase }: PortfolioShowcaseProps) => {
    const [activeLane, setActiveLane] = useState<ShowcaseLane>("highlights");
    const [selectedCollection, setSelectedCollection] = useState<StoryCollection | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<StoryMedia | null>(null);
    const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

    const sectionName = myWork?.sectionName?.trim() || "Portfolio Showcase";
    const sectionTitle = myWork?.title?.trim() || "The Story Vault";
    const sectionText =
        myWork?.text?.trim() ||
        "Collections, highlights, and video narratives designed to show brands how each campaign drives emotion, trust, and action.";

    const fallbackShowcaseMedia = useMemo<StoryMedia[]>(() => {
        const cmsMedia = (myWork?.media ?? [])
            .filter((entry) => entry.imageUrl.trim().length > 0)
            .map((entry) => toStoryMediaFromCms(entry));

        if (cmsMedia.length > 0) {
            return cmsMedia;
        }

        return mockPortfolioData.items.map((item, index) => toStoryMediaFromMock(item, index));
    }, [myWork?.media]);

    const separatedCollections = useMemo<StoryCollection[]>(() => {
        return (showcase?.collections ?? [])
            .map((collection, index) => toStoryCollectionFromCms(collection, index))
            .filter((collection) => collection.entries.length > 0);
    }, [showcase?.collections]);

    const separatedHighlights = useMemo<StoryMedia[]>(() => {
        return (showcase?.highlights ?? [])
            .map((entry) => toStoryMediaFromCms(entry))
            .filter(
                (entry) =>
                    entry.mediaUrl.length > 0 ||
                    entry.previewUrl.length > 0 ||
                    entry.embedUrl.length > 0,
            );
    }, [showcase?.highlights]);

    const separatedVideos = useMemo<StoryMedia[]>(() => {
        return (showcase?.videos ?? [])
            .map((entry) => toStoryMediaFromCms(entry))
            .filter(
                (entry) =>
                    entry.mediaUrl.length > 0 ||
                    entry.previewUrl.length > 0 ||
                    entry.embedUrl.length > 0,
            );
    }, [showcase?.videos]);

    const hasSeparatedShowcase = useMemo(() => {
        const hasCollectionMedia = separatedCollections.some(
            (collection) => collection.entries.length > 0,
        );

        return (
            hasCollectionMedia ||
            separatedHighlights.length > 0 ||
            separatedVideos.length > 0
        );
    }, [separatedCollections, separatedHighlights, separatedVideos]);

    const collections = useMemo(() => {
        if (!hasSeparatedShowcase) {
            return buildCollections(fallbackShowcaseMedia);
        }

        return separatedCollections;
    }, [fallbackShowcaseMedia, hasSeparatedShowcase, separatedCollections]);

    const highlights = useMemo(() => {
        if (hasSeparatedShowcase) {
            return separatedHighlights.slice(0, 6);
        }

        const photosOnly = fallbackShowcaseMedia.filter((item) => !isVideoMedia(item));
        const source = photosOnly.length > 0 ? photosOnly : fallbackShowcaseMedia;

        return source.slice(0, 6);
    }, [fallbackShowcaseMedia, hasSeparatedShowcase, separatedHighlights]);

    const videos = useMemo(() => {
        if (hasSeparatedShowcase) {
            return separatedVideos.slice(0, 4);
        }

        return fallbackShowcaseMedia.filter((item) => isVideoMedia(item)).slice(0, 4);
    }, [fallbackShowcaseMedia, hasSeparatedShowcase, separatedVideos]);

    const hasCollections = collections.length > 0;
    const hasHighlights = highlights.length > 0;
    const availableLaneCount = Number(hasCollections) + Number(hasHighlights);

    useEffect(() => {
        const laneStillAvailable =
            (activeLane === "collections" && hasCollections) ||
            (activeLane === "highlights" && hasHighlights);

        if (laneStillAvailable) {
            return;
        }

        if (hasCollections) {
            setActiveLane("collections");
            return;
        }

        if (hasHighlights) {
            setActiveLane("highlights");
            return;
        }
    }, [activeLane, hasCollections, hasHighlights]);

    useEffect(() => {
        setNaturalDimensions(null);
    }, [selectedMedia?.id]);

    useEffect(() => {
        if (!selectedMedia || !isVideoMedia(selectedMedia) || !isBunnyVideo(selectedMedia)) {
            return;
        }

        if (selectedMedia.width && selectedMedia.height) {
            return;
        }

        const probeUrl =
            getPreviewUrl(selectedMedia) || selectedMedia.thumbnailUrl || selectedMedia.mediaUrl;

        if (!probeUrl || isIframeEmbedUrl(probeUrl)) {
            return;
        }

        let cancelled = false;
        const probe = new Image();

        probe.onload = () => {
            if (cancelled) {
                return;
            }

            setNaturalDimensions({
                width: probe.naturalWidth,
                height: probe.naturalHeight,
            });
        };

        probe.src = probeUrl;

        return () => {
            cancelled = true;
        };
    }, [selectedMedia]);

    if (!hasSeparatedShowcase && fallbackShowcaseMedia.length === 0) {
        return null;
    }

    const mediaOrientation = getOrientation(selectedMedia?.width, selectedMedia?.height);
    const mediaDialogSizeClass =
        mediaOrientation === "landscape"
            ? "w-[96vw] max-w-[84rem]"
            : mediaOrientation === "portrait"
                ? "w-[88vw] max-w-[50rem]"
                : "w-[92vw] max-w-[62rem]";
    const selectedMediaAspectRatio =
        getAspectRatio(selectedMedia?.width, selectedMedia?.height) ||
        getAspectRatio(naturalDimensions?.width, naturalDimensions?.height) ||
        (selectedMedia && isVideoMedia(selectedMedia) && isBunnyVideo(selectedMedia)
            ? 9 / 16
            : mediaOrientation === "portrait"
                ? 9 / 16
                : 16 / 9);

    return (
        <section id="portfolio" className="relative overflow-hidden py-14 lg:py-18">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,hsl(var(--accent)/0.18),transparent_35%),radial-gradient(circle_at_92%_0%,hsl(var(--foreground)/0.06),transparent_28%)]" />
            <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,hsl(var(--foreground)/0.16)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.16)_1px,transparent_1px)] [background-size:44px_44px]" />

            <div className="container relative mx-auto px-6 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.75 }}
                    className="mx-auto mb-9 max-w-3xl text-center"
                >
                    <p className="mb-3 inline-flex items-center gap-2 border border-foreground/25 bg-background/80 px-3 py-1.5 font-body text-[0.65rem] uppercase tracking-[0.22em] text-foreground/85 backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        Editorial Storyboard
                    </p>
                    <p className="mb-3 font-body text-[0.62rem] uppercase tracking-[0.26em] text-muted-foreground">
                        {sectionName}
                    </p>
                    <h2 className="font-display text-4xl font-light italic leading-[1.06] text-foreground sm:text-5xl lg:text-6xl">
                        {sectionTitle}
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {sectionText}
                    </p>
                </motion.div>

                {availableLaneCount > 1 && (
                    <div className="mx-auto mb-8 flex max-w-3xl flex-wrap justify-center gap-2">
                        {hasCollections && (
                            <button
                                type="button"
                                onClick={() => setActiveLane("collections")}
                                className={`px-4 py-2 font-body text-[0.62rem] uppercase tracking-[0.16em] transition-all ${
                                    activeLane === "collections"
                                        ? "border border-foreground bg-foreground text-background"
                                        : "border border-border bg-background/75 text-muted-foreground hover:border-foreground hover:text-foreground"
                                }`}
                            >
                                Collections ({collections.length})
                            </button>
                        )}
                        {hasHighlights && (
                            <button
                                type="button"
                                onClick={() => setActiveLane("highlights")}
                                className={`px-4 py-2 font-body text-[0.62rem] uppercase tracking-[0.16em] transition-all ${
                                    activeLane === "highlights"
                                        ? "border border-foreground bg-foreground text-background"
                                        : "border border-border bg-background/75 text-muted-foreground hover:border-foreground hover:text-foreground"
                                }`}
                            >
                                Highlights ({highlights.length})
                            </button>
                        )}
                    </div>
                )}

                {activeLane === "collections" && hasCollections && (
                    <div>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                Collections
                            </p>
                            <h3 className="font-display text-3xl font-light italic text-foreground sm:text-4xl">
                                Narrative-First Campaign Sets
                            </h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {collections.map((collection, index) => (
                            <motion.article
                                key={collection.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.65, delay: index * 0.06 }}
                                className="group overflow-hidden border border-border bg-card/80 backdrop-blur-sm"
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedCollection(collection)}
                                    className="block w-full text-left"
                                    aria-label={`Open collection details for ${collection.title}`}
                                >
                                    <div className="grid grid-cols-2 gap-1 border-b border-border bg-muted/35 p-1">
                                        {collection.entries.slice(0, 4).map((entry) => {
                                            const entryIsVideo = isVideoMedia(entry);
                                            const previewUrl =
                                                getPreviewUrl(entry) || entry.thumbnailUrl || entry.mediaUrl;

                                            return (
                                                <div key={entry.id} className="relative aspect-[4/3] overflow-hidden bg-muted">
                                                    {canUseInlineVideoPreview(entry) ? (
                                                        <video
                                                            src={getVideoPlaybackUrl(entry)}
                                                            muted
                                                            loop
                                                            autoPlay
                                                            playsInline
                                                            preload="metadata"
                                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={getOptimizedImageUrl(previewUrl, IMAGE_WIDTHS[1], 540)}
                                                            srcSet={getImageSrcSet(previewUrl, 540)}
                                                            sizes={getImageSizes(previewUrl)}
                                                            alt={entry.title}
                                                            loading="lazy"
                                                            decoding="async"
                                                            {...protectedImageProps}
                                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                    )}
                                                    {!canUseInlineVideoPreview(entry) && <PhotoProtectionOverlay />}
                                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.06)_0%,rgba(8,8,8,0.52)_100%)]" />
                                                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-background/92 px-2 py-1 font-body text-[0.52rem] uppercase tracking-[0.15em] text-foreground">
                                                        {entryIsVideo ? <Clapperboard className="h-3 w-3 text-accent" /> : <Layers className="h-3 w-3 text-accent" />}
                                                        {entryIsVideo ? "Video" : "Frame"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="p-4 sm:p-5">
                                        <p className="font-body text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
                                            {collection.subtitle}
                                        </p>
                                        <h4 className="mt-2 font-display text-2xl font-light italic leading-tight text-foreground sm:text-3xl">
                                            {collection.title}
                                        </h4>
                                        <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
                                            {truncateText(collection.story, 220)}
                                        </p>
                                        <ul className="mt-3 space-y-1.5">
                                            {collection.highlights.map((highlight) => (
                                                <li
                                                    key={`${collection.id}-${highlight}`}
                                                    className="flex items-start gap-2 font-body text-xs leading-relaxed text-foreground/80"
                                                >
                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                                                    {highlight}
                                                </li>
                                            ))}
                                        </ul>
                                        <span className="mt-4 inline-flex items-center gap-1.5 font-body text-[0.62rem] uppercase tracking-[0.16em] text-foreground">
                                            Open Collection Story
                                            <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
                                        </span>
                                    </div>
                                </button>
                            </motion.article>
                        ))}
                    </div>
                </div>
                )}

                {activeLane === "highlights" && hasHighlights && (
                    <div>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                Highlights
                            </p>
                            <h3 className="font-display text-3xl font-light italic text-foreground sm:text-4xl">
                                Signature Story Frames
                            </h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {highlights.map((item, index) => {
                            const highlightPreviewUrl =
                                getPreviewUrl(item) || item.thumbnailUrl || item.mediaUrl;

                            return (
                                <motion.button
                                key={item.id}
                                type="button"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.6, delay: index * 0.04 }}
                                onClick={() => setSelectedMedia(item)}
                                className="group overflow-hidden border border-border bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent"
                                aria-label={`Open highlight details for ${item.title}`}
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                                    {canUseInlineVideoPreview(item) ? (
                                        <video
                                            src={getVideoPlaybackUrl(item)}
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                            preload="metadata"
                                            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <img
                                            src={getOptimizedImageUrl(
                                                highlightPreviewUrl,
                                                IMAGE_WIDTHS[1],
                                            )}
                                            srcSet={getImageSrcSet(
                                                highlightPreviewUrl,
                                            )}
                                            sizes={getImageSizes(
                                                highlightPreviewUrl,
                                            )}
                                            alt={item.title}
                                            loading="lazy"
                                            decoding="async"
                                            {...protectedImageProps}
                                            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                        />
                                    )}
                                    {!canUseInlineVideoPreview(item) && <PhotoProtectionOverlay />}
                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,12,0.04)_10%,rgba(12,12,12,0.72)_100%)]" />
                                    <span className="absolute left-3 top-3 bg-background/90 px-2 py-1 font-body text-[0.52rem] uppercase tracking-[0.16em] text-foreground">
                                        {item.track}
                                    </span>
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <p className="font-body text-[0.54rem] uppercase tracking-[0.16em] text-primary-foreground/80">
                                            Hook
                                        </p>
                                        <p className="mt-1 font-display text-xl font-light italic leading-tight text-primary-foreground">
                                            {item.hook}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h4 className="font-display text-2xl font-light leading-tight text-foreground">
                                        {item.title}
                                    </h4>
                                    <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
                                        {truncateText(stripMarkdownInline(item.description), 170)}
                                    </p>
                                    <p className="mt-3 font-body text-[0.62rem] uppercase tracking-[0.15em] text-foreground/75">
                                        {item.goal} / {item.style}
                                    </p>
                                </div>
                            </motion.button>
                            );
                        })}
                    </div>
                </div>
                )}

                <div className="mt-14 overflow-hidden border border-foreground/20 bg-foreground text-primary-foreground">
                    <div className="p-4 sm:p-5 lg:p-6">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-primary-foreground/70">
                                    Videos
                                </p>
                                <h3 className="font-display text-3xl font-light italic text-primary-foreground sm:text-4xl">
                                    Cinematic Story Cuts
                                </h3>
                            </div>
                        </div>

                        {videos.length === 0 ? (
                            <p className="font-body text-sm text-primary-foreground/75">
                                Add video assets to unlock this cinematic story board.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {videos.map((video, index) => {
                                    const isPortrait = getOrientation(video.width, video.height) === "portrait";
                                    const previewHeight = isPortrait ? 980 : 560;

                                    return (
                                        <motion.button
                                            key={video.id}
                                            type="button"
                                            initial={{ opacity: 0, y: 24 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "-60px" }}
                                            transition={{ duration: 0.6, delay: index * 0.06 }}
                                            onClick={() => setSelectedMedia(video)}
                                            className="group overflow-hidden border border-primary-foreground/20 bg-primary-foreground/[0.06] text-left transition-all duration-300 hover:border-accent"
                                            aria-label={`Open video story details for ${video.title}`}
                                        >
                                            <div className={`relative overflow-hidden bg-black/30 ${isPortrait ? "aspect-[9/16]" : "aspect-[16/10]"}`}>
                                                {canUseInlineVideoPreview(video) ? (
                                                    <video
                                                        src={getVideoPlaybackUrl(video)}
                                                        muted
                                                        loop
                                                        autoPlay
                                                        playsInline
                                                        preload="metadata"
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <img
                                                        src={getOptimizedImageUrl(
                                                            getPreviewUrl(video) ||
                                                                video.thumbnailUrl ||
                                                                video.mediaUrl,
                                                            IMAGE_WIDTHS[1],
                                                            previewHeight,
                                                        )}
                                                        srcSet={getImageSrcSet(
                                                            getPreviewUrl(video) ||
                                                                video.thumbnailUrl ||
                                                                video.mediaUrl,
                                                            previewHeight,
                                                        )}
                                                        sizes={getImageSizes(
                                                            getPreviewUrl(video) ||
                                                                video.thumbnailUrl ||
                                                                video.mediaUrl,
                                                        )}
                                                        alt={video.title}
                                                        loading="lazy"
                                                        decoding="async"
                                                        {...protectedImageProps}
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                )}
                                                {!canUseInlineVideoPreview(video) && <PhotoProtectionOverlay />}
                                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.12)_0%,rgba(8,8,8,0.75)_100%)]" />
                                                <span className="absolute left-3 top-3 inline-flex items-center gap-1 bg-background/90 px-2 py-1 font-body text-[0.52rem] uppercase tracking-[0.14em] text-foreground">
                                                    <Clapperboard className="h-3 w-3 text-accent" />
                                                    {video.provider === "bunny" ? "Bunny Stream" : "Video Story"}
                                                </span>
                                                <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:bg-accent group-hover:text-accent-foreground">
                                                    <Play className="h-3.5 w-3.5" />
                                                </span>
                                            </div>

                                            <div className="p-3.5">
                                                <p className="font-body text-[0.54rem] uppercase tracking-[0.16em] text-primary-foreground/72">
                                                    Campaign Hook
                                                </p>
                                                <h4 className="mt-1 font-display text-2xl font-light leading-tight text-primary-foreground">
                                                    {video.hook}
                                                </h4>
                                                <p className="mt-2 font-body text-xs leading-relaxed text-primary-foreground/78">
                                                    {truncateText(stripMarkdownInline(video.description), 130)}
                                                </p>
                                                <p className="mt-2.5 font-body text-[0.58rem] uppercase tracking-[0.14em] text-primary-foreground/70">
                                                    {video.goal} / {video.style}
                                                </p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                open={Boolean(selectedCollection)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedCollection(null);
                    }
                }}
            >
                <DialogContent className="w-[96vw] max-w-5xl max-h-[86vh] overflow-y-auto p-0">
                    {selectedCollection && (
                        <div className="grid grid-cols-1 md:grid-cols-[1.08fr_0.92fr]">
                            <div className="border-b border-border bg-muted/30 p-3 sm:p-4 md:border-b-0 md:border-r">
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedCollection.entries.map((entry) => (
                                        <div key={entry.id} className="relative aspect-[4/3] overflow-hidden bg-background">
                                            {canUseInlineVideoPreview(entry) ? (
                                                <video
                                                    src={getVideoPlaybackUrl(entry)}
                                                    muted
                                                    loop
                                                    autoPlay
                                                    playsInline
                                                    preload="metadata"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={getOptimizedImageUrl(
                                                        getPreviewUrl(entry) || entry.thumbnailUrl || entry.mediaUrl,
                                                        IMAGE_WIDTHS[1],
                                                        520,
                                                    )}
                                                    srcSet={getImageSrcSet(
                                                        getPreviewUrl(entry) || entry.thumbnailUrl || entry.mediaUrl,
                                                        520,
                                                    )}
                                                    sizes={getImageSizes(
                                                        getPreviewUrl(entry) || entry.thumbnailUrl || entry.mediaUrl,
                                                    )}
                                                    alt={entry.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    {...protectedImageProps}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                            {!canUseInlineVideoPreview(entry) && <PhotoProtectionOverlay />}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                <p className="font-body text-[0.52rem] uppercase tracking-[0.12em] text-primary-foreground/90">
                                                    {truncateText(stripMarkdownInline(entry.hook || entry.title), 48)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 pt-12 sm:p-6 sm:pt-12">
                                <DialogHeader className="text-left">
                                    <p className="font-body text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                        {selectedCollection.subtitle}
                                    </p>
                                    <DialogTitle className="font-display text-3xl font-light italic leading-tight text-foreground">
                                        {selectedCollection.title}
                                    </DialogTitle>
                                    <p className="font-body text-sm leading-relaxed text-muted-foreground">
                                        {selectedCollection.story}
                                    </p>
                                </DialogHeader>

                                <div className="mt-4 border-t border-border pt-3">
                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Narrative Blueprint
                                    </p>
                                    <ul className="mt-2.5 space-y-1.5">
                                        {selectedCollection.highlights.map((highlight) => (
                                            <li
                                                key={`${selectedCollection.id}-${highlight}`}
                                                className="flex items-start gap-2 font-body text-sm text-foreground/85"
                                            >
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                                                {highlight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-4 border-t border-border pt-3">
                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Asset Flow
                                    </p>
                                    <ol className="mt-2.5 space-y-1.5">
                                        {selectedCollection.entries.map((entry, index) => (
                                            <li key={entry.id} className="flex gap-3">
                                                <span className="font-body text-xs uppercase tracking-[0.16em] text-accent">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                                <div>
                                                    <p className="font-body text-sm text-foreground">{entry.title}</p>
                                                    <p className="font-body text-xs text-muted-foreground">
                                                        {truncateText(stripMarkdownInline(entry.hook), 92)}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(selectedMedia)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedMedia(null);
                    }
                }}
            >
                <DialogContent className={`p-0 max-h-[86vh] overflow-hidden ${mediaDialogSizeClass}`}>
                    {selectedMedia && (
                        <div className="grid h-full max-h-[86vh] grid-cols-1 md:grid-cols-[minmax(0,1fr)_330px]">
                            <div className="overflow-auto bg-background p-1.5">
                                <div className="flex min-h-full w-full items-center justify-center">
                                    {isVideoMedia(selectedMedia) && isBunnyVideo(selectedMedia) ? (
                                        <div
                                            className={`relative mx-auto overflow-hidden bg-black ${selectedMediaAspectRatio < 1 ? "inline-block h-[78vh] max-w-full" : "w-full max-w-5xl"}`}
                                            style={{ aspectRatio: selectedMediaAspectRatio }}
                                        >
                                            <iframe
                                                src={selectedMedia.embedUrl}
                                                title={selectedMedia.title}
                                                loading="lazy"
                                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                                allowFullScreen
                                                className="absolute inset-0 h-full w-full border-0"
                                            />
                                        </div>
                                    ) : isVideoAsset(getVideoPlaybackUrl(selectedMedia), selectedMedia.mime) ? (
                                        <video
                                            src={getVideoPlaybackUrl(selectedMedia)}
                                            controls
                                            autoPlay
                                            playsInline
                                            className="mx-auto block h-auto w-auto max-h-[78vh] max-w-full object-contain"
                                            onLoadedMetadata={(event) => {
                                                const media = event.currentTarget;
                                                setNaturalDimensions({
                                                    width: media.videoWidth,
                                                    height: media.videoHeight,
                                                });
                                            }}
                                        />
                                    ) : (
                                        <div className="relative inline-block max-w-full">
                                            <img
                                                src={getOptimizedImageUrl(
                                                    getPreviewUrl(selectedMedia) ||
                                                        selectedMedia.thumbnailUrl ||
                                                        selectedMedia.mediaUrl,
                                                    2400,
                                                )}
                                                alt={selectedMedia.title}
                                                {...protectedImageProps}
                                                className="mx-auto block h-auto w-auto max-h-[78vh] max-w-full object-contain"
                                                onLoad={(event) => {
                                                    const media = event.currentTarget;
                                                    setNaturalDimensions({
                                                        width: media.naturalWidth,
                                                        height: media.naturalHeight,
                                                    });
                                                }}
                                            />
                                            <PhotoProtectionOverlay />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-auto border-t border-border bg-background p-4 pt-12 md:border-l md:border-t-0 md:p-5 md:pt-12">
                                <DialogHeader className="text-left">
                                    <DialogTitle className="font-display text-2xl font-light italic leading-tight text-foreground">
                                        {selectedMedia.title}
                                    </DialogTitle>
                                    <div className="font-body text-sm leading-relaxed text-muted-foreground">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                            {selectedMedia.description}
                                        </ReactMarkdown>
                                    </div>
                                </DialogHeader>

                                <div className="mt-4 space-y-2.5 border-t border-border pt-3">
                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Hook
                                    </p>
                                    <p className="font-display text-lg italic leading-tight text-foreground">
                                        {selectedMedia.hook}
                                    </p>

                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Goal
                                    </p>
                                    <p className="font-body text-sm text-foreground">{selectedMedia.goal}</p>

                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Style
                                    </p>
                                    <p className="font-body text-sm text-foreground">{selectedMedia.style}</p>

                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Track
                                    </p>
                                    <p className="font-body text-sm text-foreground">{selectedMedia.track}</p>

                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Categories
                                    </p>
                                    <p className="font-body text-sm text-foreground">
                                        {selectedMedia.categories.length > 0
                                            ? selectedMedia.categories.join(" / ")
                                            : "Uncategorized"}
                                    </p>

                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Format
                                    </p>
                                    <p className="font-body text-sm text-foreground">
                                        {isVideoMedia(selectedMedia) ? "Video" : "Photo"}
                                    </p>

                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Resolution
                                    </p>
                                    <p className="font-body text-sm text-foreground">
                                        {naturalDimensions
                                            ? `${naturalDimensions.width} x ${naturalDimensions.height}px`
                                            : selectedMedia.width && selectedMedia.height
                                                ? `${selectedMedia.width} x ${selectedMedia.height}px`
                                                : "Unknown"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default PortfolioShowcase;
