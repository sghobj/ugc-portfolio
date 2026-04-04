import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER_SCROLL_Y = 320;

export const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setIsVisible(window.scrollY > SHOW_AFTER_SCROLL_Y);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    return (
        <button
            type="button"
            aria-label="Scroll back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 bg-foreground text-background shadow-lg transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            }`}
        >
            <ArrowUp className="h-4 w-4" />
        </button>
    );
};
