import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clapperboard, Eye, EyeOff, Loader2, MoveHorizontal, Play, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

/** Inline carousel arrows that hide themselves when all slides fit in view. */
function CarouselNav({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
    const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();
    if (!canScrollPrev && !canScrollNext) return null;

    const isLight = variant === "light";
    const btnBase =
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40";
    const btnTheme = isLight
        ? "border-accent bg-background/90 text-foreground hover:bg-accent hover:text-accent-foreground"
        : "border-accent bg-primary-foreground/10 text-primary-foreground hover:bg-accent hover:text-accent-foreground";

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <button
                type="button"
                className={cn(btnBase, btnTheme)}
                disabled={!canScrollPrev}
                onClick={scrollPrev}
                aria-label="Previous slide"
            >
                <ArrowLeft className="h-4 w-4" />
            </button>
            <button
                type="button"
                className={cn(btnBase, btnTheme)}
                disabled={!canScrollNext}
                onClick={scrollNext}
                aria-label="Next slide"
            >
                <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    );
}

function CarouselProgress({
    total,
    className,
    variant = "light",
}: {
    total: number;
    className?: string;
    variant?: "light" | "dark";
}) {
    const { api } = useCarousel();
    const [shownCount, setShownCount] = useState(0);

    useEffect(() => {
        if (!api) {
            return;
        }

        const updateShownCount = () => {
            const selectedSnap = api.selectedScrollSnap();
            const slideRegistry = api.internalEngine().slideRegistry;
            const snapSlides = slideRegistry[selectedSnap] ?? [];

            if (snapSlides.length > 0) {
                const maxSnapSlideIndex = Math.max(...snapSlides);
                setShownCount(Math.min(total, maxSnapSlideIndex + 1));
                return;
            }

            const snapCount = api.scrollSnapList().length;
            if (snapCount > 0) {
                const progressRatio = (selectedSnap + 1) / snapCount;
                const fallbackShown = Math.max(1, Math.ceil(total * progressRatio));
                setShownCount(Math.min(total, fallbackShown));
                return;
            }

            setShownCount(total > 0 ? 1 : 0);
        };

        updateShownCount();
        api.on("select", updateShownCount);
        api.on("reInit", updateShownCount);

        return () => {
            api.off("select", updateShownCount);
            api.off("reInit", updateShownCount);
        };
    }, [api, total]);

    if (total <= 1) {
        return null;
    }

    const toneClass =
        variant === "light"
            ? "text-muted-foreground border-border bg-background/75"
            : "text-primary-foreground/75 border-primary-foreground/25 bg-primary-foreground/[0.08]";

    return (
        <p
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-1 font-body text-[0.52rem] uppercase tracking-[0.14em] sm:px-2.5 sm:text-[0.58rem] sm:tracking-[0.16em]",
                toneClass,
                className,
            )}
        >
            {shownCount}/{total}
        </p>
    );
}

function MobileSwipeHint({ className }: { className?: string }) {
    return (
        <p
            className={cn(
                "inline-flex items-center gap-1.5 font-body text-[0.56rem] uppercase tracking-[0.16em] sm:hidden",
                className,
            )}
        >
            <MoveHorizontal className="h-3.5 w-3.5" />
            Swipe for more
        </p>
    );
}
import type {
    UgcShowcaseCollectionContent,
    UgcShowcaseContent,
    UgcWorkContent,
    UgcWorkMediaContent,
} from "@/hooks/useUgcContent";
import { buildCloudinaryImageUrl, isCloudinaryUrl } from "@/lib/cloudinary";
import { PhotoProtectionOverlay, protectedImageProps } from "@/components/PhotoProtection";
import { resolveStoryTrack } from "@/components/portfolioShowcaseTrack";
import { dedupeMediaByIdentity, removeMediaPresentInCollections, resolveMediaIdentity } from "@/components/portfolioShowcaseMedia";

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
    focalPointX?: number;
    focalPointY?: number;
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

const IMAGE_WIDTHS = [640, 960, 1280];
const IMAGE_SIZES = "(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 31vw";
const ALL_HIGHLIGHTS_CATEGORY = "All";

const stripMarkdownInline = (value: string): string => {
    return value
        .replace(/!\[[^\]]*]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
        .replace(/[_*`~>#-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const slugify = (value: string): string => {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
};

const trimOrEmpty = (value: string): string => value.trim();

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

export const selectShowcaseVideos = <T extends Pick<StoryMedia, "kind" | "mediaUrl" | "mime">>(
    sourceMedia: T[],
    hasSeparatedShowcase: boolean,
    separatedVideos: T[],
): T[] => {
    if (hasSeparatedShowcase) {
        return separatedVideos;
    }

    return sourceMedia.filter((item) => isVideoMedia(item));
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

const clampFocalPoint = (value?: number): number => {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return 50;
    }

    return Math.max(0, Math.min(100, value));
};

const getMediaObjectPosition = (
    item: Pick<StoryMedia, "focalPointX" | "focalPointY">,
): CSSProperties => ({
    objectPosition: `${clampFocalPoint(item.focalPointX)}% ${clampFocalPoint(item.focalPointY)}%`,
});

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

const hasMediaSource = (
    entry: Pick<StoryMedia, "mediaUrl" | "previewUrl" | "embedUrl" | "playbackUrl" | "thumbnailUrl">,
): boolean =>
    [entry.mediaUrl, entry.previewUrl, entry.embedUrl, entry.playbackUrl, entry.thumbnailUrl].some(
        (value) => value.trim().length > 0,
    );

const toStoryMediaFromCms = (entry: UgcWorkMediaContent): StoryMedia => {
    const categories = dedupe(entry.categories.map((category) => category.trim()));
    const title = trimOrEmpty(entry.title);
    const description = trimOrEmpty(entry.description);
    const hook = trimOrEmpty(entry.hook);
    const goal = trimOrEmpty(entry.goal);
    const style = trimOrEmpty(entry.style);
    const mediaUrl =
        entry.kind === "video"
            ? entry.playbackUrl || entry.sourceUrl || entry.embedUrl || entry.imageUrl
            : entry.sourceUrl || entry.imageUrl || entry.thumbnailUrl || entry.playbackUrl || entry.embedUrl;
    const previewUrl =
        entry.kind === "video"
            ? entry.thumbnailUrl || entry.imageUrl || entry.sourceUrl || entry.playbackUrl
            : entry.imageUrl || entry.sourceUrl || entry.thumbnailUrl || entry.playbackUrl;

    return {
        id: entry.id,
        kind: entry.kind,
        title,
        description,
        hook,
        goal,
        style,
        mediaUrl,
        previewUrl,
        provider: entry.provider,
        embedUrl: entry.embedUrl,
        playbackUrl: entry.playbackUrl,
        thumbnailUrl: entry.thumbnailUrl,
        mime: entry.mime,
        categories,
        track: resolveStoryTrack(categories, title, description, goal, style),
        focalPointX: entry.focalPointX,
        focalPointY: entry.focalPointY,
        width: entry.width,
        height: entry.height,
    };
};

const toStoryCollectionFromCms = (
    collection: UgcShowcaseCollectionContent,
    index: number,
): StoryCollection => {
    const entries = collection.media
        .map((entry) => toStoryMediaFromCms(entry))
        .filter((entry) => hasMediaSource(entry));
    const title = trimOrEmpty(collection.name);
    const story = trimOrEmpty(collection.story);
    const track = entries[0]?.track ?? resolveStoryTrack([], title, story, "", "");
    const insights = collection.insights.map((item) => item.trim()).filter((item) => item.length > 0);

    return {
        id: collection.id.trim() || `${slugify(title || "collection")}-${index + 1}`,
        title,
        subtitle: `${entries.length} assets in this collection`,
        story,
        highlights: insights,
        entries,
        track,
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
            const story = "";

            return {
                id: `${slugify(track || "collection")}-${index + 1}`,
                title: track,
                subtitle: `${entries.length} assets in this collection`,
                story,
                highlights: [],
                entries,
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

const getCollectionPreviewGridClass = (count: number): string => {
    if (count <= 1) {
        return "grid-cols-1";
    }

    if (count <= 4) {
        return "grid-cols-2";
    }

    if (count <= 6) {
        return "grid-cols-2 md:grid-cols-3";
    }

    return "grid-cols-2 md:grid-cols-4";
};

const getCollectionPreviewAspectClass = (count: number): string => {
    if (count <= 1) {
        return "aspect-[16/10] md:aspect-[16/9]";
    }

    if (count <= 2) {
        return "aspect-[4/3] md:aspect-[16/10]";
    }

    if (count <= 4) {
        return "aspect-[4/3]";
    }

    return "aspect-square";
};

const PortfolioShowcase = ({ myWork, showcase }: PortfolioShowcaseProps) => {
    const [selectedCollection, setSelectedCollection] = useState<StoryCollection | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<StoryMedia | null>(null);
    const [selectedHighlightCategory, setSelectedHighlightCategory] = useState(ALL_HIGHLIGHTS_CATEGORY);
    const [mediaSequence, setMediaSequence] = useState<StoryMedia[]>([]);
    const [mediaSequenceIndex, setMediaSequenceIndex] = useState(-1);
    const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
    const [showMobileMediaDetails, setShowMobileMediaDetails] = useState(false);
    const [mediaLoaded, setMediaLoaded] = useState(false);

    const sectionName = myWork?.sectionName?.trim() ?? "";
    const sectionTitle = myWork?.title?.trim() ?? "";
    const sectionText = myWork?.text?.trim() ?? "";

    const sourceMedia = useMemo<StoryMedia[]>(() => {
        const mapped = (myWork?.media ?? [])
            .map((entry) => toStoryMediaFromCms(entry))
            .filter((entry) => hasMediaSource(entry));

        return dedupeMediaByIdentity(mapped);
    }, [myWork?.media]);

    const separatedCollections = useMemo<StoryCollection[]>(() => {
        return (showcase?.collections ?? [])
            .map((collection, index) => {
                const mapped = toStoryCollectionFromCms(collection, index);

                return {
                    ...mapped,
                    entries: dedupeMediaByIdentity(mapped.entries),
                };
            })
            .filter((collection) => collection.entries.length > 0);
    }, [showcase?.collections]);

    const separatedHighlights = useMemo<StoryMedia[]>(() => {
        const mapped = (showcase?.highlights ?? [])
            .map((entry) => toStoryMediaFromCms(entry))
            .filter((entry) => hasMediaSource(entry));

        return dedupeMediaByIdentity(mapped);
    }, [showcase?.highlights]);

    const separatedVideos = useMemo<StoryMedia[]>(() => {
        return (showcase?.videos ?? [])
            .map((entry) => toStoryMediaFromCms(entry))
            .filter((entry) => hasMediaSource(entry));
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
            return buildCollections(sourceMedia);
        }

        return separatedCollections;
    }, [sourceMedia, hasSeparatedShowcase, separatedCollections]);

    const highlights = useMemo(() => {
        if (hasSeparatedShowcase) {
            return removeMediaPresentInCollections(separatedHighlights, collections);
        }

        const photosOnly = sourceMedia.filter((item) => !isVideoMedia(item));
        const source = photosOnly.length > 0 ? photosOnly : sourceMedia;

        return source;
    }, [sourceMedia, hasSeparatedShowcase, separatedHighlights, collections]);

    const highlightCategories = useMemo(() => {
        const categories = new Set<string>();

        for (const item of highlights) {
            for (const category of item.categories) {
                const normalized = category.trim();
                if (normalized.length > 0) {
                    categories.add(normalized);
                }
            }
        }

        return [ALL_HIGHLIGHTS_CATEGORY, ...Array.from(categories)];
    }, [highlights]);

    const filteredHighlights = useMemo(() => {
        if (selectedHighlightCategory === ALL_HIGHLIGHTS_CATEGORY) {
            return highlights;
        }

        return highlights.filter((item) =>
            item.categories.some((category) => category.trim() === selectedHighlightCategory),
        );
    }, [highlights, selectedHighlightCategory]);

    const videos = useMemo(
        () => selectShowcaseVideos(sourceMedia, hasSeparatedShowcase, separatedVideos),
        [sourceMedia, hasSeparatedShowcase, separatedVideos],
    );

    const hasCollections = collections.length > 0;
    const hasHighlights = highlights.length > 0;

    useEffect(() => {
        if (!highlightCategories.includes(selectedHighlightCategory)) {
            setSelectedHighlightCategory(ALL_HIGHLIGHTS_CATEGORY);
        }
    }, [highlightCategories, selectedHighlightCategory]);

    useEffect(() => {
        setNaturalDimensions(null);
        setShowMobileMediaDetails(false);
        setMediaLoaded(false);
    }, [selectedMedia?.id]);

    const openMedia = (entry: StoryMedia, sequence?: StoryMedia[]) => {
        const nextSequence = sequence && sequence.length > 0 ? sequence : [];

        if (nextSequence.length > 0) {
            const targetIdentity = resolveMediaIdentity(entry);
            const resolvedIndex = nextSequence.findIndex((item) => {
                if (targetIdentity.length > 0) {
                    return resolveMediaIdentity(item) === targetIdentity;
                }

                return item.id === entry.id;
            });

            setMediaSequence(nextSequence);
            setMediaSequenceIndex(resolvedIndex >= 0 ? resolvedIndex : 0);
        } else {
            setMediaSequence([]);
            setMediaSequenceIndex(-1);
        }

        setSelectedMedia(entry);
    };

    const openCollectionEntry = (entry: StoryMedia) => {
        setSelectedCollection(null);
        openMedia(entry, selectedCollection?.entries ?? []);
    };

    const canStepMedia = mediaSequence.length > 1 && mediaSequenceIndex >= 0;
    const canStepMediaPrev = canStepMedia && mediaSequenceIndex > 0;
    const canStepMediaNext = canStepMedia && mediaSequenceIndex < mediaSequence.length - 1;

    const stepMedia = useCallback((nextIndex: number) => {
        if (!canStepMedia || nextIndex < 0 || nextIndex >= mediaSequence.length) {
            return;
        }

        setMediaSequenceIndex(nextIndex);
        setSelectedMedia(mediaSequence[nextIndex]);
    }, [canStepMedia, mediaSequence]);

    const goToPrevMedia = useCallback(() => {
        if (!canStepMediaPrev) {
            return;
        }

        stepMedia(mediaSequenceIndex - 1);
    }, [canStepMediaPrev, stepMedia, mediaSequenceIndex]);

    const goToNextMedia = useCallback(() => {
        if (!canStepMediaNext) {
            return;
        }

        stepMedia(mediaSequenceIndex + 1);
    }, [canStepMediaNext, stepMedia, mediaSequenceIndex]);

    useEffect(() => {
        if (!selectedMedia || !canStepMedia) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                goToPrevMedia();
                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                goToNextMedia();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [selectedMedia, canStepMedia, goToPrevMedia, goToNextMedia]);

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

    if (!hasSeparatedShowcase && sourceMedia.length === 0) {
        return null;
    }

    const mediaOrientation = getOrientation(selectedMedia?.width, selectedMedia?.height);
    const mediaDialogSizeClass =
        mediaOrientation === "landscape"
            ? "md:w-[98vw] md:max-w-[92rem]"
            : mediaOrientation === "portrait"
                ? "md:w-[90vw] md:max-w-[56rem]"
                : "md:w-[94vw] md:max-w-[68rem]";
    const selectedMediaAspectRatio =
        getAspectRatio(selectedMedia?.width, selectedMedia?.height) ||
        getAspectRatio(naturalDimensions?.width, naturalDimensions?.height) ||
        (selectedMedia && isVideoMedia(selectedMedia) && isBunnyVideo(selectedMedia)
            ? 9 / 16
            : mediaOrientation === "portrait"
                ? 9 / 16
                : 16 / 9);
    const isMobileLandscapeMedia = mediaOrientation !== "portrait";

    return (
        <section id="portfolio" className="relative overflow-hidden py-14 lg:py-18">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,hsl(var(--accent)/0.18),transparent_35%),radial-gradient(circle_at_92%_0%,hsl(var(--foreground)/0.06),transparent_28%)]" />
            <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,hsl(var(--foreground)/0.16)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.16)_1px,transparent_1px)] [background-size:44px_44px]" />

            <div className="container relative mx-auto px-6 lg:px-10">
                {(sectionName || sectionTitle || sectionText) && (
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
                        {sectionName && (
                            <p className="mb-3 font-body text-[0.62rem] uppercase tracking-[0.26em] text-muted-foreground">
                                {sectionName}
                            </p>
                        )}
                        {sectionTitle && (
                            <h2 className="font-display text-4xl font-light italic leading-[1.06] text-foreground sm:text-5xl lg:text-6xl">
                                {sectionTitle}
                            </h2>
                        )}
                        {sectionText && (
                            <p className="mx-auto mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                                {sectionText}
                            </p>
                        )}
                    </motion.div>
                )}

                {hasCollections && (
                    <Carousel
                        opts={{ align: "start", slidesToScroll: "auto" }}
                        className="w-full"
                    >
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                Collections
                            </p>
                            <h3 className="font-display text-3xl font-light italic text-foreground sm:text-4xl">
                                Narrative-First Campaign Sets
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {collections.length > 1 && (
                                <MobileSwipeHint className="text-muted-foreground" />
                            )}
                            <CarouselProgress total={collections.length} variant="light" />
                            <CarouselNav variant="light" />
                        </div>
                    </div>

                    <CarouselContent className="-ml-4">
                        {collections.map((collection, index) => {
                            const coverEntry = collection.entries[0];
                            const coverPreviewUrl =
                                getPreviewUrl(coverEntry) || coverEntry.thumbnailUrl || coverEntry.mediaUrl;
                            const coverIsVideo = isVideoMedia(coverEntry);
                            const shouldPrioritizePreview = index < 2;

                            return (
                                <CarouselItem
                                    key={collection.id}
                                    className="pl-4 basis-[88%] sm:basis-1/2 lg:basis-1/3 2xl:basis-1/4"
                                >
                                <article className="group h-full">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCollection(collection)}
                                        className="block h-full w-full text-left"
                                        aria-label={`Open collection details for ${collection.title}`}
                                    >
                                        <div className="relative overflow-hidden bg-muted aspect-[4/5] sm:aspect-[3/4]">
                                            {canUseInlineVideoPreview(coverEntry) ? (
                                                <video
                                                    src={getVideoPlaybackUrl(coverEntry)}
                                                    muted
                                                    loop
                                                    autoPlay
                                                    playsInline
                                                    preload={shouldPrioritizePreview ? "auto" : "metadata"}
                                                    poster={coverPreviewUrl}
                                                    style={getMediaObjectPosition(coverEntry)}
                                                    className="absolute inset-0 h-full w-full object-cover scale-[1.04] transition-transform duration-[1.2s] ease-out group-hover:scale-[1.08]"
                                                />
                                            ) : (
                                                <img
                                                    src={getOptimizedImageUrl(coverPreviewUrl, IMAGE_WIDTHS[1])}
                                                    srcSet={getImageSrcSet(coverPreviewUrl)}
                                                    sizes={getImageSizes(coverPreviewUrl)}
                                                    alt={coverEntry.title}
                                                    loading={shouldPrioritizePreview ? "eager" : "lazy"}
                                                    decoding="async"
                                                    fetchPriority={shouldPrioritizePreview ? "high" : "auto"}
                                                    {...protectedImageProps}
                                                    style={getMediaObjectPosition(coverEntry)}
                                                    className="absolute inset-0 h-full w-full object-cover scale-[1.04] transition-transform duration-[1.2s] ease-out group-hover:scale-[1.08]"
                                                />
                                            )}
                                            {!canUseInlineVideoPreview(coverEntry) && <PhotoProtectionOverlay />}

                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 via-[45%] to-transparent" />
                                            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />

                                            {coverIsVideo && (
                                                <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 font-body text-[0.52rem] uppercase tracking-[0.15em] text-foreground backdrop-blur-sm">
                                                    <Clapperboard className="h-3 w-3 text-accent" />
                                                    Video
                                                </span>
                                            )}

                                            <span className="absolute right-3 top-3 z-[2] inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 font-body text-[0.52rem] uppercase tracking-[0.15em] text-foreground backdrop-blur-sm">
                                                {collection.entries.length} assets
                                            </span>

                                            <div className="absolute inset-x-0 bottom-0 z-[2] p-4 sm:p-5">
                                                {collection.title && (
                                                    <h4 className="font-display text-2xl font-light italic leading-tight text-white sm:text-3xl drop-shadow-sm">
                                                        {collection.title}
                                                    </h4>
                                                )}
                                                {collection.story && (
                                                    <p className="mt-1.5 font-body text-[0.8rem] leading-relaxed text-white/80 line-clamp-2">
                                                        {truncateText(collection.story, 120)}
                                                    </p>
                                                )}

                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="inline-flex items-center gap-1.5 font-body text-[0.62rem] uppercase tracking-[0.16em] text-white/90 transition-all duration-300 group-hover:gap-2.5">
                                                        Explore Collection
                                                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                    </button>
                                </article>
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>
                </Carousel>
                )}

                {hasCollections && hasHighlights && (
                    <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                )}

                {hasHighlights && (
                    <Carousel
                        opts={{ align: "start", slidesToScroll: "auto" }}
                        className="w-full"
                    >
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                Highlights
                            </p>
                            <h3 className="font-display text-3xl font-light italic text-foreground sm:text-4xl">
                                Signature Story Frames
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {filteredHighlights.length > 1 && (
                                <MobileSwipeHint className="text-muted-foreground" />
                            )}
                            <CarouselProgress total={filteredHighlights.length} variant="light" />
                            <CarouselNav variant="light" />
                        </div>
                    </div>

                    {highlightCategories.length > 1 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {highlightCategories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setSelectedHighlightCategory(category)}
                                    className={`px-3 py-1.5 font-body text-[0.58rem] uppercase tracking-[0.14em] transition ${
                                        selectedHighlightCategory === category
                                            ? "border border-foreground bg-foreground text-background"
                                            : "border border-border bg-background/75 text-muted-foreground hover:border-foreground hover:text-foreground"
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}

                        {filteredHighlights.length > 0 ? (
                            <CarouselContent className="-ml-4">
                                {filteredHighlights.map((item, index) => {
                                    const highlightPreviewUrl =
                                        getPreviewUrl(item) || item.thumbnailUrl || item.mediaUrl;
                                    const shouldPrioritizePreview = index < 2;
                                    const goalAndStyle = [item.goal, item.style]
                                        .filter((value) => value.length > 0)
                                        .join(" / ");
                                    return (
                                        <CarouselItem
                                            key={item.id}
                                            className="pl-4 basis-[88%] sm:basis-1/2 lg:basis-1/3 2xl:basis-1/4"
                                        >
                                            <motion.button
                                                type="button"
                                                onClick={() => openMedia(item, filteredHighlights)}
                                                className="group flex h-full w-full flex-col overflow-hidden border border-border bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent"
                                                aria-label={`Open highlight details for ${item.title}`}
                                            >
                                                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                                    {canUseInlineVideoPreview(item) ? (
                                                        <video
                                                            src={getVideoPlaybackUrl(item)}
                                                            muted
                                                            loop
                                                            autoPlay
                                                            playsInline
                                                            preload={shouldPrioritizePreview ? "auto" : "metadata"}
                                                            poster={highlightPreviewUrl}
                                                            style={getMediaObjectPosition(item)}
                                                            className="absolute inset-0 h-full w-full object-cover scale-[1.03] transition-transform duration-700 group-hover:scale-[1.08]"
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
                                                            loading={shouldPrioritizePreview ? "eager" : "lazy"}
                                                            decoding="async"
                                                            fetchPriority={shouldPrioritizePreview ? "high" : "auto"}
                                                            {...protectedImageProps}
                                                            style={getMediaObjectPosition(item)}
                                                            className="absolute inset-0 h-full w-full object-cover scale-[1.03] transition-transform duration-700 group-hover:scale-[1.08]"
                                                        />
                                                    )}
                                                    {!canUseInlineVideoPreview(item) && <PhotoProtectionOverlay />}
                                                    <div className="pointer-events-none absolute inset-0 bg-black/24" />
                                                    {item.hook && (
                                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-[linear-gradient(0deg,rgba(8,8,8,0.74)_0%,rgba(8,8,8,0.34)_48%,rgba(8,8,8,0)_100%)]" />
                                                    )}
                                                    {item.track && (
                                                        <span className="absolute left-3 top-3 bg-background/90 px-2 py-1 font-body text-[0.52rem] uppercase tracking-[0.16em] text-foreground">
                                                            {item.track}
                                                        </span>
                                                    )}
                                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                                        {item.hook && (
                                                            <>
                                                                <p className="font-body text-[0.54rem] uppercase tracking-[0.16em] text-primary-foreground/80">
                                                                    Hook
                                                                </p>
                                                                <p className="mt-1 font-display text-xl font-light italic leading-tight text-primary-foreground">
                                                                    {item.hook}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-1 flex-col p-4">
                                                    {item.title && (
                                                        <h4 className="font-display text-2xl font-light leading-tight text-foreground">
                                                            {item.title}
                                                        </h4>
                                                    )}
                                                    {item.description && (
                                                        <p className={`font-body text-sm leading-relaxed text-muted-foreground ${item.title ? "mt-2" : ""}`}>
                                                            {truncateText(stripMarkdownInline(item.description), 170)}
                                                        </p>
                                                    )}
                                                    {goalAndStyle && (
                                                        <p className={`mt-auto font-body text-[0.62rem] uppercase tracking-[0.15em] text-foreground/75 ${item.title || item.description ? "pt-3" : ""}`}>
                                                            {goalAndStyle}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.button>
                                        </CarouselItem>
                                    );
                                })}
                            </CarouselContent>
                        ) : (
                            <p className="rounded-md border border-border bg-background/70 px-4 py-3 font-body text-sm text-muted-foreground">
                                No highlights in the selected category.
                            </p>
                        )}
                    </Carousel>
                )}

                {videos.length > 0 && (
                    <div className="mt-14 overflow-hidden border border-foreground/20 bg-foreground text-primary-foreground">
                        <div className="p-4 sm:p-5 lg:p-6">
                            <Carousel
                                opts={{ align: "start", slidesToScroll: "auto" }}
                                className="w-full"
                            >
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-primary-foreground/70">
                                        Videos
                                    </p>
                                    <h3 className="font-display text-3xl font-light italic text-primary-foreground sm:text-4xl">
                                        Cinematic Story Cuts
                                    </h3>
                                </div>
                                {videos.length > 1 && (
                                    <MobileSwipeHint className="text-primary-foreground/70" />
                                )}
                                <div className="flex items-center gap-2">
                                    <CarouselProgress total={videos.length} variant="dark" />
                                    <CarouselNav variant="dark" />
                                </div>
                            </div>
                                <CarouselContent className="-ml-4">
                                    {videos.map((video, index) => {
                                        const isPortrait = getOrientation(video.width, video.height) === "portrait";
                                        const previewHeight = isPortrait ? 980 : 560;
                                        const shouldPrioritizePreview = index < 2;
                                        const videoPreviewUrl =
                                            getPreviewUrl(video) ||
                                            video.thumbnailUrl ||
                                            video.mediaUrl;
                                        const goalAndStyle = [video.goal, video.style]
                                            .filter((value) => value.length > 0)
                                            .join(" / ");

                                        return (
                                            <CarouselItem
                                                key={video.id}
                                                className="pl-4 basis-[88%] sm:basis-1/2 lg:basis-1/3 2xl:basis-1/4"
                                            >
                                                <motion.button
                                                    type="button"
                                                    onClick={() => openMedia(video, videos)}
                                                    className="group flex h-full w-full flex-col overflow-hidden border border-primary-foreground/20 bg-primary-foreground/[0.06] text-left transition-all duration-300 hover:border-accent"
                                                    aria-label={`Open video story details for ${video.title}`}
                                                >
                                                    <div className="relative aspect-[4/3] overflow-hidden bg-transparent">
                                                        {canUseInlineVideoPreview(video) ? (
                                                            <video
                                                                src={getVideoPlaybackUrl(video)}
                                                                muted
                                                                loop
                                                                autoPlay
                                                                playsInline
                                                                preload={shouldPrioritizePreview ? "auto" : "metadata"}
                                                                poster={videoPreviewUrl}
                                                                style={getMediaObjectPosition(video)}
                                                                className="h-full w-full object-cover scale-[1.03] transition-transform duration-700 group-hover:scale-[1.08]"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={getOptimizedImageUrl(
                                                                    videoPreviewUrl,
                                                                    IMAGE_WIDTHS[1],
                                                                    previewHeight,
                                                                )}
                                                                srcSet={getImageSrcSet(
                                                                    videoPreviewUrl,
                                                                    previewHeight,
                                                                )}
                                                                sizes={getImageSizes(
                                                                    videoPreviewUrl,
                                                                )}
                                                                alt={video.title}
                                                                loading={shouldPrioritizePreview ? "eager" : "lazy"}
                                                                decoding="async"
                                                                fetchPriority={shouldPrioritizePreview ? "high" : "auto"}
                                                                {...protectedImageProps}
                                                                style={getMediaObjectPosition(video)}
                                                                className="h-full w-full object-cover scale-[1.03] transition-transform duration-700 group-hover:scale-[1.08]"
                                                            />
                                                        )}
                                                        {!canUseInlineVideoPreview(video) && <PhotoProtectionOverlay />}
                                                        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:bg-accent group-hover:text-accent-foreground">
                                                            <Play className="h-3.5 w-3.5" />
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-1 flex-col p-3.5">
                                                        {video.hook && (
                                                            <>
                                                                <p className="font-body text-[0.54rem] uppercase tracking-[0.16em] text-primary-foreground/72">
                                                                    Campaign Hook
                                                                </p>
                                                                <h4 className="mt-1 font-display text-2xl font-light leading-tight text-primary-foreground">
                                                                    {video.hook}
                                                                </h4>
                                                            </>
                                                        )}
                                                        {video.description && (
                                                            <p className={`font-body text-xs leading-relaxed text-primary-foreground/78 ${video.hook ? "mt-2" : ""}`}>
                                                                {truncateText(stripMarkdownInline(video.description), 130)}
                                                            </p>
                                                        )}
                                                        {goalAndStyle && (
                                                            <p className={`mt-auto font-body text-[0.58rem] uppercase tracking-[0.14em] text-primary-foreground/70 ${video.hook || video.description ? "pt-2.5" : ""}`}>
                                                                {goalAndStyle}
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            </CarouselItem>
                                        );
                                    })}
                                </CarouselContent>
                            </Carousel>
                        </div>
                    </div>
                )}
            </div>

            <Dialog
                open={Boolean(selectedCollection)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedCollection(null);
                    }
                }}
            >
                <DialogContent className="w-[97vw] max-w-5xl max-h-[90vh] overflow-y-auto p-0">
                    {selectedCollection && (
                        <div className="flex flex-col">
                            <div className="p-5 pt-10 sm:p-8 sm:pt-12">
                                <DialogHeader className="text-left pr-10 md:pr-14">
                                    {selectedCollection.subtitle && (
                                        <p className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                                            {selectedCollection.subtitle}
                                        </p>
                                    )}
                                    {selectedCollection.title && (
                                        <DialogTitle className="break-words font-display text-3xl font-light italic leading-tight text-foreground sm:text-4xl">
                                            {selectedCollection.title}
                                        </DialogTitle>
                                    )}
                                    {selectedCollection.story && (
                                        <p className="mt-1 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                                            {selectedCollection.story}
                                        </p>
                                    )}
                                </DialogHeader>

                                {selectedCollection.highlights.length > 0 && (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {selectedCollection.highlights.map((highlight) => (
                                            <span
                                                key={`${selectedCollection.id}-${highlight}`}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 font-body text-xs text-foreground/85"
                                            >
                                                <span className="h-1 w-1 rounded-full bg-accent" />
                                                {highlight}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border bg-muted/20 p-4 sm:p-6">
                                <div
                                    className={`grid gap-3 ${getCollectionPreviewGridClass(
                                        selectedCollection.entries.length,
                                    )}`}
                                >
                                    {selectedCollection.entries.map((entry, index) => {
                                        const previewUrl =
                                            getPreviewUrl(entry) || entry.thumbnailUrl || entry.mediaUrl;

                                        return (
                                            <button
                                                type="button"
                                                key={entry.id}
                                                onClick={() => openCollectionEntry(entry)}
                                                onContextMenu={(event) => event.preventDefault()}
                                                aria-label={`Open asset details for ${entry.title || "collection asset"}`}
                                                className={`group/entry relative overflow-hidden bg-background ${getCollectionPreviewAspectClass(
                                                    selectedCollection.entries.length,
                                                )}`}
                                            >
                                                {canUseInlineVideoPreview(entry) ? (
                                                    <video
                                                        src={getVideoPlaybackUrl(entry)}
                                                        muted
                                                        loop
                                                        autoPlay
                                                        playsInline
                                                        preload="metadata"
                                                        style={getMediaObjectPosition(entry)}
                                                        className="absolute inset-0 h-full w-full object-cover scale-[1.03] transition-transform duration-700 group-hover/entry:scale-[1.08]"
                                                    />
                                                ) : (
                                                    <img
                                                        src={getOptimizedImageUrl(
                                                            previewUrl,
                                                            IMAGE_WIDTHS[1],
                                                        )}
                                                        srcSet={getImageSrcSet(
                                                            previewUrl,
                                                        )}
                                                        sizes={getImageSizes(
                                                            previewUrl,
                                                        )}
                                                        alt={entry.title}
                                                        loading="lazy"
                                                        decoding="async"
                                                        {...protectedImageProps}
                                                        style={getMediaObjectPosition(entry)}
                                                        className="absolute inset-0 h-full w-full object-cover scale-[1.03] transition-transform duration-700 group-hover/entry:scale-[1.08]"
                                                    />
                                                )}
                                                {!canUseInlineVideoPreview(entry) && <PhotoProtectionOverlay />}
                                                <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/entry:bg-black/10" />

                                                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover/entry:opacity-100">
                                                    {entry.title && (
                                                        <p className="font-body text-xs text-white drop-shadow-sm">{entry.title}</p>
                                                    )}
                                                </div>

                                                <span className="absolute left-2 top-2 z-[2] grid h-6 w-6 place-items-center rounded-full bg-white/80 font-body text-[0.56rem] font-medium text-foreground backdrop-blur-sm">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>

                                                {isVideoMedia(entry) && (
                                                    <span className="absolute right-2 top-2 z-[2] grid h-6 w-6 place-items-center rounded-full bg-white/80 backdrop-blur-sm">
                                                        <Play className="h-2.5 w-2.5 text-foreground" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
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
                        setMediaSequence([]);
                        setMediaSequenceIndex(-1);
                        setShowMobileMediaDetails(false);
                    }
                }}
            >
                <DialogContent
                    className={`left-2 top-2 h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none translate-x-0 translate-y-0 overflow-y-auto p-0 sm:rounded-lg md:left-[50%] md:top-[50%] md:h-auto md:w-auto md:max-h-[86vh] md:overflow-hidden md:translate-x-[-50%] md:translate-y-[-50%] ${mediaDialogSizeClass}`}
                >
                    {selectedMedia && (
                        <div className="min-h-full md:min-h-0 md:grid md:max-h-[86vh] md:grid-cols-[minmax(0,1fr)_380px] md:items-start">
                            <div
                                className={`flex w-full flex-col bg-background p-3 md:h-auto md:min-h-0 md:items-stretch md:overflow-auto md:p-1.5 ${
                                    isMobileLandscapeMedia
                                        ? "items-start"
                                        : "min-h-[calc(100dvh-6rem)] items-stretch"
                                }`}
                            >
                                {canStepMedia && (
                                    <div className="mx-auto mb-2 flex w-44 max-w-[calc(100%-3.5rem)] items-center justify-between gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
                                        <button
                                            type="button"
                                            onClick={goToPrevMedia}
                                            disabled={!canStepMediaPrev}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground disabled:opacity-40"
                                            aria-label="Previous media"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </button>
                                        <p className="font-body text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                                            {mediaSequenceIndex + 1} / {mediaSequence.length}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={goToNextMedia}
                                            disabled={!canStepMediaNext}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground disabled:opacity-40"
                                            aria-label="Next media"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                <div
                                    className={`flex w-full justify-center ${
                                        isMobileLandscapeMedia ? "items-start" : "flex-1 items-center"
                                    }`}
                                >
                                <div
                                    className={`inline-flex max-w-[calc(100vw-1rem)] flex-col items-stretch ${
                                        isMobileLandscapeMedia ? "w-full" : "w-fit"
                                    }`}
                                >
                                    {isVideoAsset(getVideoPlaybackUrl(selectedMedia), selectedMedia.mime) ? (
                                        <div className="relative">
                                            {!mediaLoaded && (
                                                <div className="flex min-h-[200px] items-center justify-center md:min-h-[300px]">
                                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                                                </div>
                                            )}
                                            <video
                                                src={getVideoPlaybackUrl(selectedMedia)}
                                                controls
                                                autoPlay
                                                playsInline
                                                className={`mx-auto block h-auto w-auto max-h-[calc(100dvh-5.5rem)] max-w-full object-contain md:max-h-[78vh] ${mediaLoaded ? "" : "invisible absolute"}`}
                                                onLoadedMetadata={(event) => {
                                                    const media = event.currentTarget;
                                                    setNaturalDimensions({
                                                        width: media.videoWidth,
                                                        height: media.videoHeight,
                                                    });
                                                    setMediaLoaded(true);
                                                }}
                                            />
                                        </div>
                                    ) : isVideoMedia(selectedMedia) && isBunnyVideo(selectedMedia) ? (
                                        <div
                                            className={`relative mx-auto overflow-hidden bg-black ${selectedMediaAspectRatio < 1 ? "inline-block h-[calc(100dvh-5.5rem)] max-w-full md:h-[78vh]" : "w-full max-h-[calc(100dvh-5.5rem)] md:max-w-5xl md:max-h-[78vh]"}`}
                                            style={{ aspectRatio: selectedMediaAspectRatio }}
                                        >
                                            {!mediaLoaded && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                                                </div>
                                            )}
                                            <iframe
                                                src={selectedMedia.embedUrl}
                                                title={selectedMedia.title}
                                                loading="lazy"
                                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                                allowFullScreen
                                                className="absolute inset-0 h-full w-full border-0"
                                                onLoad={() => setMediaLoaded(true)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative inline-block max-w-full">
                                            {!mediaLoaded && (
                                                <div className="flex min-h-[200px] items-center justify-center md:min-h-[300px]">
                                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                                                </div>
                                            )}
                                            <img
                                                src={getOptimizedImageUrl(
                                                    getPreviewUrl(selectedMedia) ||
                                                        selectedMedia.thumbnailUrl ||
                                                        selectedMedia.mediaUrl,
                                                    2400,
                                                )}
                                                alt={selectedMedia.title}
                                                {...protectedImageProps}
                                                className={`mx-auto block h-auto w-auto max-h-[calc(100dvh-5.5rem)] max-w-full object-contain md:max-h-[78vh] ${mediaLoaded ? "" : "invisible absolute"}`}
                                                onLoad={(event) => {
                                                    const media = event.currentTarget;
                                                    setNaturalDimensions({
                                                        width: media.naturalWidth,
                                                        height: media.naturalHeight,
                                                    });
                                                    setMediaLoaded(true);
                                                }}
                                            />
                                            {mediaLoaded && <PhotoProtectionOverlay />}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileMediaDetails((current) => !current)}
                                        aria-label={showMobileMediaDetails ? "Hide details" : "Show details"}
                                        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-foreground md:hidden"
                                    >
                                        {showMobileMediaDetails ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        <span className="font-body text-xs uppercase tracking-[0.14em]">
                                            {showMobileMediaDetails ? "Hide Details" : "Show Details"}
                                        </span>
                                    </button>

                                    {showMobileMediaDetails && (
                                        <div className="mt-3 pb-6 md:hidden">
                                            <div className="space-y-2.5 border-t border-border pt-3">
                                                <p className="font-display text-xl font-light italic leading-tight text-foreground">
                                                    {selectedMedia.title}
                                                </p>

                                                {selectedMedia.description && (
                                                    <div className="font-body text-sm leading-relaxed text-muted-foreground">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                            {selectedMedia.description}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}

                                                {selectedMedia.hook && (
                                                    <>
                                                        <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                            Hook
                                                        </p>
                                                        <p className="font-display text-base italic leading-tight text-foreground">
                                                            {selectedMedia.hook}
                                                        </p>
                                                    </>
                                                )}

                                                {selectedMedia.goal && (
                                                    <>
                                                        <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                            Goal
                                                        </p>
                                                        <p className="font-body text-sm text-foreground">{selectedMedia.goal}</p>
                                                    </>
                                                )}

                                                {selectedMedia.style && (
                                                    <>
                                                        <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                            Style
                                                        </p>
                                                        <p className="font-body text-sm text-foreground">{selectedMedia.style}</p>
                                                    </>
                                                )}

                                                <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                    Format
                                                </p>
                                                <p className="font-body text-sm text-foreground">
                                                    {isVideoMedia(selectedMedia) ? "Video" : "Photo"}
                                                </p>

                                                {(naturalDimensions ||
                                                    (selectedMedia.width && selectedMedia.height)) && (
                                                    <>
                                                        <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                            Resolution
                                                        </p>
                                                        <p className="font-body text-sm text-foreground">
                                                            {naturalDimensions
                                                                ? `${naturalDimensions.width} x ${naturalDimensions.height}px`
                                                                : `${selectedMedia.width} x ${selectedMedia.height}px`}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>

                            <div className="hidden overflow-auto border-t border-border bg-background p-4 pt-12 md:block md:max-h-[78vh] md:border-l md:border-t-0 md:p-5 md:pt-14">
                                <DialogHeader className="text-left pr-12 md:pr-14">
                                    <DialogTitle className="break-words font-display text-2xl font-light italic leading-tight text-foreground">
                                        {selectedMedia.title}
                                    </DialogTitle>
                                    {selectedMedia.description && (
                                        <div className="font-body text-sm leading-relaxed text-muted-foreground">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {selectedMedia.description}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </DialogHeader>

                                <div className="mt-4 space-y-2.5 border-t border-border pt-3">
                                    {selectedMedia.hook && (
                                        <>
                                            <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                Hook
                                            </p>
                                            <p className="font-display text-lg italic leading-tight text-foreground">
                                                {selectedMedia.hook}
                                            </p>
                                        </>
                                    )}

                                    {selectedMedia.goal && (
                                        <>
                                            <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                Goal
                                            </p>
                                            <p className="font-body text-sm text-foreground">{selectedMedia.goal}</p>
                                        </>
                                    )}

                                    {selectedMedia.style && (
                                        <>
                                            <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                Style
                                            </p>
                                            <p className="font-body text-sm text-foreground">{selectedMedia.style}</p>
                                        </>
                                    )}

                                    {selectedMedia.track && (
                                        <>
                                            <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                Track
                                            </p>
                                            <p className="font-body text-sm text-foreground">{selectedMedia.track}</p>
                                        </>
                                    )}

                                    {selectedMedia.categories.length > 0 && (
                                        <>
                                            <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                Categories
                                            </p>
                                            <p className="font-body text-sm text-foreground">
                                                {selectedMedia.categories.join(" / ")}
                                            </p>
                                        </>
                                    )}

                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        Format
                                    </p>
                                    <p className="font-body text-sm text-foreground">
                                        {isVideoMedia(selectedMedia) ? "Video" : "Photo"}
                                    </p>

                                    {(naturalDimensions ||
                                        (selectedMedia.width && selectedMedia.height)) && (
                                        <>
                                            <p className="font-body text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                Resolution
                                            </p>
                                            <p className="font-body text-sm text-foreground">
                                                {naturalDimensions
                                                    ? `${naturalDimensions.width} x ${naturalDimensions.height}px`
                                                    : `${selectedMedia.width} x ${selectedMedia.height}px`}
                                            </p>
                                        </>
                                    )}
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
