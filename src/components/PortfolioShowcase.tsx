import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, Clapperboard, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

function CollaborationBadge({
    className,
    variant = "light",
}: {
    className?: string;
    variant?: "light" | "dark";
}) {
    const tone =
        variant === "light"
            ? "bg-accent text-accent-foreground"
            : "bg-accent text-accent-foreground";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[0.52rem] uppercase tracking-[0.15em] shadow-sm backdrop-blur-sm",
                tone,
                className,
            )}
            title="Real client collaboration — paid stay, paid project, or unpaid shoot with a published client review"
        >
            <BadgeCheck className="h-3 w-3" strokeWidth={2} />
            Collaboration
        </span>
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
    isCollaboration: boolean;
    focalPointX?: number;
    focalPointY?: number;
    width?: number;
    height?: number;
};

type StoryCollection = {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    story: string;
    highlights: string[];
    entries: StoryMedia[];
    track: string;
    isCollaboration: boolean;
    client: string;
    clientLogo: string;
    location: string;
    deliverables: string;
    testimonial: { name: string; role: string; quote: string } | null;
};

type Orientation = "portrait" | "landscape" | "square";

const IMAGE_WIDTHS = [640, 960, 1280];
/** Photo category sections shown first, in this order; anything else follows, uncategorized last. */
const PHOTO_SECTION_ORDER = [
    "Highlights",
    "Hotels & Resorts",
    "Hotels & Restaurants",
    "Hotels",
    "Restaurants",
    "Travel",
    "Experiences",
    "Lifestyle",
    "Food",
    "Nature",
];
const PHOTO_UNCATEGORIZED = "More Frames";

const photoSectionRank = (category: string): number => {
    const index = PHOTO_SECTION_ORDER.findIndex((entry) => entry.toLowerCase() === category.toLowerCase());
    return index === -1 ? PHOTO_SECTION_ORDER.length : index;
};

const choosePhotoCategory = (categories: string[]): string => {
    const cleaned = categories.map((value) => value.trim()).filter((value) => value.length > 0);
    if (cleaned.length === 0) {
        return PHOTO_UNCATEGORIZED;
    }

    let best: string | null = null;
    let bestRank = Infinity;
    for (const category of cleaned) {
        const rank = photoSectionRank(category);
        if (rank < PHOTO_SECTION_ORDER.length && rank < bestRank) {
            bestRank = rank;
            best = category;
        }
    }

    return best ?? cleaned[0];
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
        isCollaboration: entry.isCollaboration === true,
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
    const description = trimOrEmpty(collection.description);
    const story = trimOrEmpty(collection.story);
    const track = entries[0]?.track ?? resolveStoryTrack([], title, story, "", "");
    const insights = collection.insights.map((item) => item.trim()).filter((item) => item.length > 0);

    return {
        id: collection.id.trim() || `${slugify(title || "collection")}-${index + 1}`,
        title,
        subtitle: `${entries.length} ${entries.length === 1 ? "asset" : "assets"} in this collection`,
        description,
        story,
        highlights: insights,
        entries,
        track,
        isCollaboration: collection.isCollaboration === true,
        client: collection.client.trim(),
        clientLogo: collection.clientLogo.trim(),
        location: collection.location.trim(),
        deliverables: collection.deliverables.trim(),
        testimonial: collection.testimonial,
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
                subtitle: `${entries.length} ${entries.length === 1 ? "asset" : "assets"} in this collection`,
                description: "",
                story,
                highlights: [],
                entries,
                track,
                isCollaboration: entries.some((entry) => entry.isCollaboration),
                client: "",
                clientLogo: "",
                location: "",
                deliverables: "",
                testimonial: null,
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
    const [selectedMedia, setSelectedMedia] = useState<StoryMedia | null>(null);
    const [mediaSequence, setMediaSequence] = useState<StoryMedia[]>([]);
    const [mediaSequenceIndex, setMediaSequenceIndex] = useState(-1);
    const [collectionApi, setCollectionApi] = useState<CarouselApi>();
    const [currentCollectionSlide, setCurrentCollectionSlide] = useState(1);
    const [activePhotoCategory, setActivePhotoCategory] = useState("");
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

    const photoSections = useMemo<Array<[string, StoryMedia[]]>>(() => {
        const groups = new Map<string, StoryMedia[]>();
        for (const item of highlights) {
            const category = choosePhotoCategory(item.categories);
            const current = groups.get(category) ?? [];
            current.push(item);
            groups.set(category, current);
        }

        return Array.from(groups.entries()).sort(([a], [b]) => {
            if (a === PHOTO_UNCATEGORIZED) return 1;
            if (b === PHOTO_UNCATEGORIZED) return -1;
            const rankDiff = photoSectionRank(a) - photoSectionRank(b);
            return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
        });
    }, [highlights]);

    const hasCollections = collections.length > 0;
    const hasHighlights = highlights.length > 0;
    const activePhotoSection = photoSections.find(([category]) => category === activePhotoCategory) ?? photoSections[0];
    const activePhotos = activePhotoSection?.[1] ?? [];
    const activeHorizontalPhotos = activePhotos.filter((item) => item.width && item.height && item.width > item.height);
    const activeVerticalPhotos = activePhotos.filter((item) => !item.width || !item.height || item.width <= item.height);
    const activeCollectionIndex = collections.length > 0
        ? Math.min(Math.max(currentCollectionSlide - 1, 0), collections.length - 1)
        : -1;
    const activeCollection = activeCollectionIndex >= 0 ? collections[activeCollectionIndex] : null;

    useEffect(() => {
        setNaturalDimensions(null);
        setShowMobileMediaDetails(false);
        setMediaLoaded(false);
    }, [selectedMedia?.id]);

    useEffect(() => {
        if (photoSections.length === 0) {
            if (activePhotoCategory) {
                setActivePhotoCategory("");
            }
            return;
        }

        if (!photoSections.some(([category]) => category === activePhotoCategory)) {
            setActivePhotoCategory(photoSections[0][0]);
        }
    }, [activePhotoCategory, photoSections]);

    useEffect(() => {
        if (!collectionApi) {
            return;
        }

        const onSelect = () => {
            setCurrentCollectionSlide(collectionApi.selectedScrollSnap() + 1);
        };

        onSelect();
        collectionApi.on("select", onSelect);
        collectionApi.on("reInit", onSelect);

        return () => {
            collectionApi.off("select", onSelect);
            collectionApi.off("reInit", onSelect);
        };
    }, [collectionApi]);

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
        <section id="portfolio" className="relative overflow-hidden bg-background py-10 lg:py-12">
            <div className="container relative mx-auto px-6 lg:px-10">
                {!hasCollections && (sectionName || sectionTitle || sectionText) && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.75 }}
                        className="mx-auto mb-9 max-w-3xl text-center"
                    >
                        {sectionName && (
                            <p className="mb-3 font-body text-sm uppercase tracking-[0.22em] text-muted-foreground">
                                {sectionName}
                            </p>
                        )}
                        {sectionTitle && (
                            <h2 className="font-display text-3xl font-light italic leading-[1.08] text-foreground sm:text-4xl lg:text-5xl">
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
                    <div id="collections" className="w-full scroll-mt-24">
                        <div className="mb-6 flex items-end justify-between gap-4">
                            <h3 className="font-display text-2xl font-light italic text-foreground sm:text-3xl">
                                Case Studies
                            </h3>
                            <p className="hidden font-body text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground sm:block">
                                Client work
                            </p>
                        </div>

                        <Carousel
                            setApi={setCollectionApi}
                            opts={{ align: "start", loop: collections.length > 1 }}
                            className="w-full"
                        >
                            {collections.length > 1 && (
                                <div className="mb-5 flex items-center gap-3">
                                    <p className="inline-flex items-center gap-2 font-body text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Swipe for more
                                    </p>
                                    <p className="rounded-full border border-border bg-background px-3 py-1 font-body text-[0.65rem] text-muted-foreground shadow-sm">
                                        {currentCollectionSlide} / {collections.length}
                                    </p>
                                    <div className="ml-auto flex items-center gap-3">
                                        <CarouselPrevious className="!static !left-auto !top-auto !h-10 !w-10 !translate-y-0 rounded-full border-accent/70 bg-background text-foreground" />
                                        <CarouselNext className="!static !right-auto !top-auto !h-10 !w-10 !translate-y-0 rounded-full border-accent/70 bg-background text-foreground" />
                                    </div>
                                </div>
                            )}
                            <CarouselContent className="-ml-4 items-stretch">
                                {collections.map((collection, index) => {
                                    const coverEntry = collection.entries[0];
                                    const coverPreviewUrl = getPreviewUrl(coverEntry) || coverEntry.thumbnailUrl || coverEntry.mediaUrl;
                                    const isActive = index === activeCollectionIndex;

                                    return (
                                        <CarouselItem
                                            key={collection.id}
                                            className="flex basis-[94%] pl-4 sm:basis-[82%] md:basis-[70%] lg:basis-[48%]"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => collectionApi?.scrollTo(index)}
                                                className={cn(
                                                    "group relative flex h-full min-h-[26rem] w-full flex-col overflow-hidden border bg-muted text-left transition-opacity lg:min-h-[24rem]",
                                                    isActive ? "border-accent/70 opacity-100" : "border-border opacity-80",
                                                )}
                                            >
                                                {canUseInlineVideoPreview(coverEntry) ? (
                                                    <video
                                                        src={getVideoPlaybackUrl(coverEntry)}
                                                        muted
                                                        loop
                                                        autoPlay
                                                        playsInline
                                                        preload="metadata"
                                                        poster={coverPreviewUrl}
                                                        style={getMediaObjectPosition(coverEntry)}
                                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
                                                    />
                                                ) : (
                                                    <img
                                                        src={getOptimizedImageUrl(coverPreviewUrl, IMAGE_WIDTHS[1])}
                                                        alt={coverEntry.title}
                                                        loading="lazy"
                                                        decoding="async"
                                                        {...protectedImageProps}
                                                        style={getMediaObjectPosition(coverEntry)}
                                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
                                                    />
                                                )}
                                                {!canUseInlineVideoPreview(coverEntry) && <PhotoProtectionOverlay />}

                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                                                <div className="absolute right-4 top-4 z-[2] flex flex-col items-end gap-2">
                                                    {collection.isCollaboration && <CollaborationBadge />}
                                                    <span className="rounded-full bg-white/92 px-4 py-2 font-body text-[0.62rem] uppercase tracking-[0.18em] text-foreground shadow-sm backdrop-blur-sm">
                                                        {collection.entries.length} assets
                                                    </span>
                                                </div>

                                                {isVideoMedia(coverEntry) && (
                                                    <span className="absolute left-4 top-4 z-[2] inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 font-body text-[0.56rem] uppercase tracking-[0.14em] text-foreground backdrop-blur-sm">
                                                        <Clapperboard className="h-3 w-3 text-accent" />
                                                        Video
                                                    </span>
                                                )}

                                                <div className="relative z-[2] mt-auto p-5 sm:p-6">
                                                    <p className="mb-2 font-body text-[0.58rem] uppercase tracking-[0.2em] text-white/75">
                                                        Case Study {String(index + 1).padStart(2, "0")}
                                                    </p>
                                                    <h4 className="font-display text-3xl font-light italic leading-[1.08] text-white sm:text-4xl">
                                                        {collection.client || collection.title}
                                                    </h4>
                                                    {(collection.location || collection.track) && (
                                                        <p className="mt-3 font-body text-[0.62rem] uppercase tracking-[0.18em] text-white/75">
                                                            {collection.location || collection.track}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        </CarouselItem>
                                    );
                                })}
                            </CarouselContent>
                        </Carousel>

                        {activeCollection && (
                            <article className="mt-8 border-t border-border pt-7 lg:grid lg:grid-cols-[minmax(18rem,0.34fr)_minmax(0,0.66fr)] lg:gap-10">
                                <div className="space-y-5">
                                    <div>
                                        <p className="font-body text-[0.62rem] uppercase tracking-[0.24em] text-accent">
                                            Selected collection
                                        </p>
                                        <h4 className="mt-2 font-display text-3xl font-light italic leading-[1.05] text-foreground sm:text-4xl">
                                            {activeCollection.client || activeCollection.title}
                                        </h4>
                                    </div>

                                    {(activeCollection.location || activeCollection.track) && (
                                        <p className="font-body text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                                            {activeCollection.location || activeCollection.track}
                                        </p>
                                    )}

                                    {activeCollection.description && (
                                        <p className="font-body text-sm leading-relaxed text-muted-foreground">
                                            {activeCollection.description}
                                        </p>
                                    )}

                                    {activeCollection.story && (
                                        <p className="font-body text-sm leading-relaxed text-muted-foreground">
                                            {activeCollection.story}
                                        </p>
                                    )}

                                    <dl className="grid grid-cols-2 gap-4 border-y border-border py-3">
                                        <div>
                                            <dt className="font-body text-[0.56rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                Assets
                                            </dt>
                                            <dd className="mt-1 font-body text-sm text-foreground">
                                                {activeCollection.entries.length}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-body text-[0.56rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                Deliverables
                                            </dt>
                                            <dd className="mt-1 font-body text-xs leading-snug text-foreground/80">
                                                {activeCollection.deliverables
                                                    ? activeCollection.deliverables
                                                    : `${activeCollection.entries.length} ${activeCollection.entries.length === 1 ? "asset" : "assets"} - photo & video`}
                                            </dd>
                                        </div>
                                    </dl>

                                    {activeCollection.testimonial && (
                                        <figure>
                                            <div className="flex items-center gap-4">
                                                {activeCollection.clientLogo && (
                                                    <img
                                                        src={activeCollection.clientLogo}
                                                        alt={activeCollection.testimonial.name || activeCollection.client || "Feedback source"}
                                                        loading="lazy"
                                                        {...protectedImageProps}
                                                        className="h-24 w-24 shrink-0 rounded-full border border-border bg-white object-cover shadow-sm sm:h-28 sm:w-28"
                                                    />
                                                )}
                                                <div className="min-w-0">
                                                    {(activeCollection.client || activeCollection.title) && (
                                                        <p className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-accent">
                                                            {activeCollection.client || activeCollection.title}
                                                        </p>
                                                    )}
                                                    {(activeCollection.testimonial.name || activeCollection.testimonial.role) && (
                                                        <figcaption className="mt-2 font-body text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                            {activeCollection.testimonial.name}
                                                            {activeCollection.testimonial.name && activeCollection.testimonial.role ? " / " : ""}
                                                            {activeCollection.testimonial.role}
                                                        </figcaption>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-4 border-l border-accent pl-4">
                                                <blockquote className="font-display text-lg font-light italic leading-snug text-foreground/88">
                                                    {activeCollection.testimonial.quote}
                                                </blockquote>
                                            </div>
                                        </figure>
                                    )}

                                    {!activeCollection.testimonial && activeCollection.clientLogo && (
                                        <div className="flex items-center gap-3 border-y border-border py-3">
                                            <img
                                                src={activeCollection.clientLogo}
                                                alt={activeCollection.client || "Client logo"}
                                                loading="lazy"
                                                {...protectedImageProps}
                                                className="h-16 w-16 shrink-0 rounded-full border border-border bg-white object-cover"
                                            />
                                            {(activeCollection.client || activeCollection.title) && (
                                                <p className="font-body text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                    {activeCollection.client || activeCollection.title}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {activeCollection.highlights.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeCollection.highlights.map((highlight) => (
                                                <span
                                                    key={`${activeCollection.id}-${highlight}`}
                                                    className="border border-border px-2.5 py-1 font-body text-[0.6rem] uppercase tracking-[0.12em] text-foreground/80"
                                                >
                                                    {highlight}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-7 grid grid-cols-2 gap-2 sm:gap-3 lg:mt-0 lg:grid-cols-4">
                                    {activeCollection.entries.map((entry, entryIndex) => {
                                        const previewUrl = getPreviewUrl(entry) || entry.thumbnailUrl || entry.mediaUrl;
                                        const isFeature = entryIndex === 0;
                                        const tileClassName = isFeature
                                                ? "col-span-2 row-span-2 aspect-[4/3] lg:aspect-auto"
                                                : "aspect-[4/5]";

                                        const mediaPreview = canUseInlineVideoPreview(entry) ? (
                                            <video
                                                src={getVideoPlaybackUrl(entry)}
                                                muted
                                                loop
                                                autoPlay
                                                playsInline
                                                preload="metadata"
                                                poster={previewUrl}
                                                style={getMediaObjectPosition(entry)}
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={getOptimizedImageUrl(previewUrl, isFeature ? IMAGE_WIDTHS[1] : IMAGE_WIDTHS[0])}
                                                alt={entry.title}
                                                loading="lazy"
                                                decoding="async"
                                                {...protectedImageProps}
                                                style={getMediaObjectPosition(entry)}
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                        );

                                        const mediaTile = (
                                            <>
                                                {mediaPreview}
                                                {!canUseInlineVideoPreview(entry) && <PhotoProtectionOverlay />}
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                                                {isVideoMedia(entry) && (
                                                    <span className="absolute left-2 top-2 z-[2] inline-flex items-center gap-1 bg-white/90 px-2 py-1 font-body text-[0.54rem] uppercase tracking-[0.12em] text-foreground backdrop-blur-sm">
                                                        <Clapperboard className="h-3 w-3 text-accent" />
                                                        Video
                                                    </span>
                                                )}
                                            </>
                                        );

                                        return isVideoMedia(entry) ? (
                                            <button
                                                key={entry.id}
                                                type="button"
                                                onClick={() => openMedia(entry, activeCollection.entries.filter((item) => isVideoMedia(item)))}
                                                className={cn("group/media relative overflow-hidden bg-muted text-left", tileClassName)}
                                                aria-label={`Play ${entry.title || activeCollection.title || "collection video"}`}
                                            >
                                                {mediaTile}
                                            </button>
                                        ) : (
                                            <figure
                                                key={entry.id}
                                                className={cn("group/media relative overflow-hidden bg-muted text-left", tileClassName)}
                                            >
                                                {mediaTile}
                                            </figure>
                                        );
                                    })}
                                </div>
                            </article>
                        )}

                    </div>
                )}

                {hasCollections && hasHighlights && (
                    <div className="my-10 h-px w-full bg-border/80" />
                )}

                {hasHighlights && (
                    <div id="photos" className="w-full scroll-mt-24">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h3 className="font-display text-2xl font-light italic text-foreground sm:text-3xl">
                                    Photography
                                </h3>
                            </div>
                            <p className="inline-flex items-center gap-1.5 font-body text-[0.56rem] uppercase tracking-[0.16em] text-muted-foreground">
                                <Lock className="h-3 w-3" />
                                View-only gallery
                            </p>
                        </div>

                        <div className="-mx-6 mb-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex min-w-max items-center gap-2">
                                {photoSections.map(([category, photos]) => {
                                    const isActive = category === activePhotoSection?.[0];

                                    return (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setActivePhotoCategory(category)}
                                            className={cn(
                                                "inline-flex items-center gap-2 border px-3.5 py-2 font-body text-[0.62rem] uppercase tracking-[0.16em] transition-colors",
                                                isActive
                                                    ? "border-foreground bg-foreground text-background"
                                                    : "border-border bg-background text-muted-foreground hover:border-accent hover:text-foreground",
                                            )}
                                        >
                                            {category}
                                            <span className={cn("text-[0.56rem]", isActive ? "text-background/70" : "text-muted-foreground")}>
                                                {photos.length}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {activePhotoSection && (
                            <div>
                                <div className="mb-4 flex items-center gap-4">
                                    <h4 className="font-body text-xs font-medium uppercase tracking-[0.24em] text-foreground">
                                        {activePhotoSection[0]}
                                    </h4>
                                    <span className="h-px flex-1 bg-border" />
                                    <span className="font-body text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
                                        {activePhotos.length} {activePhotos.length === 1 ? "frame" : "frames"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6 xl:grid-cols-7">
                                    {activeVerticalPhotos.map((item) => {
                                        const photoPreviewUrl = getPreviewUrl(item) || item.thumbnailUrl || item.mediaUrl;

                                        return (
                                            <figure
                                                key={item.id}
                                                onContextMenu={(event) => event.preventDefault()}
                                                className="group relative aspect-[3/4] select-none overflow-hidden bg-muted"
                                            >
                                                {canUseInlineVideoPreview(item) ? (
                                                    <video
                                                        src={getVideoPlaybackUrl(item)}
                                                        muted
                                                        loop
                                                        autoPlay
                                                        playsInline
                                                        preload="metadata"
                                                        poster={photoPreviewUrl}
                                                        style={getMediaObjectPosition(item)}
                                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                                    />
                                                ) : (
                                                    <img
                                                        src={getOptimizedImageUrl(
                                                            photoPreviewUrl,
                                                            320,
                                                            420,
                                                        )}
                                                        alt={item.title}
                                                        loading="lazy"
                                                        decoding="async"
                                                        {...protectedImageProps}
                                                        style={getMediaObjectPosition(item)}
                                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                                    />
                                                )}
                                                {!canUseInlineVideoPreview(item) && <PhotoProtectionOverlay />}
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
                                                {item.isCollaboration && (
                                                    <CollaborationBadge variant="light" className="absolute left-1.5 top-1.5 z-[2]" />
                                                )}
                                            </figure>
                                        );
                                    })}
                                </div>

                                {activeHorizontalPhotos.length > 0 && (
                                    <div className="mt-8">
                                        <div className="mb-4 flex items-center gap-4">
                                            <h4 className="font-body text-xs font-medium uppercase tracking-[0.22em] text-foreground">
                                                Horizontal Frames
                                            </h4>
                                            <span className="h-px flex-1 bg-border" />
                                            <span className="font-body text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
                                                {activeHorizontalPhotos.length} {activeHorizontalPhotos.length === 1 ? "frame" : "frames"}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                                            {activeHorizontalPhotos.map((item) => {
                                                const photoPreviewUrl = getPreviewUrl(item) || item.thumbnailUrl || item.mediaUrl;

                                                return (
                                                    <figure
                                                        key={item.id}
                                                        onContextMenu={(event) => event.preventDefault()}
                                                        className="group relative aspect-[4/3] select-none overflow-hidden bg-muted"
                                                    >
                                                        {canUseInlineVideoPreview(item) ? (
                                                            <video
                                                                src={getVideoPlaybackUrl(item)}
                                                                muted
                                                                loop
                                                                autoPlay
                                                                playsInline
                                                                preload="metadata"
                                                                poster={photoPreviewUrl}
                                                                style={getMediaObjectPosition(item)}
                                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={getOptimizedImageUrl(photoPreviewUrl, 420, 320)}
                                                                alt={item.title}
                                                                loading="lazy"
                                                                decoding="async"
                                                                {...protectedImageProps}
                                                                style={getMediaObjectPosition(item)}
                                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                                            />
                                                        )}
                                                        {!canUseInlineVideoPreview(item) && <PhotoProtectionOverlay />}
                                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
                                                        {item.isCollaboration && (
                                                            <CollaborationBadge variant="light" className="absolute left-1.5 top-1.5 z-[2]" />
                                                        )}
                                                    </figure>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>

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
                                    <div className="mb-2 flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-2 py-1.5 pr-14 md:pr-2">
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
