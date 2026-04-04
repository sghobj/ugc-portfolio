import { motion } from "framer-motion";
import heroImage from "@/assets/hero-portrait.jpg";
import type { UgcHeroContent } from "@/hooks/useUgcContent";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PhotoProtectionOverlay, protectedImageProps } from "@/components/PhotoProtection";

type HeroSectionProps = {
    hero?: UgcHeroContent;
};

const HeroSection = ({ hero }: HeroSectionProps) => {
    const eyebrow = hero?.title?.trim() ?? "";
    const name = hero?.name?.trim() ?? "";
    const description = hero?.text?.trim() ?? "";

    if (!eyebrow && !name && !description) {
        return null;
    }

    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    return (
        <section className="relative flex min-h-[88vh] items-center overflow-hidden pt-20 pb-12 lg:pt-24 lg:pb-16">
            <div className="container mx-auto px-6 lg:px-16">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="order-2 lg:order-1"
                    >
                        {eyebrow && (
                            <p className="font-body text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                                {eyebrow}
                            </p>
                        )}
                        {name && (
                            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light leading-[0.9] text-foreground mb-5">
                                {firstName}
                                {lastName && (
                                    <>
                                        <br className="hidden sm:block" />
                                        <span className="ml-2 italic font-light sm:ml-0">{lastName}</span>
                                    </>
                                )}
                            </h1>
                        )}
                        {description && (
                            <MarkdownContent
                                content={description}
                                className="mb-6 max-w-xl lg:max-w-2xl font-body text-base leading-relaxed text-muted-foreground text-justify"
                            />
                        )}
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="/#portfolio"
                                className="inline-block border border-foreground text-foreground font-body text-sm tracking-wider uppercase px-6 py-3 hover:bg-foreground hover:text-background transition-all"
                            >
                                View my Work
                            </a>
                            <a
                                href="/#contact"
                                className="inline-block bg-foreground text-background font-body text-sm tracking-wider uppercase px-6 py-3 hover:opacity-80 transition-opacity"
                            >
                                Work With Me
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="order-1 lg:order-2"
                    >
                        <div className="relative">
                            <div className="relative aspect-[3/4] overflow-hidden">
                                <img
                                    src={heroImage}
                                    alt="Sarah Ghobj - UGC Creator and Photographer"
                                    {...protectedImageProps}
                                    className="w-full h-full object-cover"
                                />
                                <PhotoProtectionOverlay />
                            </div>
                            <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-accent opacity-40" />
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent opacity-20" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
