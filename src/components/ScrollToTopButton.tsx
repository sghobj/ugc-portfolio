import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER_SCROLL_Y = 320;

export const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isOverDarkSection, setIsOverDarkSection] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setIsVisible(window.scrollY > SHOW_AFTER_SCROLL_Y);
            const buttonCenterY = window.innerHeight - 24 - 22;
            const darkSection = document.getElementById("video-showcase");
            const darkSectionRect = darkSection?.getBoundingClientRect();

            setIsOverDarkSection(
                Boolean(
                    darkSectionRect &&
                        buttonCenterY >= darkSectionRect.top &&
                        buttonCenterY <= darkSectionRect.bottom,
                ),
            );
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    const colorClass = isOverDarkSection
        ? "border-primary-foreground/25 bg-primary-foreground text-foreground hover:bg-accent hover:text-accent-foreground"
        : "border-foreground/20 bg-foreground text-background hover:bg-accent hover:text-accent-foreground";

    return (
        <button
            type="button"
            aria-label="Scroll back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${colorClass} ${
                isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            }`}
        >
            <ArrowUp className="h-4 w-4" />
        </button>
    );
};
