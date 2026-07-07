import { motion } from "framer-motion";
import type { UgcBrandContent } from "@/hooks/useUgcContent";

const BrandMark = ({ brand }: { brand: UgcBrandContent }) => {
    const inner = brand.logoUrl ? (
        <img
            src={brand.logoUrl}
            alt={brand.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-90 grayscale transition-all duration-700 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0"
        />
    ) : (
        <span className="px-4 font-display text-xl font-light leading-tight text-foreground sm:text-2xl">
            {brand.name.slice(0, 2)}
        </span>
    );

    return (
        <div className="group flex min-w-[11rem] flex-col items-center text-center">
            <div className="relative flex h-[7.25rem] w-[7.25rem] items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-background shadow-[0_18px_45px_rgba(67,55,47,0.10)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_22px_55px_rgba(154,94,58,0.16)] sm:h-[8rem] sm:w-[8rem]">
                {inner}
            </div>
            <span className="mt-3 max-w-[14rem] text-balance font-body text-[0.55rem] font-medium uppercase tracking-[0.14em] text-foreground/80">
                {brand.name}
            </span>
            {(brand.location || brand.category) && (
                <span className="mt-1 max-w-[14rem] text-balance font-body text-[0.5rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {brand.location || brand.category}
                </span>
            )}
        </div>
    );
};

type BrandsSectionProps = {
    brands: UgcBrandContent[];
};

const BrandsSection = ({ brands }: BrandsSectionProps) => {
    if (brands.length === 0) {
        return null;
    }

    return (
        <section id="brands" className="relative border-b border-border/60 bg-secondary/40 py-9 lg:py-11">
            <div className="container relative mx-auto px-6 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="flex flex-wrap items-end justify-between gap-4"
                >
                    <p className="font-body text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
                        Selected Collaborations
                    </p>
                    <p className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                        Trusted by hotels and hospitality brands
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="mt-8 flex flex-wrap items-start justify-center gap-x-8 gap-y-8 sm:gap-x-12 lg:gap-x-14"
                >
                    {brands.map((brand) =>
                        brand.website ? (
                            <a
                                key={brand.id}
                                href={brand.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-transform duration-300 hover:-translate-y-0.5"
                            >
                                <BrandMark brand={brand} />
                            </a>
                        ) : (
                            <BrandMark key={brand.id} brand={brand} />
                        ),
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default BrandsSection;
