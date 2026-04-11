import { motion } from "framer-motion";
import { Instagram, Mail, ArrowUpRight } from "lucide-react";
import { openServiceInquiryDialog } from "@/lib/serviceInquiryDialog";

const ContactSection = () => {
    return (
        <section id="contact" className="bg-foreground py-16 text-primary-foreground lg:py-20">
            <div className="container mx-auto px-6 lg:px-16">
                <div className="mx-auto max-w-2xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <p className="mb-4 font-body text-sm tracking-[0.3em] uppercase text-accent">
                            Let&apos;s Create
                        </p>
                        <h2 className="mb-5 font-display text-4xl sm:text-5xl lg:text-5xl font-light italic">
                            Ready to elevate your brand?
                        </h2>
                        <p className="mb-7 font-body text-base leading-relaxed text-primary-foreground/60">
                            I&apos;d love to hear about your brand and vision. Reach out and let&apos;s create content
                            that makes your audience stop scrolling.
                        </p>
                        <button
                            type="button"
                            onClick={() => openServiceInquiryDialog({ service: "General Inquiry" })}
                            className="inline-flex items-center gap-2 bg-accent px-8 py-3 font-body text-sm tracking-wider uppercase text-accent-foreground transition-opacity hover:opacity-80"
                        >
                            Get In Touch
                            <ArrowUpRight className="w-4 h-4" />
                        </button>

                        <div className="mt-10 flex items-center justify-center gap-6 border-t border-primary-foreground/10 pt-6">
                            <a
                                href="https://instagram.com/sarah_ghobj"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 font-body text-sm text-primary-foreground/50 transition-colors hover:text-accent"
                            >
                                <Instagram className="w-4 h-4" />
                                Instagram
                            </a>
                            <a
                                href="mailto:collabs@sarah-ghobj.com"
                                className="flex items-center gap-2 font-body text-sm text-primary-foreground/50 transition-colors hover:text-accent"
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
