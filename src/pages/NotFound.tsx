import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, MessageCircle } from "lucide-react";
import { brand } from "@/content/brand";

const NotFound = () => {
    const location = useLocation();

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);

    return (
        <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
            <div className="pointer-events-none absolute inset-0">
                <div
                    className="absolute inset-0 opacity-70"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 15% 20%, hsl(var(--accent) / 0.22), transparent 34%), radial-gradient(circle at 82% 70%, hsl(var(--primary) / 0.18), transparent 38%)",
                    }}
                />
                <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            </div>

            <div className="relative container mx-auto flex min-h-screen items-center px-6 py-10 lg:px-16">
                <section className="w-full rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl backdrop-blur-sm sm:p-10">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background/70 px-4 py-2">
                                <img
                                    src={brand.logoUrl}
                                    alt={brand.logoAlt}
                                    className="h-14 w-14 rounded-full border border-border/70 object-cover sm:h-16 sm:w-16"
                                    loading="lazy"
                                />
                                <p className="font-display text-lg text-foreground sm:text-xl">{brand.name}</p>
                            </div>

                            <p className="font-display text-[6.5rem] leading-none tracking-[-0.06em] text-transparent bg-gradient-to-r from-foreground/35 via-foreground/15 to-foreground/5 bg-clip-text sm:text-[8.5rem] lg:text-[11rem]">
                                404
                            </p>

                            <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                The page drifted off route.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <p className="font-body text-xs uppercase tracking-[0.3em] text-accent">Page not found</p>
                            <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
                                This route does not exist.
                            </h1>
                            <p className="max-w-xl font-body text-base leading-relaxed text-muted-foreground">
                                The URL{" "}
                                <span className="font-semibold text-foreground">{location.pathname}</span> is not
                                available. Try returning to the homepage or jump directly to the contact section.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="/"
                                    className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 font-body text-xs uppercase tracking-[0.16em] text-background transition hover:opacity-85"
                                >
                                    <Home className="h-4 w-4" />
                                    Return Home
                                </a>
                                <a
                                    href="/#contact"
                                    className="inline-flex items-center gap-2 rounded-md border border-foreground px-6 py-3 font-body text-xs uppercase tracking-[0.16em] text-foreground transition hover:bg-foreground hover:text-background"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Contact
                                </a>
                            </div>

                            <a
                                href="/"
                                className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.16em] text-muted-foreground transition hover:text-foreground"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to portfolio
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default NotFound;
