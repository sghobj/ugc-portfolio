import { motion } from "framer-motion";
import { ArrowLeft, Instagram, Mail, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { impressum } from "@/content/impressum";

const sectionLabelClassName =
    "font-body text-xs uppercase tracking-[0.3em] text-muted-foreground";

const ImpressumPage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="pt-24">
                <section className="pb-16 lg:pb-20">
                    <div className="container mx-auto px-6 lg:px-16">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to portfolio
                        </a>

                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mt-10 max-w-3xl"
                        >
                            <p className="font-body text-sm uppercase tracking-[0.32em] text-accent">
                                {impressum.legalReference}
                            </p>
                            <h1 className="mt-4 font-display text-5xl font-light leading-[0.95] text-foreground sm:text-6xl lg:text-7xl">
                                Impressum
                            </h1>
                            <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-muted-foreground">
                                {impressum.intro}
                            </p>
                        </motion.div>

                        <motion.section
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.08 }}
                            className="mt-14 grid gap-12 border-t border-border/70 pt-10 lg:grid-cols-[1fr_0.9fr]"
                        >
                            <div className="space-y-10">
                                <div>
                                    <p className={sectionLabelClassName}>Provider</p>
                                    <h2 className="mt-3 font-display text-3xl italic text-foreground sm:text-4xl">
                                        {impressum.providerName}
                                    </h2>
                                    <div className="mt-5 space-y-3 font-body text-sm leading-relaxed text-muted-foreground">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                                            <div>
                                                {impressum.providerAddressLines.map((line) => (
                                                    <p key={line}>{line}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border/70 pt-8">
                                    <p className={sectionLabelClassName}>Editorial Responsibility</p>
                                    <p className="mt-3 font-display text-2xl italic text-foreground sm:text-3xl">
                                        {impressum.editorialResponsible}
                                    </p>
                                    <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-muted-foreground">
                                        {impressum.editorialScope}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-border/70 pt-8 lg:border-t-0 lg:border-l lg:pl-12">
                                <p className={sectionLabelClassName}>Contact</p>
                                <div className="mt-5 flex flex-col gap-4">
                                    <a
                                        href={`mailto:${impressum.contactEmail}`}
                                        className="inline-flex w-fit items-center gap-3 font-body text-sm text-foreground transition-colors hover:text-accent"
                                    >
                                        <Mail className="h-4 w-4 shrink-0 text-accent" />
                                        {impressum.contactEmail}
                                    </a>
                                    <a
                                        href={impressum.instagramUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-fit items-center gap-3 font-body text-sm text-foreground transition-colors hover:text-accent"
                                    >
                                        <Instagram className="h-4 w-4 shrink-0 text-accent" />
                                        {impressum.instagramHandle}
                                    </a>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
};

export default ImpressumPage;
