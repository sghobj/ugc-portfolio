import { motion } from "framer-motion";
import { Instagram, Mail, ArrowUpRight } from "lucide-react";

const ContactSection = () => {
    return (
        <section id="contact" className="py-24 lg:py-32 bg-foreground text-primary-foreground">
    <div className="container mx-auto px-6 lg:px-16">
    <div className="max-w-2xl mx-auto text-center">
    <motion.div
        initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.7 }}
>
    <p className="font-body text-sm tracking-[0.3em] uppercase text-accent mb-6">
        Let's Create
    </p>
    <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light italic mb-6">
        Ready to elevate your brand?
        </h2>
        <p className="font-body text-base text-primary-foreground/60 leading-relaxed mb-10">
            I'd love to hear about your brand and vision. Reach out and let's create
    content that makes your audience stop scrolling.
    </p>
    <a
    href="mailto:sarah.ghobj@hotmail.com"
    className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-body text-sm tracking-wider uppercase px-10 py-4 hover:opacity-80 transition-opacity"
        >
        Get In Touch
    <ArrowUpRight className="w-4 h-4" />
        </a>

        <div className="flex items-center justify-center gap-8 mt-16 pt-8 border-t border-primary-foreground/10">
    <a
        href="https://instagram.com/sarah_ghobj"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 font-body text-sm text-primary-foreground/50 hover:text-accent transition-colors"
    >
    <Instagram className="w-4 h-4" />
        Instagram
        </a>
        <a
    href="mailto:sarah.ghobj@hotmail.com"
    className="flex items-center gap-2 font-body text-sm text-primary-foreground/50 hover:text-accent transition-colors"
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
