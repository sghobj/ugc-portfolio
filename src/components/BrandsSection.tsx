import { motion } from "framer-motion";
import { brands, type Brand } from "@/content/brands";

const BrandMark = ({ brand }: { brand: Brand }) => {
    const inner = brand.logoUrl ? (
        <img
            src={brand.logoUrl}
            alt={brand.name}
            loading="lazy"
            decoding="async"
            className="h-12 w-auto object-contain opacity-80 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0 sm:h-14"
        />
    ) : (
        <span className="font-display text-2xl font-light leading-tight text-foreground sm:text-[1.75rem]">
            {brand.name}
        </span>
    );

    return (
        <div className="group flex flex-col items-center text-center">
            {inner}
            <span className="mt-2 font-body text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                {brand.location}
            </span>
        </div>
    );
};

const BrandsSection = () => {
    if (brands.length === 0) {
        return null;
    }

    return (
        <section id="brands" className="relative border-y border-border/60 bg-background py-14 lg:py-16">
            <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_50%_0%,hsl(var(--accent)),transparent_60%)]" />
            <div className="container relative mx-auto px-6 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="mb-3 font-body text-sm uppercase tracking-[0.22em] text-muted-foreground">
                        Selected Collaborations
                    </p>
                    <h2 className="font-display text-3xl font-light italic leading-tight text-foreground sm:text-4xl">
                        Brands I've Created Content For
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="mt-10 flex flex-wrap items-start justify-center gap-x-12 gap-y-9 sm:gap-x-20 lg:gap-x-28"
                >
                    {brands.map((brand) =>
                        brand.url ? (
                            <a
                                key={brand.name}
                                href={brand.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-transform duration-300 hover:-translate-y-0.5"
                            >
                                <BrandMark brand={brand} />
                            </a>
                        ) : (
                            <BrandMark key={brand.name} brand={brand} />
                        ),
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default BrandsSection;
