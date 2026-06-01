import { brand } from "@/content/brand";

const footerLinks = [
    { href: "/", label: "Home" },
    { href: "/#contact", label: "Contact" },
    { href: "/impressum", label: "Impressum" },
    { href: "/datenschutz", label: "Privacy" },
];

export const SiteFooter = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-border/60 py-6">
            <div className="container mx-auto flex flex-col gap-4 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-16">
                <div className="flex items-center gap-2 text-left font-body text-xs tracking-wider text-muted-foreground">
                    <img
                        src={brand.logoUrl}
                        alt={brand.logoAlt}
                        className="h-6 w-6 rounded-full border border-border/70 object-cover"
                        loading="lazy"
                    />
                    <span>(c) {currentYear} {brand.name}. All rights reserved.</span>
                </div>

                <nav className="flex flex-wrap items-center gap-4 font-body text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {footerLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            </div>
        </footer>
    );
};
