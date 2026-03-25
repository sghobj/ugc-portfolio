import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Sparkles } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { UgcWorkContent } from "@/hooks/useUgcContent";
import { buildCloudinaryImageUrl, isCloudinaryUrl } from "@/lib/cloudinary";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PhotoProtectionOverlay, protectedImageProps } from "@/components/PhotoProtection";

type PortfolioSectionProps = {
    myWork?: UgcWorkContent;
};

type MediaOrientation = "portrait" | "landscape" | "square";

type Project = {
    id: string;
    image: string;
    title: string;
    description: string;
    categories: string[];
    orientation: MediaOrientation;
    width?: number;
    height?: number;
};

const PHOTOS_PER_SLIDE = 6;
const GRID_IMAGE_WIDTHS = [640, 960, 1280];
const GRID_IMAGE_SIZES = "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw";

const getOrientation = (width?: number, height?: number): MediaOrientation => {
    if (!width || !height || width <= 0 || height <= 0) {
        return "square";
    }

    const ratio = width / height;

    if (ratio >= 1.2) {
        return "landscape";
    }

    if (ratio <= 0.85) {
        return "portrait";
    }

    return "square";
};

const getGridImageUrl = (url: string, width: number): string => {
    return buildCloudinaryImageUrl(url, { width, crop: "limit" });
};

const getGridImageSrcSet = (url: string): string | undefined => {
    if (!isCloudinaryUrl(url)) {
        return undefined;
    }

    return GRID_IMAGE_WIDTHS
        .map((width) => `${getGridImageUrl(url, width)} ${width}w`)
        .join(", ");
};

const getGridImageSizes = (url: string): string | undefined => {
    if (!isCloudinaryUrl(url)) {
        return undefined;
    }

    return GRID_IMAGE_SIZES;
};

const chunkProjects = (projects: Project[], size: number): Project[][] => {
    const chunks: Project[][] = [];

    for (let index = 0; index < projects.length; index += size) {
        chunks.push(projects.slice(index, index + size));
    }

    return chunks;
};

const PortfolioSection = ({ myWork }: PortfolioSectionProps) => {
    const [active, setActive] = useState("All");
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(1);
    const [selectedPhoto, setSelectedPhoto] = useState<Project | null>(null);
    const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

    const sectionName = myWork?.sectionName?.trim() ?? "";
    const sectionTitle = myWork?.title?.trim() ?? "";
    const sectionText = myWork?.text?.trim() ?? "";

    const cmsPhotos = useMemo(
        () =>
            (myWork?.media ?? [])
                .filter(
                    (entry) =>
                        entry.kind === "photo" ||
                        (!entry.kind &&
                            (!entry.mime || entry.mime.toLowerCase().startsWith("image/"))),
                )
                .map((entry) => ({
                    id: entry.id,
                    image: entry.imageUrl,
                    title: entry.title,
                    description: entry.description,
                    categories: entry.categories.length > 0 ? entry.categories : ["Uncategorized"],
                    orientation: getOrientation(entry.width, entry.height),
                    width: entry.width,
                    height: entry.height,
                })),
        [myWork?.media],
    );

    const categories = useMemo(
        () => ["All", ...Array.from(new Set(cmsPhotos.flatMap((project) => project.categories)))],
        [cmsPhotos],
    );

    const filteredPhotos = useMemo(
        () =>
            active === "All"
                ? cmsPhotos
                : cmsPhotos.filter((project) => project.categories.includes(active)),
        [active, cmsPhotos],
    );

    const slides = useMemo(
        () => chunkProjects(filteredPhotos, PHOTOS_PER_SLIDE),
        [filteredPhotos],
    );

    useEffect(() => {
        if (!categories.includes(active)) {
            setActive("All");
        }
    }, [active, categories]);

    useEffect(() => {
        if (!api) {
            return;
        }

        api.scrollTo(0);
        setCurrentSlide(1);
    }, [active, api]);

    useEffect(() => {
        if (!api) {
            return;
        }

        const onSelect = () => {
            setCurrentSlide(api.selectedScrollSnap() + 1);
        };

        onSelect();
        api.on("select", onSelect);
        api.on("reInit", onSelect);

        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api]);

    useEffect(() => {
        setNaturalDimensions(null);
    }, [selectedPhoto?.id]);

    if (slides.length === 0) {
        return null;
    }

    const dialogSizeClass =
        selectedPhoto?.orientation === "landscape"
            ? "w-[96vw] max-w-[84rem]"
            : selectedPhoto?.orientation === "portrait"
                ? "w-[88vw] max-w-[48rem]"
                : "w-[90vw] max-w-[56rem]";

    return (
        <section id="portfolio" className="relative overflow-hidden py-12 lg:py-14 bg-card">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--accent)/0.1),transparent_34%),radial-gradient(circle_at_100%_0%,hsl(var(--foreground)/0.04),transparent_30%)]" />

            <div className="container relative mx-auto px-6 lg:px-16">
                {(sectionName || sectionTitle || sectionText) && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="mx-auto mb-8 max-w-2xl text-center"
                    >
                        <p className="mb-3 inline-flex items-center gap-2 border border-foreground/20 bg-foreground/[0.03] px-3 py-1.5 font-body text-[0.65rem] uppercase tracking-[0.2em] text-foreground/80">
                            <Sparkles className="h-3.5 w-3.5 text-accent" />
                            Editorial Photography
                        </p>
                        {sectionName && (
                            <p className="font-body text-[0.62rem] tracking-[0.24em] uppercase text-muted-foreground mb-2">
                                {sectionName}
                            </p>
                        )}
                        {sectionTitle && (
                            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground italic">
                                {sectionTitle}
                            </h2>
                        )}
                        {sectionText && (
                            <p className="font-body text-sm text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
                                {sectionText}
                            </p>
                        )}
                    </motion.div>
                )}

                <div className="mb-6 flex flex-wrap justify-center gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActive(category)}
                            className={`font-body text-[0.65rem] tracking-[0.15em] uppercase px-4 py-2 border transition-all duration-300 ${
                                active === category
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-background/50 text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <Carousel key={active} setApi={setApi} opts={{ align: "start", loop: false }} className="w-full">
                    <CarouselContent>
                        {slides.map((slide, slideIndex) => (
                            <CarouselItem key={`${active}-slide-${slideIndex}`}>
                                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
                                    {slide.map((project) => (
                                        <button
                                            type="button"
                                            key={project.id}
                                            onClick={() => setSelectedPhoto(project)}
                                            onContextMenu={(event) => event.preventDefault()}
                                            aria-label={`Open photo: ${project.title}`}
                                            className="group relative overflow-hidden border border-foreground/10 bg-background"
                                        >
                                            <div className="relative aspect-[4/3] w-full">
                                                <img
                                                    src={getGridImageUrl(project.image, GRID_IMAGE_WIDTHS[1])}
                                                    srcSet={getGridImageSrcSet(project.image)}
                                                    sizes={getGridImageSizes(project.image)}
                                                    alt={project.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                    {...protectedImageProps}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.03)_0%,rgba(15,15,15,0.66)_76%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                                <div className="absolute left-2 top-2">
                                                    <span className="inline-flex items-center gap-1 bg-background/90 px-2 py-1 font-body text-[0.55rem] uppercase tracking-[0.14em] text-foreground">
                                                        <Camera className="h-3 w-3 text-accent" />
                                                        Photo
                                                    </span>
                                                </div>
                                                <div className="absolute inset-0 flex items-end p-3 sm:p-4">
                                                    <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                                        <p className="font-body text-[0.55rem] tracking-[0.16em] uppercase text-primary-foreground/80">
                                                            {project.categories.join(" / ")}
                                                        </p>
                                                        <p className="font-display text-base sm:text-lg text-primary-foreground mt-1 leading-tight">
                                                            {project.title}
                                                        </p>
                                                    </div>
                                                </div>
                                                <PhotoProtectionOverlay />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {slides.length > 1 && (
                        <div className="mt-5 flex items-center justify-center gap-4">
                            <CarouselPrevious className="!static !left-auto !top-auto !translate-y-0 rounded-full h-9 w-9" />
                            <p className="font-body text-[0.65rem] tracking-[0.15em] uppercase text-muted-foreground">
                                {currentSlide} / {slides.length}
                            </p>
                            <CarouselNext className="!static !left-auto !top-auto !translate-y-0 rounded-full h-9 w-9" />
                        </div>
                    )}
                </Carousel>

                <Dialog
                    open={Boolean(selectedPhoto)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedPhoto(null);
                        }
                    }}
                >
                    <DialogContent className={`p-0 max-h-[86vh] overflow-hidden ${dialogSizeClass}`}>
                        {selectedPhoto && (
                            <div className="grid h-full max-h-[86vh] grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px]">
                                <div className="overflow-auto bg-background p-1.5">
                                    <div className="flex min-h-full w-full items-center justify-center">
                                        <div className="relative inline-block max-w-full">
                                            <img
                                                src={selectedPhoto.image}
                                                alt={selectedPhoto.title}
                                                {...protectedImageProps}
                                                className="mx-auto block h-auto w-auto max-h-[78vh] max-w-full object-contain"
                                                onLoad={(event) => {
                                                    const imageElement = event.currentTarget;
                                                    setNaturalDimensions({
                                                        width: imageElement.naturalWidth,
                                                        height: imageElement.naturalHeight,
                                                    });
                                                }}
                                            />
                                            <PhotoProtectionOverlay />
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-auto border-t border-border bg-background p-4 pt-12 md:border-l md:border-t-0 md:p-5 md:pt-12">
                                    <DialogHeader className="text-left">
                                        <DialogTitle className="font-display text-2xl font-light italic leading-tight text-foreground">
                                            {selectedPhoto.title}
                                        </DialogTitle>
                                        {selectedPhoto.description && (
                                            <div className="font-body text-sm leading-relaxed text-muted-foreground">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ children }) => (
                                                            <p className="mb-3 last:mb-0">{children}</p>
                                                        ),
                                                        ul: ({ children }) => (
                                                            <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                                                                {children}
                                                            </ul>
                                                        ),
                                                        ol: ({ children }) => (
                                                            <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                                                                {children}
                                                            </ol>
                                                        ),
                                                        li: ({ children }) => <li>{children}</li>,
                                                        strong: ({ children }) => (
                                                            <strong className="font-semibold text-foreground">
                                                                {children}
                                                            </strong>
                                                        ),
                                                        em: ({ children }) => (
                                                            <em className="italic text-foreground/90">{children}</em>
                                                        ),
                                                        h1: ({ children }) => (
                                                            <h4 className="mb-2 font-display text-xl text-foreground">
                                                                {children}
                                                            </h4>
                                                        ),
                                                        h2: ({ children }) => (
                                                            <h4 className="mb-2 font-display text-lg text-foreground">
                                                                {children}
                                                            </h4>
                                                        ),
                                                        h3: ({ children }) => (
                                                            <h5 className="mb-2 font-display text-base text-foreground">
                                                                {children}
                                                            </h5>
                                                        ),
                                                        a: ({ children, href }) => (
                                                            <a
                                                                href={href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-accent underline underline-offset-2 hover:opacity-80"
                                                            >
                                                                {children}
                                                            </a>
                                                        ),
                                                    }}
                                                >
                                                    {selectedPhoto.description}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </DialogHeader>

                                    <div className="mt-4 space-y-2.5 border-t border-border pt-3">
                                        <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                            Categories
                                        </p>
                                        <p className="font-body text-sm text-foreground">
                                            {selectedPhoto.categories.join(" / ")}
                                        </p>

                                        <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                            Original Dimensions
                                        </p>
                                        <p className="font-body text-sm text-foreground">
                                            {naturalDimensions
                                                ? `${naturalDimensions.width} x ${naturalDimensions.height}px`
                                                : selectedPhoto.width && selectedPhoto.height
                                                ? `${selectedPhoto.width} x ${selectedPhoto.height}px`
                                                : "Unknown"}
                                        </p>

                                        <p className="font-body text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                            Orientation
                                        </p>
                                        <p className="font-body text-sm capitalize text-foreground">
                                            {selectedPhoto.orientation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
};

export default PortfolioSection;
