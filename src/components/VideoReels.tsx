import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Hls from "hls.js";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
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
    return `${embedUrl}${separator}autoplay=true&loop=true&muted=false&preload=true`;
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
        if (!isVideoItem(item)) {
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

const VideoReel = ({ reel, index }: { reel: ReelVideo; index: number }) => {
    const [playing, setPlaying] = useState(false);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hasDirect = reel.playbackUrl.length > 0;
    const isHls = isHlsUrl(reel.playbackUrl) || reel.mime === "application/x-mpegURL";

    useEffect(() => {
        return () => {
            hlsRef.current?.destroy();
            hlsRef.current = null;
        };
    }, []);

    const startPlaying = () => {
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
                    const hls = new Hls();
                    hlsRef.current = hls;
                    hls.loadSource(reel.playbackUrl);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => undefined));
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
            className="w-[210px] sm:w-[224px] lg:w-[244px]"
        >
            <div className="group relative">
                <PhoneFrame showReelChrome={!playing}>
                    {hasDirect ? (
                        <video
                            ref={videoRef}
                            src={isHls ? undefined : reel.playbackUrl}
                            poster={reel.poster || undefined}
                            playsInline
                            loop
                            muted={muted}
                            preload="none"
                            onContextMenu={(event) => event.preventDefault()}
                            onTimeUpdate={onTimeUpdate}
                            onPlay={() => setPaused(false)}
                            onPause={() => setPaused(true)}
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

            <div className="mt-4 text-center">
                {reel.title && (
                    <h4 className="font-display text-lg font-light italic leading-tight text-primary-foreground">
                        {reel.title}
                    </h4>
                )}
                {reel.subtitle && (
                    <p className="mt-1 font-body text-[0.6rem] uppercase tracking-[0.18em] text-primary-foreground/55">
                        {reel.subtitle}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

const VideoReels = ({ myWork, showcase }: VideoReelsProps) => {
    const sections = useMemo(() => groupReels(collectReels(myWork, showcase)), [myWork, showcase]);

    if (sections.length === 0) {
        return null;
    }

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
                    className="mx-auto mb-10 max-w-2xl text-center"
                >
                    <p className="mb-3 font-body text-sm uppercase tracking-[0.22em] text-primary-foreground/70">
                        Videography
                    </p>
                    <h2 className="font-display text-3xl font-light italic leading-tight text-primary-foreground sm:text-4xl">
                        Cinematic Reels, Grouped by What I Shoot
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl font-body text-sm leading-relaxed text-primary-foreground/75">
                        The real Instagram edits — tap any frame to play it right here.
                    </p>
                </motion.div>

                <div className="space-y-14">
                    {sections.map(([category, reels]) => (
                        <div key={category}>
                            <div className="mb-6 flex items-center gap-4">
                                <h3 className="font-body text-sm font-medium uppercase tracking-[0.28em] text-primary-foreground">
                                    {category}
                                </h3>
                                <span className="h-px flex-1 bg-primary-foreground/20" />
                                <span className="font-body text-[0.6rem] uppercase tracking-[0.18em] text-primary-foreground/50">
                                    {reels.length} {reels.length === 1 ? "reel" : "reels"}
                                </span>
                            </div>

                            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-10">
                                {reels.map((reel, index) => (
                                    <VideoReel key={reel.id} reel={reel} index={index} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default VideoReels;
