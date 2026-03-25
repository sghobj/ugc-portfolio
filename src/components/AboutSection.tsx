import { motion } from "framer-motion";
import type { UgcSectionContent } from "@/hooks/useUgcContent";

type AboutSectionProps = {
    aboutMe?: UgcSectionContent;
};

const AboutSection = ({ aboutMe }: AboutSectionProps) => {
    const sectionName = aboutMe?.sectionName?.trim() ?? "";
    const title = aboutMe?.title?.trim() ?? "";
    const text = aboutMe?.text?.trim() ?? "";

    if (!sectionName && !title && !text) {
        return null;
    }

    return (
        <section id="about" className="py-16 lg:py-20">
            <div className="container mx-auto px-6 lg:px-16">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        {sectionName && (
                            <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-4">
                                {sectionName}
                            </p>
                        )}
                        {title && (
                            <h2 className="font-display text-4xl sm:text-5xl font-light text-foreground mb-6 italic">
                                {title}
                            </h2>
                        )}
                        {text && (
                            <p className="font-body text-base text-muted-foreground leading-relaxed">
                                {text}
                            </p>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="grid grid-cols-3 gap-5 mt-10 pt-10 border-t border-border"
                    >
                        {[
                            { number: "6+", label: "Content Categories" },
                            { number: "Unlimited", label: "Creative Ideas" },
                            { number: "100%", label: "Passion Driven" },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <p className="font-display text-3xl sm:text-4xl text-foreground font-light">
                                    {stat.number}
                                </p>
                                <p className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mt-1.5">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
