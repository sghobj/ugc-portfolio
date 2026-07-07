import type { ReactNode } from "react";
import { Heart, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type PhoneFrameProps = {
    /** The media to render inside the screen (video or protected img). Fills the frame. */
    children: ReactNode;
    /**
     * Show the lightweight Instagram-Reel chrome (dynamic island + bottom control row).
     * Turn this off while a video is actively playing so nothing covers the footage.
     */
    showReelChrome?: boolean;
    className?: string;
};

/**
 * Elegant iPhone-style mockup used to present vertical UGC videos as native
 * Instagram Reels. Chrome is intentionally minimal and number-free — it reads as
 * "this is Instagram content" without fabricating reach metrics.
 */
export const PhoneFrame = ({ children, showReelChrome = true, className }: PhoneFrameProps) => {
    return (
        <div
            className={cn(
                "relative mx-auto aspect-[9/19] w-full rounded-[2.4rem] bg-neutral-900 p-[0.4rem] shadow-[0_28px_60px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/40",
                className,
            )}
        >
            {/* subtle side buttons */}
            <span className="absolute -left-[2px] top-24 h-10 w-[2px] rounded-full bg-neutral-700" aria-hidden="true" />
            <span className="absolute -right-[2px] top-20 h-14 w-[2px] rounded-full bg-neutral-700" aria-hidden="true" />

            <div className="relative h-full w-full overflow-hidden rounded-[2.05rem] bg-black">
                {/* media */}
                <div className="absolute inset-0 [&>*]:h-full [&>*]:w-full [&>img]:object-cover [&>video]:object-cover">
                    {children}
                </div>

                {/* dynamic island */}
                <div className="pointer-events-none absolute left-1/2 top-2 z-30 h-[1.05rem] w-[4.2rem] -translate-x-1/2 rounded-full bg-black/90" aria-hidden="true" />

                {showReelChrome && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
                        <div className="h-16 bg-gradient-to-t from-black/55 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3 pb-2.5">
                            {/* progress bar */}
                            <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                                <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-white/90" />
                            </span>
                            <Heart className="h-4 w-4 text-white drop-shadow" strokeWidth={1.75} />
                            <Send className="h-4 w-4 text-white drop-shadow" strokeWidth={1.75} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneFrame;
