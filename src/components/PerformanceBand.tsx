import { motion } from "framer-motion";
import type { UgcPerformance } from "@/hooks/useUgcContent";

type PerformanceBandProps = {
    performance: UgcPerformance;
};

const compact = (value: number): string =>
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const PerformanceBand = ({ performance }: PerformanceBandProps) => {
    const stats: Array<{ label: string; value: string }> = [];
    if (performance.views != null) stats.push({ label: "Views", value: compact(performance.views) });
    if (performance.reached != null) stats.push({ label: "Accounts reached", value: compact(performance.reached) });
    if (performance.nonFollowerPct != null)
        stats.push({ label: "Non-follower reach", value: `${performance.nonFollowerPct}%` });
    if (performance.interactions != null)
        stats.push({ label: "Interactions", value: compact(performance.interactions) });
    if (performance.followers != null) stats.push({ label: "Followers", value: compact(performance.followers) });

    if (stats.length === 0) {
        return null;
    }

    return (
        <div className="relative pb-12 pt-12 lg:pb-14 lg:pt-14">
            <div className="container relative mx-auto px-6 lg:px-16">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-body text-sm uppercase tracking-[0.22em] text-[#d7c9ba]/75">
                        Content Performance
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-light italic text-[#fbf6ee] sm:text-4xl">
                        My content travels far beyond my audience
                    </h2>
                    {performance.periodLabel && (
                        <p className="mt-2 font-body text-xs uppercase tracking-[0.18em] text-[#d7c9ba]/70">
                            {performance.periodLabel}
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="mt-9 flex flex-wrap items-start justify-center gap-x-12 gap-y-8 sm:gap-x-16 lg:gap-x-20"
                >
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="font-display text-4xl font-light leading-none sm:text-5xl">
                                {stat.value}
                            </div>
                            <div className="mt-2 font-body text-[0.62rem] uppercase tracking-[0.2em] text-[#d7c9ba]/75">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {performance.note && (
                    <p className="mx-auto mt-8 max-w-xl text-center font-body text-sm leading-relaxed text-[#d7c9ba]/74">
                        {performance.note}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PerformanceBand;
