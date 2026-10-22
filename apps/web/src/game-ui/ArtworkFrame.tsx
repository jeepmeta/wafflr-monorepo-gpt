import type { CSSProperties, ReactNode } from "react";

export type ArtworkFrameProps = {
  /** Transparent panel/card/frame artwork under /public/assets. */
  src: string;
  children: ReactNode;
  className?: string;
  imageAlt?: string;
  aspectRatio?: string;
  width?: CSSProperties["width"];
  contentClassName?: string;
};

/**
 * Places live React content over a fixed raster frame. Use a screen-specific
 * content class to position text and controls inside the frame's safe area.
 */
export function ArtworkFrame({
  src,
  children,
  className,
  imageAlt = "",
  aspectRatio,
  width = "100%",
  contentClassName,
}: ArtworkFrameProps) {
  const style: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : {}) };
  return (
    <div className={["wf-artwork-frame", className].filter(Boolean).join(" ")} style={style}>
      <img className="wf-artwork-frame__art" src={src} alt={imageAlt} draggable={false} />
      <div className={["wf-artwork-frame__content", contentClassName].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
}
