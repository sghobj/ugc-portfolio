import { useState } from "react";
import { Menu, X } from "lucide-react";
import { brand } from "@/content/brand";

type NavbarProps = {
    showTestimonials?: boolean;
};

const Navbar = ({ showTestimonials = false }: NavbarProps) => {
    const [open, setOpen] = useState(false);
    const navLinks = [
        { label: "Work", href: "/#portfolio" },
        { label: "Services", href: "/#services" },
        ...(showTestimonials ? [{ label: "Testimonials", href: "/#testimonials" }] : []),
        { label: "Contact", href: "/#contact" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="container mx-auto px-6 lg:px-16 flex items-center justify-between h-16">
                <a href="/#home" className="flex items-center gap-2.5">
                    <img
                        src={brand.logoUrl}
                        alt={brand.logoAlt}
                        className="h-9 w-9 rounded-full border border-border/60 object-cover"
                        loading="eager"
                    />
                    <span className="font-display text-xl text-foreground tracking-wide">
                        Sarah <span className="italic">Ghobj</span>
                    </span>
                </a>

                {/* Desktop */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Mobile toggle */}
                <button
                    onClick={() => setOpen(!open)}
                    className="md:hidden text-foreground"
                    aria-label="Toggle menu"
                >
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden bg-background border-b border-border px-6 py-6 space-y-4">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="block font-body text-sm tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
