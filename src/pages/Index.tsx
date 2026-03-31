import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CinematicVideoSection from "@/components/CinematicVideoSection";
import ContactSection from "@/components/ContactSection";
import ServicesSection from "@/components/ServiceSection.tsx";
import { DataStateNotice } from "@/components/DataStateNotice";
import { useUgcContent } from "@/hooks/useUgcContent";
import PortfolioShowcase from "@/components/PortfolioShowcase";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useTestimonials } from "@/hooks/useTestimonials";

const Index = () => {
    const { content, isLoading, error } = useUgcContent();
    const { testimonials, isLoading: isTestimonialsLoading, error: testimonialsError } = useTestimonials();
    const hasTestimonials = testimonials.length > 0;

    return (
        <div className="bg-background text-foreground">
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
                    <ServicesSection myServices={content.myServices} />
                    {hasTestimonials ? (
                        <TestimonialsSection
                            testimonials={testimonials}
                            isLoading={isTestimonialsLoading}
                            error={testimonialsError}
                        />
                    ) : null}
                    <ContactSection />
                    <footer className="py-6 text-center font-body text-xs text-muted-foreground tracking-wider">
                        (c) 2026 Sarah Ghobj. All rights reserved.
                    </footer>
                </>
            )}
        </div>
    );
};

export default Index;
