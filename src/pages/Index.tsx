import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CinematicVideoSection from "@/components/CinematicVideoSection";
import ContactSection from "@/components/ContactSection";
// import ServicesSection from "@/components/ServiceSection.tsx";
import { DataStateNotice } from "@/components/DataStateNotice";
import { useUgcContent } from "@/hooks/useUgcContent";
import PortfolioShowcase from "@/components/PortfolioShowcase";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useTestimonials } from "@/hooks/useTestimonials";
import { brand } from "@/content/brand";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

const HASH_SCROLL_RETRY_LIMIT = 30;
const FIXED_HEADER_OFFSET = 72;

const HASH_SCROLL_RETRY_LIMIT = 30;
const FIXED_HEADER_OFFSET = 72;

const Index = () => {
    const location = useLocation();
    const { content, isLoading, error } = useUgcContent();
    const { testimonials, isLoading: isTestimonialsLoading, error: testimonialsError } = useTestimonials();
    const hasTestimonials = testimonials.length > 0;

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!location.hash) {
            return;
        }

        const targetId = decodeURIComponent(location.hash.slice(1)).trim();
        if (!targetId) {
            return;
        }

        const scrollToHashTarget = (): boolean => {
            if (targetId.toLowerCase() === "home") {
                window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                return true;
            }

            const target = document.getElementById(targetId);
            if (!target) {
                return false;
            }

            const top = target.getBoundingClientRect().top + window.scrollY - FIXED_HEADER_OFFSET;
            window.scrollTo({ top: Math.max(top, 0), behavior: "auto" });
            return true;
        };

        let rafId = 0;
        let attempts = 0;
        const retryScroll = () => {
            if (scrollToHashTarget()) {
                return;
            }

            attempts += 1;
            if (attempts < HASH_SCROLL_RETRY_LIMIT) {
                rafId = window.requestAnimationFrame(retryScroll);
            }
        };

        rafId = window.requestAnimationFrame(retryScroll);

        return () => {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
            }
        };
    }, [location.hash, isLoading, hasTestimonials, isTestimonialsLoading]);

    return (
        <div id="home" className="bg-background text-foreground">
            <Navbar showTestimonials={hasTestimonials} />
            {error && (
                <DataStateNotice
                    tone="error"
                    message="Strapi GraphQL content failed to load."
                />
            )}
            {isLoading ? (
                <div className="flex min-h-[60vh] items-center justify-center" aria-live="polite">
                    <div
                        className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
                        role="status"
                        aria-label="Loading content"
                    />
                </div>
            ) : (
                <>
                    <HeroSection hero={content.hero} />
                    <CinematicVideoSection myWork={content.myWork} />
                    {/*<PortfolioSection myWork={content.myWork} />*/}
                    <PortfolioShowcase myWork={content.myWork} showcase={content.showcase} />
                    {/* Temporarily hidden services section */}
                    {/* <ServicesSection myServices={content.myServices} /> */}
                    {hasTestimonials ? (
                        <TestimonialsSection
                            testimonials={testimonials}
                            isLoading={isTestimonialsLoading}
                            error={testimonialsError}
                        />
                    ) : null}
                    <ContactSection />
                    <footer className="py-6">
                        <div className="flex items-center justify-center gap-2 text-center font-body text-xs text-muted-foreground tracking-wider">
                            <img
                                src={brand.logoUrl}
                                alt={brand.logoAlt}
                                className="h-6 w-6 rounded-full border border-border/70 object-cover"
                                loading="lazy"
                            />
                            <span>(c) 2026 Sarah Ghobj. All rights reserved.</span>
                        </div>
                    </footer>
                </>
            )}
            <ScrollToTopButton />
        </div>
    );
};

export default Index;
