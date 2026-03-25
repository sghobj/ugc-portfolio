import { useMemo } from "react";
import { motion } from "framer-motion";
import { Camera, Video, Package, type LucideIcon } from "lucide-react";
import type { UgcServicesContent } from "@/hooks/useUgcContent";

type ServicesSectionProps = {
    myServices?: UgcServicesContent;
};

type ServiceCard = {
    id: string;
    icon: LucideIcon;
    name?: string;
    description?: string;
    includes: string[];
    featured?: boolean;
};

const defaultIcons: LucideIcon[] = [Camera, Video, Package];

const stripMarkdownInline = (value: string): string => {
    return value
        .replace(/!\[([^\]]*)]\([^)]+\)/g, "$1")
        .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
        .replace(/[_*`~]/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

const parseDetailsMarkdown = (
    markdown: string,
): { name?: string; description?: string; includes: string[] } => {
    const lines = markdown
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return { includes: [] };
    }

    let cursor = 0;
    let name: string | undefined;

    const headingMatch = lines[0].match(/^#{1,6}\s+(.+)$/);
    const boldHeadingMatch = lines[0].match(/^\*\*(.+)\*\*$/);

    if (headingMatch?.[1]) {
        name = stripMarkdownInline(headingMatch[1]) || undefined;
        cursor = 1;
    } else if (boldHeadingMatch?.[1]) {
        name = stripMarkdownInline(boldHeadingMatch[1]) || undefined;
        cursor = 1;
    }

    const descriptionLines: string[] = [];
    const includes: string[] = [];

    for (const rawLine of lines.slice(cursor)) {
        const bulletMatch = rawLine.match(/^[-*+]\s+(.+)$/) ?? rawLine.match(/^\d+\.\s+(.+)$/);

        if (bulletMatch?.[1]) {
            includes.push(stripMarkdownInline(bulletMatch[1]));
            continue;
        }

        if (/^includes?:\s*/i.test(rawLine)) {
            const includeText = rawLine.replace(/^includes?:\s*/i, "");
            if (includeText) {
                includes.push(stripMarkdownInline(includeText));
            }
            continue;
        }

        descriptionLines.push(stripMarkdownInline(rawLine));
    }

    return {
        name,
        description: descriptionLines.join(" ").trim() || undefined,
        includes: includes.filter(Boolean),
    };
};

const ServicesSection = ({ myServices }: ServicesSectionProps) => {
    const sectionName = myServices?.sectionName?.trim() ?? "";
    const sectionTitle = myServices?.title?.trim() ?? "";

    const cmsPackages = useMemo<ServiceCard[]>(() => {
        return (
            myServices?.service
                .map((service, index) => {
                    const details = parseDetailsMarkdown(service.serviceDetails);
                    const icon = defaultIcons[index % defaultIcons.length];

                    return {
                        id: service.id,
                        icon,
                        name: details.name,
                        description: details.description,
                        includes: details.includes,
                        featured: index === 2,
                    };
                })
                .filter(
                    (service) =>
                        Boolean(service.name) ||
                        Boolean(service.description) ||
                        service.includes.length > 0,
                ) || []
        );
    }, [myServices]);

    if (cmsPackages.length === 0) {
        return null;
    }

    return (
        <section id="services" className="py-16 lg:py-20">
            <div className="container mx-auto px-6 lg:px-16">
                {(sectionName || sectionTitle) && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="text-center mb-10"
                    >
                        {sectionName && (
                            <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-3">
                                {sectionName}
                            </p>
                        )}
                        {sectionTitle && (
                            <h2 className="font-display text-4xl sm:text-5xl font-light text-foreground italic">
                                {sectionTitle}
                            </h2>
                        )}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 lg:gap-5">
                    {cmsPackages.map((pkg, i) => (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className={`flex h-full flex-col border p-5 transition-all duration-300 hover:-translate-y-1 lg:p-6 ${
                                pkg.featured
                                    ? "bg-foreground text-primary-foreground border-foreground"
                                    : "bg-background border-border hover:border-accent"
                            }`}
                        >
                            <pkg.icon className="w-6 h-6 mb-4 text-accent" strokeWidth={1.5} />
                            {pkg.name && <h3 className="font-display text-2xl mb-2">{pkg.name}</h3>}
                            <div className="flex-1">
                                {pkg.description && (
                                    <p
                                        className={`font-body text-sm leading-relaxed mb-4 ${
                                            pkg.featured
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {pkg.description}
                                    </p>
                                )}
                                {pkg.includes.length > 0 && (
                                    <ul className="space-y-1.5">
                                        {pkg.includes.map((item) => (
                                            <li
                                                key={item}
                                                className={`font-body text-sm flex items-center gap-2 ${
                                                    pkg.featured
                                                        ? "text-primary-foreground/80"
                                                        : "text-muted-foreground"
                                                }`}
                                            >
                                                <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <a
                                href="#contact"
                                className={`mt-6 inline-block self-start px-5 py-2.5 font-body text-sm uppercase tracking-wider transition-all ${
                                    pkg.featured
                                        ? "bg-accent text-accent-foreground hover:opacity-80"
                                        : "border border-foreground text-foreground hover:bg-foreground hover:text-background"
                                }`}
                            >
                                Let&apos;s Talk
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
