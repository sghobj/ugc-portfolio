import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, Eye, EyeOff, Play, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { UgcWorkContent } from "@/hooks/useUgcContent";
import { PhotoProtectionOverlay, protectedImageProps } from "@/components/PhotoProtection";

type CinematicVideoSectionProps = {
    myWork?: UgcWorkContent;
};

type VideoOrientation = "portrait" | "landscape";

type VideoShowcaseItem = {
    id: string;
    title: string;
    hook: string;
    description: string;
    imageUrl: string;
    mediaUrl: string;
    embedUrl: string;
    mime: string;
    orientation: VideoOrientation;
    goal: string;
    style: string;
};

const isVideoAsset = (url: string, mime = ""): boolean => {
    if (mime.toLowerCase().startsWith("video/")) {
        return true;
    }

    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
};

const getHighQualityImageUrl = (url: string): string => {
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname.includes("images.unsplash.com")) {
            const requestedWidth = Number(parsedUrl.searchParams.get("w") ?? "0");

            if (!Number.isFinite(requestedWidth) || requestedWidth < 2400) {
                parsedUrl.searchParams.set("w", "2400");
            }

            parsedUrl.searchParams.set("q", "100");
            parsedUrl.searchParams.set("fit", "max");
        }

        return parsedUrl.toString();
    } catch {
        return url;
    }
};

const detectOrientation = (
    width: number | undefined,
    height: number | undefined,
    tags: string[],
    index: number,
): VideoOrientation => {
    if (width && height && width > 0 && height > 0) {
        return width >= height ? "landscape" : "portrait";
    }

    const normalizedTags = tags.map((tag) => tag.toLowerCase());

    if (normalizedTags.some((tag) => tag.includes("9:16") || tag.includes("portrait") || tag.includes("vertical"))) {
        return "portrait";
    }

    if (normalizedTags.some((tag) => tag.includes("16:9") || tag.includes("landscape") || tag.includes("horizontal"))) {
        return "landscape";
    }

    return index % 2 === 0 ? "landscape" : "portrait";
};

const CinematicVideoSection = ({ myWork }: CinematicVideoSectionProps) => {
    const [selectedVideo, setSelectedVideo] = useState<VideoShowcaseItem | null>(null);
    const [mediaDimensions, setMediaDimensions] = useState<{ width: number; height: number } | null>(null);
    const [showMobileVideoDetails, setShowMobileVideoDetails] = useState(false);

    const videoShowcase = useMemo<VideoShowcaseItem[]>(() => {
        return (myWork?.media ?? [])
            .filter((item) => {
                if (item.kind === "video") {
                    return true;
                }

                if (item.kind === "photo") {
                    return false;
                }

                return item.mime.toLowerCase().startsWith("video/");
            })
            .slice(0, 3)
            .map((item, index) => {
                const title = item.title.trim();
                const goal = item.goal.trim();
                const hook = item.hook.trim();
                const style = item.style.trim();
                const description = item.description.trim();
                const playbackUrl = item.playbackUrl.trim() || item.sourceUrl.trim();
                const imageUrl =
                    item.thumbnailUrl.trim() ||
                    item.imageUrl.trim() ||
                    playbackUrl;
                const mediaUrl = playbackUrl || imageUrl;
                const embedUrl = item.embedUrl.trim();

                return {
                    id: item.id,
                    title,
                    hook,
                    description,
                    imageUrl,
                    mediaUrl,
                    embedUrl,
                    mime: item.mime,
                    orientation: detectOrientation(item.width, item.height, item.categories, index),
                    goal,
                    style,
                };
            })
            .filter((item) => item.mediaUrl.length > 0 || item.embedUrl.length > 0);
    }, [myWork?.media]);

    useEffect(() => {
        setMediaDimensions(null);
        setShowMobileVideoDetails(false);
    }, [selectedVideo?.id]);

    if (videoShowcase.length === 0) {
        return null;
    }

    const dialogSizeClass =
        selectedVideo?.orientation === "portrait"
            ? "md:w-[90vw] md:max-w-[56rem]"
            : "md:w-[98vw] md:max-w-[92rem]";

    return (
        <section id="video-showcase" className="relative overflow-hidden py-12 lg:py-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,hsl(var(--accent)/0.2),transparent_35%),radial-gradient(circle_at_90%_0%,hsl(var(--accent)/0.14),transparent_35%),linear-gradient(145deg,hsl(var(--foreground))_0%,hsl(var(--foreground)/0.96)_100%)]" />
            <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,hsl(var(--primary-foreground)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary-foreground)/0.2)_1px,transparent_1px)] [background-size:52px_52px]" />

            <div className="container relative mx-auto px-6 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mx-auto mb-8 max-w-2xl text-center"
                >
                    <p className="mb-2.5 inline-flex items-center gap-2 border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1.5 font-body text-[0.65rem] uppercase tracking-[0.2em] text-primary-foreground/80">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        Cinematic Storytelling UGC
                    </p>
                    <h2 className="font-display text-3xl font-light italic leading-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                        Signature Video Concepts That Make Brands Unforgettable
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-primary-foreground/75">
                        Cinematic hooks, conversion-minded structure, and brand-safe storytelling built for deals.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
                    {videoShowcase.map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.75, delay: index * 0.08 }}
                            className="group relative overflow-hidden border border-primary-foreground/20 bg-primary-foreground/5 lg:col-span-4"
                        >
                            <button
                                type="button"
                                onClick={() => setSelectedVideo(video)}
                                aria-label={`Open media preview for ${video.title}`}
                                className="relative block h-full w-full text-left"
                            >
                                <div className="relative h-[300px] sm:h-[330px] lg:h-[320px]">
                                    {isVideoAsset(video.mediaUrl, video.mime) ? (
                                        <video
                                            src={video.mediaUrl}
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                            preload="metadata"
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <img
                                            src={video.imageUrl}
                                            alt={video.title}
                                            loading="lazy"
                                            {...protectedImageProps}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    )}
                                    {!isVideoAsset(video.mediaUrl, video.mime) && <PhotoProtectionOverlay />}
                                    {(video.hook || video.description || video.style) && (
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(0deg,rgba(8,8,8,0.76)_0%,rgba(8,8,8,0.42)_44%,rgba(8,8,8,0)_100%)]" />
                                    )}
                                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center gap-1 bg-background/90 px-2 py-1 font-body text-[0.58rem] uppercase tracking-[0.16em] text-foreground">
                                            <Clapperboard className="h-3 w-3 text-accent" />
                                            {video.orientation}
                                        </span>
                                        {video.goal && (
                                            <span className="bg-primary-foreground/15 px-2 py-1 font-body text-[0.58rem] uppercase tracking-[0.16em] text-primary-foreground/80">
                                                {video.goal}
                                            </span>
                                        )}
                                    </div>

                                    <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:bg-accent group-hover:text-accent-foreground">
                                        <Play className="h-3.5 w-3.5" />
                                    </span>

                                    <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4">
                                        {video.hook && (
                                            <>
                                                <p className="mb-1.5 font-body text-[0.58rem] uppercase tracking-[0.18em] text-primary-foreground/70">
                                                    Hook
                                                </p>
                                                <h3 className="font-display text-xl font-light italic leading-tight text-primary-foreground sm:text-2xl">
                                                    {video.hook}
                                                </h3>
                                            </>
                                        )}
                                        {video.description && (
                                            <div className="mt-2 max-h-16 max-w-2xl overflow-hidden font-body text-xs leading-relaxed text-primary-foreground/80 sm:text-sm">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                                        ul: ({ children }) => (
                                                            <ul className="mb-1 list-disc space-y-0.5 pl-4 last:mb-0">
                                                                {children}
                                                            </ul>
                                                        ),
                                                        ol: ({ children }) => (
                                                            <ol className="mb-1 list-decimal space-y-0.5 pl-4 last:mb-0">
                                                                {children}
                                                            </ol>
                                                        ),
                                                        li: ({ children }) => <li>{children}</li>,
                                                        strong: ({ children }) => (
                                                            <strong className="font-semibold text-primary-foreground">
                                                                {children}
                                                            </strong>
                                                        ),
                                                        em: ({ children }) => (
                                                            <em className="italic text-primary-foreground/95">{children}</em>
                                                        ),
                                                        h1: ({ children }) => (
                                                            <h4 className="mb-1 font-display text-base text-primary-foreground">
                                                                {children}
                                                            </h4>
                                                        ),
                                                        h2: ({ children }) => (
                                                            <h4 className="mb-1 font-display text-sm text-primary-foreground">
                                                                {children}
                                                            </h4>
                                                        ),
                                                        h3: ({ children }) => (
                                                            <h5 className="mb-1 font-display text-sm text-primary-foreground">
                                                                {children}
                                                            </h5>
                                                        ),
                                                        a: ({ children, href }) => (
                                                            <a
                                                                href={href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-accent underline underline-offset-2 hover:opacity-80"
                                                            >
                                                                {children}
                                                            </a>
                                                        ),
                                                    }}
                                                >
                                                    {video.description}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                        {video.style && (
                                            <p className="mt-2.5 inline-flex items-center gap-2 font-body text-[0.65rem] uppercase tracking-[0.14em] text-primary-foreground/72 sm:text-xs">
                                                {video.style}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>

                <Dialog
                    open={Boolean(selectedVideo)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedVideo(null);
                            setShowMobileVideoDetails(false);
                        }
                    }}
                >
                    <DialogContent
                        className={`left-2 top-2 h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none translate-x-0 translate-y-0 overflow-y-auto p-0 sm:rounded-lg md:left-[50%] md:top-[50%] md:h-auto md:w-auto md:max-h-[86vh] md:overflow-hidden md:translate-x-[-50%] md:translate-y-[-50%] ${dialogSizeClass}`}
                    >
                        {selectedVideo && (
                            <div className="min-h-full md:min-h-0 md:grid md:max-h-[86vh] md:grid-cols-[minmax(0,1fr)_360px] md:items-start">
                                <div
                                    className={`flex w-full justify-center bg-background p-3 md:h-auto md:min-h-0 md:items-start md:overflow-auto md:p-1.5 ${
                                        selectedVideo.orientation === "portrait"
                                            ? "min-h-[calc(100dvh-6rem)] items-center"
                                            : "items-start"
                                    }`}
                                >
                                    <div
                                        className={`inline-flex max-w-[calc(100vw-1rem)] flex-col items-stretch ${
                                            selectedVideo.orientation === "portrait" ? "w-fit" : "w-full"
                                        }`}
                                    >
                                        {isVideoAsset(selectedVideo.mediaUrl, selectedVideo.mime) ? (
                                            <video
                                                src={selectedVideo.mediaUrl}
                                                controls
                                                autoPlay
                                                playsInline
                                                className="mx-auto block h-auto w-auto max-h-[calc(100dvh-5.5rem)] max-w-full object-contain md:max-h-[78vh]"
                                                onLoadedMetadata={(event) => {
                                                    const videoElement = event.currentTarget;
                                                    setMediaDimensions({
                                                        width: videoElement.videoWidth,
                                                        height: videoElement.videoHeight,
                                                    });
                                                }}
                                            />
                                        ) : selectedVideo.embedUrl ? (
                                            <div
                                                className={`relative mx-auto overflow-hidden bg-black ${
                                                    selectedVideo.orientation === "portrait"
                                                        ? "inline-block h-[calc(100dvh-5.5rem)] max-w-full md:h-[78vh]"
                                                        : "w-full max-h-[calc(100dvh-5.5rem)] md:max-w-5xl md:max-h-[78vh]"
                                                }`}
                                                style={{
                                                    aspectRatio: selectedVideo.orientation === "portrait" ? 9 / 16 : 16 / 9,
                                                }}
                                            >
                                                <iframe
                                                    src={selectedVideo.embedUrl}
                                                    title={selectedVideo.title}
                                                    loading="lazy"
                                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                                    allowFullScreen
                                                    className="absolute inset-0 h-full w-full border-0"
                                                />
                                            </div>
                                        ) : (
                                            <div className="relative inline-block max-w-full">
                                                <img
                                                    src={getHighQualityImageUrl(selectedVideo.imageUrl)}
                                                    alt={selectedVideo.title}
                                                    {...protectedImageProps}
                                                    className="mx-auto block h-auto w-auto max-h-[calc(100dvh-5.5rem)] max-w-full object-contain md:max-h-[78vh]"
                                                    onLoad={(event) => {
                                                        const imageElement = event.currentTarget;
                                                        setMediaDimensions({
                                                            width: imageElement.naturalWidth,
                                                            height: imageElement.naturalHeight,
                                                        });
                                                    }}
                                                />
                                                <PhotoProtectionOverlay />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowMobileVideoDetails((current) => !current)}
                                            aria-label={showMobileVideoDetails ? "Hide details" : "Show details"}
                                            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-foreground md:hidden"
                                        >
                                            {showMobileVideoDetails ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            <span className="font-body text-xs uppercase tracking-[0.14em]">
                                                {showMobileVideoDetails ? "Hide Details" : "Show Details"}
                                            </span>
                                        </button>

                                        {showMobileVideoDetails && (
                                            <div className="mt-3 pb-6 md:hidden">
                                                <div className="space-y-2.5 border-t border-border pt-3">
                                                    <p className="font-display text-xl font-light italic leading-tight text-foreground">
                                                        {selectedVideo.title}
                                                    </p>

                                                    {selectedVideo.description && (
                                                        <p className="font-body text-sm leading-relaxed text-muted-foreground">
                                                            {selectedVideo.description}
                                                        </p>
                                                    )}

                                                    {selectedVideo.hook && (
                                                        <>
                                                            <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                                Hook
                                                            </p>
                                                            <p className="font-display text-base italic text-foreground leading-tight">
                                                                {selectedVideo.hook}
                                                            </p>
                                                        </>
                                                    )}

                                                    {selectedVideo.goal && (
                                                        <>
                                                            <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                                Goal
                                                            </p>
                                                            <p className="font-body text-sm text-foreground">{selectedVideo.goal}</p>
                                                        </>
                                                    )}

                                                    {selectedVideo.style && (
                                                        <>
                                                            <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                                Style
                                                            </p>
                                                            <p className="font-body text-sm text-foreground">{selectedVideo.style}</p>
                                                        </>
                                                    )}

                                                    <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                        Orientation
                                                    </p>
                                                    <p className="font-body text-sm capitalize text-foreground">
                                                        {selectedVideo.orientation}
                                                    </p>

                                                    <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                        Resolution
                                                    </p>
                                                    <p className="font-body text-sm text-foreground">
                                                        {mediaDimensions
                                                            ? `${mediaDimensions.width} x ${mediaDimensions.height}px`
                                                            : "Loading..."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="hidden overflow-auto border-t border-border bg-background p-4 pt-12 md:block md:max-h-[78vh] md:border-l md:border-t-0 md:p-5 md:pt-14">
                                    <DialogHeader className="text-left pr-12 md:pr-14">
                                        <DialogTitle className="break-words font-display text-2xl font-light italic leading-tight text-foreground">
                                            {selectedVideo.title}
                                        </DialogTitle>
                                        {selectedVideo.description && (
                                            <div className="font-body text-sm leading-relaxed text-muted-foreground">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                                        ul: ({ children }) => (
                                                            <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                                                                {children}
                                                            </ul>
                                                        ),
                                                        ol: ({ children }) => (
                                                            <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                                                                {children}
                                                            </ol>
                                                        ),
                                                        li: ({ children }) => <li>{children}</li>,
                                                        strong: ({ children }) => (
                                                            <strong className="font-semibold text-foreground">
                                                                {children}
                                                            </strong>
                                                        ),
                                                        em: ({ children }) => (
                                                            <em className="italic text-foreground/90">{children}</em>
                                                        ),
                                                        h1: ({ children }) => (
                                                            <h4 className="mb-2 font-display text-xl text-foreground">
                                                                {children}
                                                            </h4>
                                                        ),
                                                        h2: ({ children }) => (
                                                            <h4 className="mb-2 font-display text-lg text-foreground">
                                                                {children}
                                                            </h4>
                                                        ),
                                                        h3: ({ children }) => (
                                                            <h5 className="mb-2 font-display text-base text-foreground">
                                                                {children}
                                                            </h5>
                                                        ),
                                                        a: ({ children, href }) => (
                                                            <a
                                                                href={href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-accent underline underline-offset-2 hover:opacity-80"
                                                            >
                                                                {children}
                                                            </a>
                                                        ),
                                                    }}
                                                >
                                                    {selectedVideo.description}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </DialogHeader>

                                    <div className="mt-4 space-y-2.5 border-t border-border pt-3">
                                        {selectedVideo.hook && (
                                            <>
                                                <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                    Hook
                                                </p>
                                                <p className="font-display text-lg italic text-foreground leading-tight">
                                                    {selectedVideo.hook}
                                                </p>
                                            </>
                                        )}

                                        {selectedVideo.goal && (
                                            <>
                                                <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                    Goal
                                                </p>
                                                <p className="font-body text-sm text-foreground">{selectedVideo.goal}</p>
                                            </>
                                        )}

                                        {selectedVideo.style && (
                                            <>
                                                <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                    Style
                                                </p>
                                                <p className="font-body text-sm text-foreground">{selectedVideo.style}</p>
                                            </>
                                        )}

                                        <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                            Orientation
                                        </p>
                                        <p className="font-body text-sm capitalize text-foreground">
                                            {selectedVideo.orientation}
                                        </p>

                                        <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                            Resolution
                                        </p>
                                        <p className="font-body text-sm text-foreground">
                                            {mediaDimensions
                                                ? `${mediaDimensions.width} x ${mediaDimensions.height}px`
                                                : "Loading..."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
};

export default CinematicVideoSection;
