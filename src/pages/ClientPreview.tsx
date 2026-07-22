import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js";
import { Globe, Instagram, Loader2, Lock, Play } from "lucide-react";
import { env } from "@/config/env";
import { PhotoProtectionOverlay, protectedImageProps } from "@/components/PhotoProtection";
import { MarkdownContent } from "@/components/MarkdownContent";

const INSTAGRAM_URL = "https://instagram.com/sarah_ghobj";
const PORTFOLIO_URL = "https://ugc.sarah-ghobj.com";

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

const watermarkStyle = (text: string): React.CSSProperties => {
    if (!text) {
        return {};
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='190'><text x='10' y='110' transform='rotate(-28 10 110)' fill='rgba(255,255,255,0.34)' font-family='Arial, sans-serif' font-size='15' font-weight='600'>${text.replace(/[<>&]/g, "")}</text></svg>`;
    return {
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        backgroundRepeat: "repeat",
    };
};

const PreviewVideo = ({ media }: { media: PreviewMedia }) => {
    const [playing, setPlaying] = useState(false);
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

    return (
        <div className="relative h-full w-full" onContextMenu={(e) => e.preventDefault()}>
            <video
                ref={videoRef}
                poster={media.poster || undefined}
                playsInline
                loop
                controls={playing}
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                preload="none"
                className="h-full w-full bg-black object-cover"
            />
            {!playing && (
                <button
                    type="button"
                    onClick={start}
                    aria-label="Play"
                    className="absolute inset-0 grid place-items-center"
                >
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-white/70 bg-black/35 text-white backdrop-blur-sm">
                        <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                    </span>
                </button>
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
    const wm = watermarkStyle(data.watermark);

    return (
        <div className="min-h-screen bg-background text-foreground" onContextMenu={(e) => e.preventDefault()}>
            <div className="mx-auto max-w-5xl px-6 py-14 lg:py-20">
                <header className="mx-auto max-w-2xl text-center">
                    <p className="font-body text-sm uppercase tracking-[0.22em] text-muted-foreground">
                        A preview for {data.clientName || "you"}
                    </p>
                    <h1 className="mt-2 font-display text-4xl font-light italic leading-tight sm:text-5xl">
                        {data.title}
                    </h1>
                    {data.intro && (
                        <MarkdownContent
                            content={data.intro}
                            className="mx-auto mt-4 max-w-xl text-left font-body text-base leading-relaxed text-muted-foreground"
                        />
                    )}
                    <p className="mt-4 inline-flex items-center gap-1.5 font-body text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Private · view-only sample
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-4">
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

                <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4">
                    {data.media.map((item) => (
                        <figure
                            key={item.id}
                            className="group relative aspect-[3/4] select-none overflow-hidden bg-muted"
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
                    ))}
                </div>

                <div className="mx-auto mt-14 max-w-xl rounded-lg border border-border bg-card/60 p-6 text-center sm:p-8">
                        {data.offer && (
                            <>
                                <p className="font-body text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
                                    The offer
                                </p>
                                <MarkdownContent
                                    content={data.offer}
                                    className="mt-3 text-left font-body text-sm leading-relaxed text-foreground"
                                />
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
        </div>
    );
};

export default ClientPreview;
