import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js";
import { Globe, Instagram, Loader2, Lock, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { env } from "@/config/env";
import { PhotoProtectionOverlay, protectedImageProps } from "@/components/PhotoProtection";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PhoneFrame } from "@/components/PhoneFrame";

const INSTAGRAM_URL = "https://instagram.com/sarah_ghobj";
const PORTFOLIO_URL = "https://ugc.sarah-ghobj.com";
const WATERMARK_LABEL = "ugc.sarah-ghobj.com";

type PreviewMedia = {
    id: string;
    kind: "photo" | "video";
    title: string;
    hook: string;
    width: number | null;
    height: number | null;
    url?: string;
    playbackUrl?: string;
    embedUrl?: string;
    poster?: string;
    mime?: string;
};

type PreviewOk = {
    status: "ok";
    title: string;
    clientName: string;
    intro: string;
    offer: string;
    watermark: string;
    expiresAt: string;
    media: PreviewMedia[];
};

type PreviewLocked = {
    status: "locked";
    requiresPin: true;
    title: string;
    clientName: string;
    codeProvided?: boolean;
};

type PreviewState =
    | { phase: "loading" }
    | { phase: "error"; kind: "not_found" | "expired" | "network" }
    | { phase: "locked"; data: PreviewLocked; wrongPin: boolean }
    | { phase: "ok"; data: PreviewOk };

const viewUrl = (token: string, code?: string): string => {
    const base = `${env.strapiBaseUrl}/api/client-preview/view/${encodeURIComponent(token)}`;
    return code ? `${base}?code=${encodeURIComponent(code)}` : base;
};

/** Small inlined copy of brand.logoUrl (60x60 PNG) — referencing the remote Cloudinary URL
 * from inside a data-URI SVG used as a CSS background silently fails to load in most browsers,
 * so the logo is embedded as base64 to keep the whole watermark self-contained. */
const WATERMARK_LOGO_DATA_URI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAMAAAANIilAAAAAWlBMVEVHcEwQERELCwsFBgYGBgYJCQkGBgYFBgYFBQUFBgYGBgYGBgYGBgYGBgYGBgYHBwcGBgYICAgGBgYGBgYGBgYHBwcGBgYICAgICAcIBwcFBgYHBgcGBgYFBgZex0IaAAAAHXRSTlMAAQfebw7n/rLzyGahSqtbUiZ7h488lxYtHvs31fJG3EsAAAEySURBVBgZ7cFJkpwwAATAQkKUxL6vXf//pqehD+MTNCeHg0w8Ho//XzS0ZWrtKy3bweArU5fwTXwL44zLojiQa9rHVZV1PlBkg4uMJ0O34MMUnpxxUUnaBr9trxnX1NQ642/G4RovedxlpRJ3vajE4BaHUVJucEe8NEFUOuCGvES1UmKaua33v8U449mhSCSSYVxqK2pH0eOM12rg2oT6EWKXxYdR8jgzkhsAU+SBlHp81GKOM5nYYWcqK3HAoSNbnFlWhgkHl4o9dtGLHHCqlMoIh0LMsatJG+FUE8Q+wm4QY7wtCVnhgoxk6fCWK5nwY7aij3BFSzLJjCs80waAa4OUOlxTJyKTMasb45oqDxS9w1VTH0jxQ7JVhC+4rEx4sHkR4VvRtBV1sU14PB6Pf9UfbfgTATnMXysAAAAASUVORK5CYII=";

const watermarkStyle = (): React.CSSProperties => {
    const label = WATERMARK_LABEL.replace(/[<>&]/g, "");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='210'>
        <g transform='rotate(-28 20 120)' opacity='0.95'>
            <image href='${WATERMARK_LOGO_DATA_URI}' x='10' y='96' width='18' height='18' opacity='0.8' />
            <text x='34' y='111' fill='rgba(255,255,255,0.52)' font-family='Arial, sans-serif' font-size='14' font-weight='600'>${label}</text>
        </g>
    </svg>`;
    return {
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundRepeat: "repeat",
    };
};

const PreviewVideo = ({ media }: { media: PreviewMedia }) => {
    const [playing, setPlaying] = useState(false);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const src = media.playbackUrl || "";
    const isHls = /\.m3u8(\?|$)/i.test(src) || media.mime === "application/x-mpegURL";

    useEffect(() => {
        return () => {
            hlsRef.current?.destroy();
            hlsRef.current = null;
        };
    }, []);

    const start = () => {
        setPlaying(true);
        window.requestAnimationFrame(() => {
            const video = videoRef.current;
            if (!video || !src) {
                return;
            }
            const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";
            if (isHls && !nativeHls && Hls.isSupported()) {
                const hls = new Hls();
                hlsRef.current = hls;
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => undefined));
                return;
            }
            if (!video.src) {
                video.src = src;
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
        <div className="relative h-full w-full" onContextMenu={(e) => e.preventDefault()}>
            <video
                ref={videoRef}
                poster={media.poster || undefined}
                playsInline
                muted={muted}
                preload="none"
                onContextMenu={(e) => e.preventDefault()}
                onTimeUpdate={onTimeUpdate}
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
                className="h-full w-full bg-black object-cover"
            />
            {!playing && (
                <button
                    type="button"
                    onClick={start}
                    aria-label="Play"
                    className="absolute inset-0 z-40 grid place-items-center"
                >
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-white/70 bg-black/35 text-white backdrop-blur-sm">
                        <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                    </span>
                </button>
            )}

            {playing && (
                <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
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
    );
};

const ClientPreview = () => {
    const { token = "" } = useParams();
    const [state, setState] = useState<PreviewState>({ phase: "loading" });
    const [pin, setPin] = useState("");
    const [submittingPin, setSubmittingPin] = useState(false);

    // interest form
    const [showInterest, setShowInterest] = useState(false);
    const [contact, setContact] = useState("");
    const [message, setMessage] = useState("");
    const [interestSent, setInterestSent] = useState(false);
    const [sendingInterest, setSendingInterest] = useState(false);
    const authorizedCodeRef = useRef<string>("");

    const load = useCallback(
        async (code?: string) => {
            try {
                const res = await fetch(viewUrl(token, code), { headers: { Accept: "application/json" } });
                const json = await res.json().catch(() => null);

                if (res.status === 410 || json?.status === "expired") {
                    setState({ phase: "error", kind: "expired" });
                    return;
                }
                if (res.status === 404 || json?.status === "not_found" || !json) {
                    setState({ phase: "error", kind: "not_found" });
                    return;
                }
                if (json.status === "locked") {
                    setState({
                        phase: "locked",
                        data: json as PreviewLocked,
                        wrongPin: Boolean((json as PreviewLocked).codeProvided),
                    });
                    return;
                }
                if (json.status === "ok") {
                    authorizedCodeRef.current = code ?? "";
                    setState({ phase: "ok", data: json as PreviewOk });
                    return;
                }
                setState({ phase: "error", kind: "not_found" });
            } catch {
                setState({ phase: "error", kind: "network" });
            }
        },
        [token],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const submitPin = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!pin.trim()) {
            return;
        }
        setSubmittingPin(true);
        await load(pin.trim());
        setSubmittingPin(false);
    };

    const submitInterest = async (event: React.FormEvent) => {
        event.preventDefault();
        setSendingInterest(true);
        try {
            await fetch(`${env.strapiBaseUrl}/api/client-preview/interest/${encodeURIComponent(token)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contact, message, code: authorizedCodeRef.current }),
            });
            setInterestSent(true);
        } catch {
            setInterestSent(true);
        } finally {
            setSendingInterest(false);
        }
    };

    if (state.phase === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
            </div>
        );
    }

    if (state.phase === "error") {
        const copy =
            state.kind === "expired"
                ? { title: "This preview has expired", body: "The link is no longer active. Reach out and I'll gladly send a fresh one." }
                : state.kind === "network"
                    ? { title: "Something went wrong", body: "Please check your connection and try again." }
                    : { title: "Preview not found", body: "This link is invalid or has been closed." };
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
                <div className="max-w-md">
                    <h1 className="font-display text-3xl font-light italic">{copy.title}</h1>
                    <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
                </div>
            </div>
        );
    }

    if (state.phase === "locked") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
                <form onSubmit={submitPin} className="w-full max-w-sm text-center">
                    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-border">
                        <Lock className="h-5 w-5 text-accent" />
                    </span>
                    <h1 className="font-display text-2xl font-light italic">{state.data.title || "Private preview"}</h1>
                    <p className="mt-2 font-body text-sm text-muted-foreground">
                        This preview is protected. Enter the access code I shared with you.
                    </p>
                    <input
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                        inputMode="numeric"
                        placeholder="Access code"
                        className="mt-5 h-12 w-full rounded-none border border-input bg-background px-4 text-center font-body tracking-[0.3em] text-foreground outline-none focus:border-primary"
                    />
                    {state.wrongPin && (
                        <p className="mt-2 font-body text-xs text-destructive">That code didn't match. Try again.</p>
                    )}
                    <button
                        type="submit"
                        disabled={submittingPin}
                        className="mt-4 inline-flex h-12 w-full items-center justify-center bg-foreground font-body text-xs uppercase tracking-[0.18em] text-background disabled:opacity-60"
                    >
                        {submittingPin ? "Checking…" : "Unlock preview"}
                    </button>
                </form>
            </div>
        );
    }

    const data = state.data;
    const wm = watermarkStyle();

    return (
        <div className="min-h-screen bg-background text-foreground" onContextMenu={(e) => e.preventDefault()}>
            <div className="mx-auto max-w-3xl px-6 py-10 lg:max-w-5xl lg:py-14">
                <div className="lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-12">
                <header className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
                    <p className="font-body text-sm uppercase tracking-[0.22em] text-muted-foreground">
                        A preview for {data.clientName || "you"}
                    </p>
                    <h1 className="mt-2 font-display text-4xl font-light italic leading-tight sm:text-5xl">
                        {data.title}
                    </h1>
                    {data.intro && (
                        <MarkdownContent
                            content={data.intro}
                            className="mx-auto mt-4 max-w-xl text-left font-body text-base leading-relaxed text-muted-foreground lg:mx-0 lg:max-w-none"
                        />
                    )}
                    <p className="mt-4 inline-flex items-center gap-1.5 font-body text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Private · view-only sample
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-4 lg:justify-start">
                        <a
                            href={INSTAGRAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Sarah Ghobj on Instagram"
                            className="text-muted-foreground transition-colors hover:text-accent"
                        >
                            <Instagram className="h-4 w-4" strokeWidth={1.75} />
                        </a>
                        <a
                            href={PORTFOLIO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Sarah Ghobj's portfolio"
                            className="text-muted-foreground transition-colors hover:text-accent"
                        >
                            <Globe className="h-4 w-4" strokeWidth={1.75} />
                        </a>
                    </div>
                </header>

                <div className="mx-auto mt-8 max-w-xl rounded-lg border border-border bg-card/60 p-6 text-center sm:p-8 lg:sticky lg:top-10 lg:mx-0 lg:mt-0 lg:max-w-none">
                        {data.offer && (
                            <>
                                <p className="font-body text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
                                    The offer
                                </p>
                                <MarkdownContent
                                    content={data.offer}
                                    className="mt-3 text-left font-body text-sm leading-relaxed text-foreground"
                                />

                                <div className="mt-6 border-t border-border/60 pt-5 text-left">
                                    <p className="font-body text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
                                        How it works
                                    </p>
                                    <ol className="mt-3 space-y-2.5 font-body text-sm leading-relaxed text-muted-foreground">
                                        <li className="flex gap-2.5">
                                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[0.65rem] font-semibold text-foreground">
                                                1
                                            </span>
                                            <span>
                                                Click "I'm interested" below — add any notes or questions you have.
                                            </span>
                                        </li>
                                        <li className="flex gap-2.5">
                                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[0.65rem] font-semibold text-foreground">
                                                2
                                            </span>
                                            <span>I'll send you the payment details.</span>
                                        </li>
                                        <li className="flex gap-2.5">
                                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[0.65rem] font-semibold text-foreground">
                                                3
                                            </span>
                                            <span>
                                                Once payment is received, you'll get a WeTransfer link with the
                                                finished video and a PDF license for the music used.
                                            </span>
                                        </li>
                                    </ol>
                                </div>
                            </>
                        )}

                        {interestSent ? (
                            <p className="mt-4 font-display text-xl font-light italic text-foreground">
                                Thank you — I'll be in touch very soon.
                            </p>
                        ) : showInterest ? (
                            <form onSubmit={submitInterest} className="mt-5 space-y-3 text-left">
                                <input
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    required
                                    placeholder="Your email or phone"
                                    className="h-11 w-full rounded-none border border-input bg-background px-3 font-body text-sm outline-none focus:border-primary"
                                />
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Anything you'd like to add? (optional)"
                                    className="min-h-24 w-full rounded-none border border-input bg-background px-3 py-2 font-body text-sm outline-none focus:border-primary"
                                />
                                <button
                                    type="submit"
                                    disabled={sendingInterest}
                                    className="inline-flex h-12 w-full items-center justify-center bg-accent font-body text-xs uppercase tracking-[0.18em] text-accent-foreground disabled:opacity-60"
                                >
                                    {sendingInterest ? "Sending…" : "Send"}
                                </button>
                            </form>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowInterest(true)}
                                className="mt-6 inline-flex h-12 items-center justify-center bg-foreground px-8 font-body text-xs uppercase tracking-[0.18em] text-background"
                            >
                                I'm interested
                            </button>
                        )}
                    </div>
                </div>

                {data.media.length > 0 && (
                    <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
                        {data.media.map((item) => {
                            const isVerticalVideo =
                                item.kind === "video" && (!item.width || !item.height || item.height >= item.width);

                            if (isVerticalVideo) {
                                return (
                                    <div key={item.id} className="w-44 shrink-0 sm:w-56 lg:w-72">
                                        <PhoneFrame
                                            showReelChrome={false}
                                            className="shadow-[0_20px_45px_-18px_rgba(0,0,0,0.55)]"
                                        >
                                            <PreviewVideo media={item} />
                                            <span aria-hidden className="pointer-events-none absolute inset-0 z-30" style={wm} />
                                        </PhoneFrame>
                                    </div>
                                );
                            }

                            return (
                                <figure
                                    key={item.id}
                                    className="group relative aspect-[3/4] w-36 shrink-0 select-none overflow-hidden bg-muted sm:w-44 lg:w-48"
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    {item.kind === "video" ? (
                                        <PreviewVideo media={item} />
                                    ) : (
                                        <>
                                            <img
                                                src={item.url}
                                                alt={item.title}
                                                loading="lazy"
                                                decoding="async"
                                                {...protectedImageProps}
                                                className="absolute inset-0 h-full w-full object-cover"
                                            />
                                            <PhotoProtectionOverlay />
                                        </>
                                    )}
                                    {/* watermark overlay */}
                                    <span aria-hidden className="pointer-events-none absolute inset-0 z-30" style={wm} />
                                </figure>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientPreview;
