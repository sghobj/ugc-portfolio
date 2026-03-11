import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import CinematicVideoSection from "@/components/CinematicVideoSection";
import ContactSection from "@/components/ContactSection";
import ServicesSection from "@/components/ServiceSection.tsx";
import PortfolioSection from "@/components/PortfolioSection.tsx";
import { DataStateNotice } from "@/components/DataStateNotice";
import { useUgcContent } from "@/hooks/useUgcContent";

const Index = () => {
    const { content, isLoading, error } = useUgcContent();

    return (
        <div className="bg-background text-foreground">
            <Navbar />
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
                    <AboutSection aboutMe={content.aboutMe} />
                    <CinematicVideoSection myWork={content.myWork} />
                    <PortfolioSection myWork={content.myWork} />
                    <ServicesSection myServices={content.myServices} />
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
