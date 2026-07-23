import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Hls from "hls.js";
import { Bookmark, Eye, Heart, Instagram, Pause, Play, Share2, Volume2, VolumeX } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { PhotoProtectionOverlay, protectedImageProps } from "@/components/PhotoProtection";
import { buildCloudinaryImageUrl, isCloudinaryUrl } from "@/lib/cloudinary";
import type {
    UgcShowcaseContent,
    UgcWorkContent,
    UgcWorkMediaContent,
} from "@/hooks/useUgcContent";

type VideoReelsProps = {
    myWork?: UgcWorkContent;
    showcase?: UgcShowcaseContent;
    showMetrics?: boolean;
};

type ReelMetrics = {
    views: number | null;
    likes: number | null;
    shares: number | null;
    saves: number | null;
};

type ReelVideo = {
    id: string;
    title: string;
    caption: string;
    subtitle: string;
    category: string;
    playbackUrl: string;
    embedUrl: string;
    poster: string;
    mime: string;
    isCollaboration: boolean;
    instagramUrl: string;
    metrics: ReelMetrics;
};

/** Sections shown first, in this order. Anything else follows alphabetically; uncategorized last. */
const PREFERRED_ORDER = [
    "Highlights",
    "Hotels & Restaurants",
    "Hotels",
    "Restaurants",
    "Travel",
    "Experiences",
    "Lifestyle",
    "Food",
    "Nature",
];
const UNCATEGORIZED = "Featured";

const isVideoAsset = (url: string, mime = ""): boolean => {
    if (mime.toLowerCase().startsWith("video/")) {
        return true;
    }
    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
};

const isIframeEmbedUrl = (url: string): boolean => /iframe\.mediadelivery\.net\/embed\//i.test(url);

/** Bunny Stream (and most CDNs) serve adaptive video as an HLS .m3u8 playlist. */
const isHlsUrl = (url: string): boolean => /\.m3u8(\?|$)/i.test(url);

const isVideoItem = (item: UgcWorkMediaContent): boolean =>
    item.kind === "video" || item.mime.toLowerCase().startsWith("video/");

const isVerticalVideoItem = (item: UgcWorkMediaContent): boolean => {
    if (!isVideoItem(item)) {
        return false;
    }

    if (item.width && item.height && item.width > 0 && item.height > 0) {
        return item.height >= item.width;
    }

    return true;
};

const preferredRank = (category: string): number => {
    const index = PREFERRED_ORDER.findIndex((entry) => entry.toLowerCase() === category.toLowerCase());
    return index === -1 ? PREFERRED_ORDER.length : index;
};

const chooseCategory = (categories: string[]): string => {
    const cleaned = categories.map((value) => value.trim()).filter((value) => value.length > 0);
    if (cleaned.length === 0) {
        return UNCATEGORIZED;
    }

    let best: string | null = null;
    let bestRank = Infinity;
    for (const category of cleaned) {
        const rank = preferredRank(category);
        if (rank < PREFERRED_ORDER.length && rank < bestRank) {
            bestRank = rank;
            best = category;
        }
    }

    return best ?? cleaned[0];
};

const optimizePoster = (url: string): string =>
    isCloudinaryUrl(url) ? buildCloudinaryImageUrl(url, { width: 640, crop: "limit" }) : url;

const withAutoplay = (embedUrl: string): string => {
    const separator = embedUrl.includes("?") ? "&" : "?";
    return `${embedUrl}${separator}autoplay=true&loop=false&muted=false&preload=true`;
};

const toReel = (item: UgcWorkMediaContent): ReelVideo | null => {
    const directPlayback = [item.playbackUrl, item.sourceUrl].find(
        (url) => url && (isVideoAsset(url, item.mime) || isHlsUrl(url)),
    );
    const embedUrl = item.embedUrl && isIframeEmbedUrl(item.embedUrl) ? item.embedUrl : "";
    if (!directPlayback && !embedUrl) {
        return null;
    }

    const poster = [item.thumbnailUrl, item.imageUrl, item.sourceUrl].find(
        (url) => url && !isIframeEmbedUrl(url) && !isVideoAsset(url, ""),
    );

    return {
        id: item.id,
        title: item.title.trim(),
        caption: item.hook.trim(),
        subtitle: [item.goal, item.style].map((value) => value.trim()).filter(Boolean).join(" · "),
        category: chooseCategory(item.categories),
        playbackUrl: directPlayback ?? "",
        embedUrl,
        poster: poster ? optimizePoster(poster) : "",
        mime: item.mime,
        isCollaboration: item.isCollaboration,
        instagramUrl: item.instagramUrl.trim(),
        metrics: {
            views: item.metricViews,
            likes: item.metricLikes,
            shares: item.metricShares,
            saves: item.metricSaves,
        },
    };
};

const collectReels = (myWork?: UgcWorkContent, showcase?: UgcShowcaseContent): ReelVideo[] => {
    const sources: UgcWorkMediaContent[] = [
        ...(showcase?.videos ?? []),
        ...(myWork?.media ?? []),
        ...(showcase?.collections ?? []).flatMap((collection) => collection.media),
    ];

    const seen = new Set<string>();
    const reels: ReelVideo[] = [];
    for (const item of sources) {
        if (!isVerticalVideoItem(item)) {
            continue;
        }
        const reel = toReel(item);
        if (!reel) {
            continue;
        }
        const key = reel.playbackUrl || reel.embedUrl || reel.id;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        reels.push(reel);
    }

    return reels;
};

const groupReels = (reels: ReelVideo[]): Array<[string, ReelVideo[]]> => {
    const groups = new Map<string, ReelVideo[]>();
    for (const reel of reels) {
        const current = groups.get(reel.category) ?? [];
        current.push(reel);
        groups.set(reel.category, current);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => {
        if (a === UNCATEGORIZED) return 1;
        if (b === UNCATEGORIZED) return -1;
        const rankDiff = preferredRank(a) - preferredRank(b);
        return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
    });
};

const compactMetric = (value: number): string =>
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const VideoReel = ({
    reel,
    index,
    activeReelId,
    onActivate,
    showMetrics,
}: {
    reel: ReelVideo;
    index: number;
    activeReelId: string | null;
    onActivate: (id: string) => void;
    showMetrics?: boolean;
}) => {
    const [playing, setPlaying] = useState(false);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hasDirect = reel.playbackUrl.length > 0;
    const isHls = isHlsUrl(reel.playbackUrl) || reel.mime === "application/x-mpegURL";
    const isActive = activeReelId === reel.id;

    useEffect(() => {
        return () => {
            hlsRef.current?.destroy();
            hlsRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (isActive || !playing) {
            return;
        }

        videoRef.current?.pause();
        hlsRef.current?.destroy();
        hlsRef.current = null;
        setPlaying(false);
        setPaused(false);
        setProgress(0);
    }, [isActive, playing]);

    const startPlaying = () => {
        onActivate(reel.id);
        setPlaying(true);
        if (!hasDirect) {
            return;
        }

        // play() is async and resolves after state applies
        window.requestAnimationFrame(() => {
            const video = videoRef.current;
            if (!video) {
                return;
            }

            const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

            if (isHls && !nativeHls && Hls.isSupported()) {
                if (!hlsRef.current) {
                    // Skip the usual low-quality-first bandwidth ramp-up — start at the
                    // highest available rendition instead of easing up from a low bitrate.
                    const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: false });
                    hlsRef.current = hls;
                    hls.loadSource(reel.playbackUrl);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                        if (data.levels.length > 0) {
                            const highestIndex = data.levels.reduce(
                                (bestIdx, level, idx, levels) => (level.bitrate > levels[bestIdx].bitrate ? idx : bestIdx),
                                0,
                            );
                            hls.currentLevel = highestIndex;
                        }
                        video.play().catch(() => undefined);
                    });
                } else {
                    video.play().catch(() => undefined);
                }
                return;
            }

            if (!video.src) {
                video.src = reel.playbackUrl;
            }
            video.play().catch(() => undefined);
        });
    };

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play().catch(() => undefined);
        } else {
            video.pause();
        }
    };

    const onTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        setProgress((video.currentTime / video.duration) * 100);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: Math.min(index, 4) * 0.06 }}
            className="w-[202px] shrink-0 snap-start sm:w-[218px] lg:w-[228px]"
        >
            <div className="group relative transition-transform duration-500 hover:-translate-y-1">
                <PhoneFrame
                    showReelChrome={!playing}
                    className="shadow-[0_34px_78px_-28px_rgba(0,0,0,0.9)] ring-black/55"
                >
                    {hasDirect && playing ? (
                        <video
                            ref={videoRef}
                            src={isHls ? undefined : reel.playbackUrl}
                            poster={reel.poster || undefined}
                            playsInline
                            muted={muted}
                            preload="none"
                            onContextMenu={(event) => event.preventDefault()}
                            onTimeUpdate={onTimeUpdate}
                            onPlay={() => setPaused(false)}
                            onPause={() => setPaused(true)}
                        />
                    ) : hasDirect && reel.poster ? (
                        <>
                            <img src={reel.poster} alt={reel.title} loading="lazy" {...protectedImageProps} />
                            <PhotoProtectionOverlay />
                        </>
                    ) : hasDirect ? (
                        <video
                            poster={reel.poster || undefined}
                            playsInline
                            muted
                            preload="metadata"
                            onContextMenu={(event) => event.preventDefault()}
                        />
                    ) : playing ? (
                        <iframe
                            src={withAutoplay(reel.embedUrl)}
                            title={reel.title || "Reel"}
                            loading="lazy"
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                            allowFullScreen
                            className="border-0"
                        />
                    ) : reel.poster ? (
                        <>
                            <img src={reel.poster} alt={reel.title} loading="lazy" {...protectedImageProps} />
                            <PhotoProtectionOverlay />
                        </>
                    ) : (
                        <div className="h-full w-full bg-neutral-800" />
                    )}
                </PhoneFrame>

                {!playing && (
                    <button
                        type="button"
                        onClick={startPlaying}
                        aria-label={`Play ${reel.title || "video"}`}
                        className="absolute inset-0 z-40 grid place-items-center rounded-[2.4rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <span className="grid h-14 w-14 place-items-center rounded-full border border-white/70 bg-black/35 text-white backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-transparent">
                            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                        </span>
                    </button>
                )}

                {playing && hasDirect && (
                    <div className="pointer-events-none absolute inset-[0.4rem] z-40 overflow-hidden rounded-[2.05rem]">
                        {/* tap anywhere to play / pause */}
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={paused ? "Play" : "Pause"}
                            className="pointer-events-auto absolute inset-0"
                        >
                            {paused && (
                                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-black/35 text-white backdrop-blur-sm">
                                    <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                                </span>
                            )}
                        </button>

                        {/* control bar — sits safely inside the rounded screen */}
                        <div className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3.5 pt-8">
                            <div className="flex items-center gap-2.5 text-white">
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    aria-label={paused ? "Play" : "Pause"}
                                    className="shrink-0"
                                >
                                    {paused ? (
                                        <Play className="h-4 w-4" fill="currentColor" />
                                    ) : (
                                        <Pause className="h-4 w-4" fill="currentColor" />
                                    )}
                                </button>
                                <div
                                    role="slider"
                                    aria-label="Seek"
                                    aria-valuenow={Math.round(progress)}
                                    tabIndex={0}
                                    onClick={(event) => {
                                        const video = videoRef.current;
                                        if (!video || !video.duration) return;
                                        const rect = event.currentTarget.getBoundingClientRect();
                                        const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
                                        video.currentTime = ratio * video.duration;
                                        setProgress(ratio * 100);
                                    }}
                                    className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/30"
                                >
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-accent"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMuted((current) => !current)}
                                    aria-label={muted ? "Unmute" : "Mute"}
                                    className="shrink-0"
                                >
                                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 min-h-[3.5rem] text-center">
                {reel.title && (
                    <h4 className="line-clamp-2 font-body text-[0.68rem] font-medium uppercase leading-snug tracking-[0.14em] text-[#fbf6ee]/92">
                        {reel.title}
                    </h4>
                )}
                {reel.subtitle && (
                    <p className="mx-auto mt-1.5 line-clamp-2 max-w-[12rem] font-body text-[0.5rem] uppercase leading-relaxed tracking-[0.12em] text-[#d7c9ba]/68">
                        {reel.subtitle}
                    </p>
                )}
                {showMetrics &&
                    (reel.metrics.views != null ||
                        reel.metrics.likes != null ||
                        reel.metrics.shares != null ||
                        reel.metrics.saves != null) && (
                        <div className="mt-2 flex items-center justify-center gap-3 font-body text-[0.6rem] tracking-[0.02em] text-[#fbf6ee]/85">
                            {reel.metrics.views != null && (
                                <span className="inline-flex items-center gap-1" title="Views">
                                    <Eye className="h-3 w-3 text-[#d7c9ba]/70" strokeWidth={1.75} />
                                    {compactMetric(reel.metrics.views)}
                                </span>
                            )}
                            {reel.metrics.likes != null && (
                                <span className="inline-flex items-center gap-1" title="Likes">
                                    <Heart className="h-3 w-3 text-[#d7c9ba]/70" strokeWidth={1.75} />
                                    {compactMetric(reel.metrics.likes)}
                                </span>
                            )}
                            {reel.metrics.shares != null && (
                                <span className="inline-flex items-center gap-1" title="Shares">
                                    <Share2 className="h-3 w-3 text-[#d7c9ba]/70" strokeWidth={1.75} />
                                    {compactMetric(reel.metrics.shares)}
                                </span>
                            )}
                            {reel.metrics.saves != null && (
                                <span className="inline-flex items-center gap-1" title="Saves">
                                    <Bookmark className="h-3 w-3 text-[#d7c9ba]/70" strokeWidth={1.75} />
                                    {compactMetric(reel.metrics.saves)}
                                </span>
                            )}
                        </div>
                    )}
                {reel.instagramUrl && (
                    <a
                        href={reel.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-auto mt-3 inline-flex items-center gap-1.5 border-b border-[#d7c9ba]/35 pb-1 font-body text-[0.55rem] font-medium uppercase tracking-[0.14em] text-[#fbf6ee]/82 transition-colors duration-300 hover:border-accent hover:text-accent"
                    >
                        <Instagram className="h-3.5 w-3.5" strokeWidth={1.65} />
                        <span>View on Instagram</span>
                    </a>
                )}
            </div>
        </motion.div>
    );
};

const VideoReels = ({ myWork, showcase, showMetrics }: VideoReelsProps) => {
    const sections = useMemo(() => groupReels(collectReels(myWork, showcase)), [myWork, showcase]);
    const [activeReelId, setActiveReelId] = useState<string | null>(null);

    if (sections.length === 0) {
        return null;
    }

    return (
        <div className="relative pb-12 pt-12 lg:pb-14 lg:pt-14">
            <div className="container relative mx-auto px-6 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mb-9 grid gap-4 border-b border-[#d7c9ba]/16 pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                >
                    <div>
                        <p className="mb-2 font-body text-[0.62rem] uppercase tracking-[0.26em] text-[#d7c9ba]/75">
                            Cinematic UGC
                        </p>
                        <h2 className="font-display text-3xl font-light italic leading-tight text-[#fbf6ee] sm:text-4xl">
                            Vertical Reels
                        </h2>
                    </div>
                    <p className="max-w-sm font-body text-sm leading-relaxed text-[#d7c9ba]/74 sm:text-right">
                        Short-form edits built for hotel campaigns, social proof, and premium stay storytelling.
                    </p>
                </motion.div>

                <div className="space-y-12">
                    {sections.map(([category, reels]) => (
                        <div key={category}>
                            <div className="mb-5 flex items-center gap-3">
                                <h3 className="font-body text-[0.78rem] font-medium uppercase tracking-[0.22em] text-[#fbf6ee] sm:text-[0.84rem]">
                                    {category}
                                </h3>
                                <span className="h-px flex-1 bg-[#d7c9ba]/16" />
                                <span className="rounded-full border border-[#d7c9ba]/18 px-2.5 py-1 font-body text-[0.55rem] uppercase tracking-[0.16em] text-[#d7c9ba]/70">
                                    {reels.length} {reels.length === 1 ? "reel" : "reels"}
                                </span>
                            </div>

                            <div className="-mx-6 overflow-x-auto px-6 pb-5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <div className="flex snap-x snap-mandatory gap-4 sm:gap-5 lg:justify-center lg:gap-6">
                                    {reels.map((reel, index) => (
                                        <VideoReel
                                            key={reel.id}
                                            reel={reel}
                                            index={index}
                                            activeReelId={activeReelId}
                                            onActivate={setActiveReelId}
                                            showMetrics={showMetrics}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideoReels;
