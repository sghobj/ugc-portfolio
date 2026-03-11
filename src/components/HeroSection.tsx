import { motion } from "framer-motion";
import heroImage from "@/assets/hero-portrait.jpg";
import type { UgcHeroContent } from "@/hooks/useUgcContent";

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
        <section className="min-h-screen flex items-center relative overflow-hidden">
            <div className="container mx-auto px-6 lg:px-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
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
                            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-light leading-[0.9] text-foreground mb-6">
                                {firstName}
                                {lastName && (
                                    <>
                                        <br />
                                        <span className="italic font-light">{lastName}</span>
                                    </>
                                )}
                            </h1>
                        )}
                        {description && (
                            <p className="font-body text-base text-muted-foreground max-w-md leading-relaxed mb-8">
                                {description}
                            </p>
                        )}
                        <div className="flex gap-4">
                            <a
                                href="#contact"
                                className="inline-block bg-foreground text-background font-body text-sm tracking-wider uppercase px-8 py-4 hover:opacity-80 transition-opacity"
                            >
                                Work With Me
                            </a>
                            <a
                                href="#portfolio"
                                className="inline-block border border-foreground text-foreground font-body text-sm tracking-wider uppercase px-8 py-4 hover:bg-foreground hover:text-background transition-all"
                            >
                                View Work
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
                            <div className="aspect-[3/4] overflow-hidden">
                                <img
                                    src={heroImage}
                                    alt="Sarah Ghobj - UGC Creator and Photographer"
                                    className="w-full h-full object-cover"
                                />
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
