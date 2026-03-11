import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mockPortfolioData } from "@/data/mockPortfolioData";
import type { UgcSectionContent } from "@/hooks/useUgcContent";

type PortfolioSectionProps = {
    myWork?: UgcSectionContent;
};

type Project = {
    id: string;
    image: string;
    title: string;
    category: string;
};

const allProjects: Project[] = mockPortfolioData.items.slice(0, 9).map((item) => ({
    id: item.id,
    image: item.coverImage.url,
    title: item.title,
    category: item.kind === "photo" ? (item.photoCategory ?? "Photography") : "Video",
}));

const PortfolioSection = ({ myWork }: PortfolioSectionProps) => {
    const [active, setActive] = useState("All");

    const sectionName = myWork?.sectionName?.trim() ?? "";
    const sectionTitle = myWork?.title?.trim() ?? "";
    const sectionText = myWork?.text?.trim() ?? "";

    if (allProjects.length === 0) {
        return null;
    }

    const categories = useMemo(
        () => ["All", ...Array.from(new Set(allProjects.map((project) => project.category)))],
        [],
    );

    const filtered = useMemo(
        () =>
            active === "All"
                ? allProjects
                : allProjects.filter((project) => project.category === active),
        [active],
    );

    return (
        <section id="portfolio" className="py-24 lg:py-32 bg-card">
            <div className="container mx-auto px-6 lg:px-16">
                {(sectionName || sectionTitle || sectionText) && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="text-center mb-12"
                    >
                        {sectionName && (
                            <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-4">
                                {sectionName}
                            </p>
                        )}
                        {sectionTitle && (
                            <h2 className="font-display text-4xl sm:text-5xl font-light text-foreground italic">
                                {sectionTitle}
                            </h2>
                        )}
                        {sectionText && (
                            <p className="font-body text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                                {sectionText}
                            </p>
                        )}
                    </motion.div>
                )}

                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActive(category)}
                            className={`font-body text-xs tracking-[0.15em] uppercase px-5 py-2.5 border transition-all duration-300 ${
                                active === category
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((project) => (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                                className="group cursor-pointer"
                            >
                                <div className="aspect-square overflow-hidden relative">
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-all duration-500 flex items-end p-6">
                                        <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                            <p className="font-body text-xs tracking-[0.2em] uppercase text-primary-foreground/80">
                                                {project.category}
                                            </p>
                                            <p className="font-display text-2xl text-primary-foreground mt-1">
                                                {project.title}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

export default PortfolioSection;
