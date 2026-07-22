import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
    content: string;
    className?: string;
    components?: Components;
};

const defaultComponents: Components = {
    p: ({ children }: { children?: ReactNode }) => <p className="mb-4 last:mb-0">{children}</p>,
    h1: ({ children }: { children?: ReactNode }) => (
        <h3 className="mb-2 mt-6 font-display text-lg font-semibold text-foreground first:mt-0">{children}</h3>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
        <h3 className="mb-2 mt-6 font-display text-lg font-semibold text-foreground first:mt-0">{children}</h3>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
        <h4 className="mb-1.5 mt-5 border-t border-border/60 pt-4 font-body text-sm font-semibold uppercase tracking-[0.08em] text-foreground first:mt-0 first:border-t-0 first:pt-0">
            {children}
        </h4>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
        <ul className="mb-4 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
        <ol className="mb-4 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
    strong: ({ children }: { children?: ReactNode }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: { children?: ReactNode }) => (
        <em className="italic text-foreground/90">{children}</em>
    ),
    a: ({ children, href }: { children?: ReactNode; href?: string }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:opacity-80"
        >
            {children}
        </a>
    ),
};

const getStrongMarkerIndices = (value: string): number[] => {
    const indices: number[] = [];

    for (let index = 0; index < value.length - 1; index += 1) {
        if (value[index] !== "*" || value[index + 1] !== "*") {
            continue;
        }

        if (index > 0 && value[index - 1] === "\\") {
            continue;
        }

        indices.push(index);
        index += 1;
    }

    return indices;
};

const sanitizeMalformedStrongMarkers = (value: string): string => {
    if (!value.includes("**")) {
        return value;
    }

    const markerIndices = getStrongMarkerIndices(value);
    if (markerIndices.length === 0) {
        return value;
    }

    const markerStartsToRemove = new Set<number>();

    for (let index = 0; index + 1 < markerIndices.length; index += 2) {
        const openingMarkerStart = markerIndices[index];
        const closingMarkerStart = markerIndices[index + 1];
        const wrappedText = value.slice(openingMarkerStart + 2, closingMarkerStart);

        // Remove empty strong markers like "** **", which otherwise render literal asterisks.
        if (wrappedText.trim().length === 0) {
            markerStartsToRemove.add(openingMarkerStart);
            markerStartsToRemove.add(closingMarkerStart);
        }
    }

    if (markerIndices.length % 2 === 1) {
        markerStartsToRemove.add(markerIndices[markerIndices.length - 1]);
    }

    if (markerStartsToRemove.size === 0) {
        return value;
    }

    let sanitized = "";
    for (let index = 0; index < value.length; index += 1) {
        if (markerStartsToRemove.has(index) && value[index] === "*" && value[index + 1] === "*") {
            index += 1;
            continue;
        }

        sanitized += value[index];
    }

    return sanitized;
};

export const MarkdownContent = ({ content, className, components }: MarkdownContentProps) => {
    const sanitizedContent = sanitizeMalformedStrongMarkers(content);

    return (
        <div className={cn(className)}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={{ ...defaultComponents, ...components }}>
                {sanitizedContent}
            </ReactMarkdown>
        </div>
    );
};
