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

    const profileFacts = [
        { label: "Niche Focus", value: "Travel / Hospitality / Lifestyle" },
        { label: "Content Mix", value: "UGC Video + Editorial Stills" },
        { label: "Delivery", value: "Fast, brand-safe, usage-ready" },
    ];

    const workflow = [
        "Hook-first concepts designed for short-form feeds",
        "Clean visual direction tailored to each brand voice",
        "Organized final delivery built for immediate posting",
    ];

    return (
        <section id="about" className="relative overflow-hidden py-12 lg:py-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,hsl(var(--accent)/0.1),transparent_34%),radial-gradient(circle_at_88%_10%,hsl(var(--foreground)/0.04),transparent_30%)]" />
            <div className="container relative mx-auto px-6 lg:px-16">
                <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.75 }}
                    >
                        {sectionName && (
                            <p className="mb-4 font-body text-sm tracking-[0.3em] uppercase text-muted-foreground">
                                {sectionName}
                            </p>
                        )}
                        {title && (
                            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light leading-[0.94] text-foreground mb-5">
                                {title}
                            </h2>
                        )}
                        {text && (
                            <p className="max-w-xl font-body text-base leading-relaxed text-muted-foreground mb-6">
                                {text}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <a
                                href="#contact"
                                className="inline-block border border-foreground bg-foreground px-6 py-3 font-body text-sm tracking-wider uppercase text-background transition-opacity hover:opacity-80"
                            >
                                Start a Project
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.85, delay: 0.1 }}
                        className="relative"
                    >
                        <div className="border border-foreground/15 bg-card/80 p-5 backdrop-blur-sm sm:p-6">
                            <p className="font-body text-[0.62rem] tracking-[0.22em] uppercase text-muted-foreground">
                                About Snapshot
                            </p>
                            <h3 className="mt-2 font-display text-2xl sm:text-3xl font-light italic text-foreground">
                                Crafted for premium travel and lifestyle brands.
                            </h3>
                            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {profileFacts.map((fact) => (
                                    <div key={fact.label} className="border border-border bg-background p-3">
                                        <p className="font-body text-[0.55rem] tracking-[0.14em] uppercase text-muted-foreground">
                                            {fact.label}
                                        </p>
                                        <p className="mt-1 font-body text-sm leading-relaxed text-foreground">
                                            {fact.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 border-t border-border pt-4">
                                <p className="font-body text-[0.56rem] tracking-[0.16em] uppercase text-muted-foreground">
                                    Workflow
                                </p>
                                <ul className="mt-2 space-y-1.5">
                                    {workflow.map((item) => (
                                        <li key={item} className="font-body text-sm leading-relaxed text-foreground/85">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="absolute -bottom-3 -left-3 h-20 w-20 border border-accent/40" />
                        <div className="absolute -top-3 -right-3 h-14 w-14 bg-accent/15" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
