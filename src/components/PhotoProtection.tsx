import type {
    DragEventHandler,
    ImgHTMLAttributes,
    MouseEventHandler,
} from "react";

type PhotoProtectionOverlayProps = {
    className?: string;
};

const preventImageContextMenu: MouseEventHandler<HTMLImageElement> = (event) => {
    event.preventDefault();
};

const preventImageDragStart: DragEventHandler<HTMLImageElement> = (event) => {
    event.preventDefault();
};

const preventOverlayContextMenu: MouseEventHandler<HTMLSpanElement> = (event) => {
    event.preventDefault();
};

const preventOverlayDragStart: DragEventHandler<HTMLSpanElement> = (event) => {
    event.preventDefault();
};

export const protectedImageProps: Pick<
    ImgHTMLAttributes<HTMLImageElement>,
    "draggable" | "onContextMenu" | "onDragStart"
> = {
    draggable: false,
    onContextMenu: preventImageContextMenu,
    onDragStart: preventImageDragStart,
};

export const PhotoProtectionOverlay = ({ className = "" }: PhotoProtectionOverlayProps) => (
    <span
        aria-hidden="true"
        onContextMenu={preventOverlayContextMenu}
        onDragStart={preventOverlayDragStart}
        className={`absolute inset-0 z-20 ${className}`.trim()}
        style={{ cursor: "inherit" }}
    />
);
