import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Camera, Video, Package, type LucideIcon } from "lucide-react";
import type { UgcServicesContent } from "@/hooks/useUgcContent";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { submitServiceInquiry } from "@/lib/api/serviceInquiryApi";
import {
    OPEN_SERVICE_INQUIRY_EVENT,
    type OpenServiceInquiryEventDetail,
} from "@/lib/serviceInquiryDialog";

type ServicesSectionProps = {
    myServices?: UgcServicesContent;
};

type ServiceCard = {
    id: string;
    icon: LucideIcon;
    name?: string;
    description?: string;
    includes: string[];
    addOns: string[];
    cta?: string;
    featured?: boolean;
};

type ServiceInquiryFormState = {
    service: string;
    name: string;
    email: string;
    company: string;
    budget: string;
    timeline: string;
    message: string;
    website: string;
};

const defaultIcons: LucideIcon[] = [Camera, Video, Package];
const DEFAULT_SERVICE_OPTION = "General Inquiry";

const createEmptyInquiryForm = (service = ""): ServiceInquiryFormState => ({
    service,
    name: "",
    email: "",
    company: "",
    budget: "",
    timeline: "",
    message: "",
    website: "",
});

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
): {
    name?: string;
    description?: string;
    includes: string[];
    addOns: string[];
    cta?: string;
} => {
    const lines = markdown
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return { includes: [], addOns: [] };
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
    const addOns: string[] = [];
    let cta: string | undefined;

    for (const rawLine of lines.slice(cursor)) {
        const ctaMatch = rawLine.match(/^cta:\s*(.+)$/i);
        if (ctaMatch?.[1]) {
            const ctaText = stripMarkdownInline(ctaMatch[1]);
            if (ctaText) {
                cta = ctaText;
            }
            continue;
        }

        const addOnMatch = rawLine.match(/^add-?ons?:\s*(.+)$/i);
        if (addOnMatch?.[1]) {
            const addOnText = stripMarkdownInline(addOnMatch[1]);
            if (addOnText) {
                addOns.push(addOnText);
            }
            continue;
        }

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
        addOns: addOns.filter(Boolean),
        cta,
    };
};

const ServicesSection = ({ myServices }: ServicesSectionProps) => {
    const sectionName = myServices?.sectionName?.trim() ?? "";
    const sectionTitle = myServices?.title?.trim() ?? "";
    const [isInquiryOpen, setIsInquiryOpen] = useState(false);
    const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
    const [inquiryErrorMessage, setInquiryErrorMessage] = useState<string | null>(null);
    const [inquirySuccessMessage, setInquirySuccessMessage] = useState<string | null>(null);
    const [inquiryForm, setInquiryForm] = useState<ServiceInquiryFormState>(() =>
        createEmptyInquiryForm(DEFAULT_SERVICE_OPTION),
    );

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
                        addOns: details.addOns,
                        cta: details.cta,
                        featured: index === 2,
                    };
                })
                .filter(
                    (service) =>
                        Boolean(service.name) ||
                        Boolean(service.description) ||
                        service.includes.length > 0 ||
                        service.addOns.length > 0,
                ) || []
        );
    }, [myServices]);

    const openInquiryDialog = useCallback((serviceName?: string) => {
        const resolvedService = serviceName?.trim() || DEFAULT_SERVICE_OPTION;
        setInquiryForm(createEmptyInquiryForm(resolvedService));
        setInquiryErrorMessage(null);
        setInquirySuccessMessage(null);
        setIsInquiryOpen(true);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const handleOpenInquiry = (event: Event) => {
            const customEvent = event as CustomEvent<OpenServiceInquiryEventDetail | undefined>;
            openInquiryDialog(customEvent.detail?.service);
        };

        window.addEventListener(OPEN_SERVICE_INQUIRY_EVENT, handleOpenInquiry as EventListener);

        return () => {
            window.removeEventListener(OPEN_SERVICE_INQUIRY_EVENT, handleOpenInquiry as EventListener);
        };
    }, [openInquiryDialog]);

    const handleInquirySubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        setIsSubmittingInquiry(true);
        setInquiryErrorMessage(null);
        setInquirySuccessMessage(null);

        try {
            await submitServiceInquiry({
                service: inquiryForm.service,
                name: inquiryForm.name,
                email: inquiryForm.email,
                company: inquiryForm.company,
                budget: inquiryForm.budget,
                timeline: inquiryForm.timeline,
                message: inquiryForm.message,
                website: inquiryForm.website,
                pageUrl: typeof window !== "undefined" ? window.location.href : "",
            });

            setInquiryForm((current) => createEmptyInquiryForm(current.service));
            setInquirySuccessMessage("Thanks. Your inquiry was sent successfully.");
        } catch (submitError) {
            setInquiryErrorMessage(
                submitError instanceof Error && submitError.message
                    ? submitError.message
                    : "Could not send inquiry. Please try again.",
            );
        } finally {
            setIsSubmittingInquiry(false);
        }
    };

    return (
        <>
            {cmsPackages.length > 0 && (
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
                                    <div className="flex flex-1 flex-col">
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
                                        {pkg.addOns.length > 0 && (
                                            <div className="mt-auto pt-6">
                                            <div
                                                className={`border-t pt-5 ${
                                                    pkg.featured ? "border-primary-foreground/15" : "border-border"
                                                }`}
                                            >
                                                <p
                                                    className={`mb-2 font-body text-[0.62rem] uppercase tracking-[0.18em] ${
                                                        pkg.featured ? "text-primary-foreground/60" : "text-muted-foreground/80"
                                                    }`}
                                                >
                                                    Paid add-ons
                                                </p>
                                                <ul className="space-y-1">
                                                    {pkg.addOns.map((item) => (
                                                        <li
                                                            key={item}
                                                            className={`font-body text-xs leading-relaxed flex items-start gap-2 ${
                                                                pkg.featured
                                                                    ? "text-primary-foreground/70"
                                                                    : "text-muted-foreground"
                                                            }`}
                                                        >
                                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-accent/70 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openInquiryDialog(pkg.name)}
                                        className={`mt-6 inline-block self-start px-5 py-2.5 font-body text-sm uppercase tracking-wider transition-all ${
                                            pkg.featured
                                                ? "bg-accent text-accent-foreground hover:opacity-80"
                                                : "border border-foreground text-foreground hover:bg-foreground hover:text-background"
                                        }`}
                                    >
                                        {pkg.cta || "Let's Talk"}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Dialog
                open={isInquiryOpen}
                onOpenChange={(open) => {
                    setIsInquiryOpen(open);
                    if (!open) {
                        setInquiryErrorMessage(null);
                        setInquirySuccessMessage(null);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                    <DialogHeader>
                        <DialogTitle className="font-display text-3xl font-light italic">
                            Let&apos;s Talk
                        </DialogTitle>
                        <DialogDescription className="font-body text-sm leading-relaxed text-muted-foreground">
                            Share your project details and I&apos;ll reply directly by email.
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={(event) => void handleInquirySubmit(event)}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground"
                                        htmlFor="inquiry-name"
                                    >
                                        Name
                                    </label>
                                    <input
                                        id="inquiry-name"
                                        value={inquiryForm.name}
                                        onChange={(event) =>
                                            setInquiryForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        required
                                        maxLength={90}
                                        className="h-11 w-full rounded-none border border-input bg-background px-3 font-body text-sm text-foreground outline-none transition focus:border-primary"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground"
                                        htmlFor="inquiry-email"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="inquiry-email"
                                        type="email"
                                        value={inquiryForm.email}
                                        onChange={(event) =>
                                            setInquiryForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                        required
                                        maxLength={180}
                                        className="h-11 w-full rounded-none border border-input bg-background px-3 font-body text-sm text-foreground outline-none transition focus:border-primary"
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground"
                                        htmlFor="inquiry-company"
                                    >
                                        Company / Brand (optional)
                                    </label>
                                    <input
                                        id="inquiry-company"
                                        value={inquiryForm.company}
                                        onChange={(event) =>
                                            setInquiryForm((current) => ({
                                                ...current,
                                                company: event.target.value,
                                            }))
                                        }
                                        maxLength={140}
                                        className="h-11 w-full rounded-none border border-input bg-background px-3 font-body text-sm text-foreground outline-none transition focus:border-primary"
                                        placeholder="Brand name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label
                                        className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground"
                                        htmlFor="inquiry-budget"
                                    >
                                        Budget (optional)
                                    </label>
                                    <input
                                        id="inquiry-budget"
                                        value={inquiryForm.budget}
                                        onChange={(event) =>
                                            setInquiryForm((current) => ({
                                                ...current,
                                                budget: event.target.value,
                                            }))
                                        }
                                        maxLength={80}
                                        className="h-11 w-full rounded-none border border-input bg-background px-3 font-body text-sm text-foreground outline-none transition focus:border-primary"
                                        placeholder="$500 - $1,500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground"
                                    htmlFor="inquiry-timeline"
                                >
                                    Timeline (optional)
                                </label>
                                <input
                                    id="inquiry-timeline"
                                    value={inquiryForm.timeline}
                                    onChange={(event) =>
                                        setInquiryForm((current) => ({
                                            ...current,
                                            timeline: event.target.value,
                                        }))
                                    }
                                    maxLength={140}
                                    className="h-11 w-full rounded-none border border-input bg-background px-3 font-body text-sm text-foreground outline-none transition focus:border-primary"
                                    placeholder="Desired delivery timeline"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground"
                                    htmlFor="inquiry-message"
                                >
                                    Project details
                                </label>
                                <textarea
                                    id="inquiry-message"
                                    value={inquiryForm.message}
                                    onChange={(event) =>
                                        setInquiryForm((current) => ({
                                            ...current,
                                            message: event.target.value,
                                        }))
                                    }
                                    required
                                    minLength={20}
                                    maxLength={2500}
                                    className="min-h-36 w-full rounded-none border border-input bg-background px-3 py-2 font-body text-sm text-foreground outline-none transition focus:border-primary"
                                    placeholder="Tell me what you need, campaign goals, deliverables, and timing."
                                />
                            </div>

                            <input
                                type="text"
                                value={inquiryForm.website}
                                onChange={(event) =>
                                    setInquiryForm((current) => ({
                                        ...current,
                                        website: event.target.value,
                                    }))
                                }
                                autoComplete="off"
                                tabIndex={-1}
                                aria-hidden="true"
                                className="hidden"
                            />

                            <button
                                type="submit"
                                disabled={isSubmittingInquiry}
                                className="inline-flex items-center gap-2 bg-foreground px-6 py-3 font-body text-xs uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmittingInquiry ? "Sending..." : "Send Inquiry"}
                            </button>
                    </form>

                    {inquirySuccessMessage ? (
                        <p className="mt-1 border border-emerald-200 bg-emerald-50 px-3 py-2 font-body text-sm text-emerald-800">
                            {inquirySuccessMessage}
                        </p>
                    ) : null}

                    {inquiryErrorMessage ? (
                        <p className="mt-1 border border-destructive/30 bg-destructive/10 px-3 py-2 font-body text-sm text-destructive">
                            {inquiryErrorMessage}
                        </p>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ServicesSection;
