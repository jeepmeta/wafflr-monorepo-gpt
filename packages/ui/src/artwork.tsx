import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import "./artwork.css";

export interface ArtworkImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src: string;
  sourceWidth?: number;
  sourceHeight?: number;
  fit?: "contain" | "cover" | "fill";
}

/** A decorative asset image. Use live HTML for all changing text and values. */
export function ArtworkImage({ src, sourceWidth, sourceHeight, fit = "contain", alt = "", className = "", ...props }: ArtworkImageProps) {
  return <img {...props} className={["wf-artwork-image", `wf-artwork-image--${fit}`, className].filter(Boolean).join(" ")} src={src} alt={alt} width={sourceWidth} height={sourceHeight} loading={props.loading ?? "lazy"} decoding={props.decoding ?? "async"} />;
}

export interface ArtworkSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  children?: ReactNode;
  imageAlt?: string;
  imageFit?: "contain" | "cover" | "fill";
  contentClassName?: string;
}

/** Layered artwork surface: image is decorative; children remain responsive live UI. */
export function ArtworkSurface({ src, children, imageAlt = "", imageFit = "fill", contentClassName = "", className = "", ...props }: ArtworkSurfaceProps) {
  return <div {...props} className={["wf-artwork-surface", className].filter(Boolean).join(" ")}>
    <img className={`wf-artwork-surface__image wf-artwork-surface__image--${imageFit}`} src={src} alt={imageAlt} aria-hidden={imageAlt ? undefined : true} />
    <div className={["wf-artwork-surface__content", contentClassName].filter(Boolean).join(" ")}>{children}</div>
  </div>;
}

export interface ArtworkButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  src: string;
  children: ReactNode;
  imageAlt?: string;
  imageFit?: "contain" | "fill";
}

export function ArtworkButton({ src, children, imageAlt = "", imageFit = "fill", className = "", type = "button", ...props }: ArtworkButtonProps) {
  return <button {...props} type={type} className={["wf-artwork-button", className].filter(Boolean).join(" ")}>
    <img className={`wf-artwork-button__image wf-artwork-button__image--${imageFit}`} src={src} alt={imageAlt} aria-hidden={imageAlt ? undefined : true} />
    <span className="wf-artwork-button__content">{children}</span>
  </button>;
}

export interface ArtworkPanelProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  src: string;
  children: ReactNode;
  as?: "section" | "div" | "article";
  imageFit?: "fill" | "cover";
  contentClassName?: string;
}

export function ArtworkPanel({ src, children, as = "section", imageFit = "fill", contentClassName = "", className = "", ...props }: ArtworkPanelProps) {
  const style = { "--wf-artwork-panel-ratio": "auto" } as CSSProperties;
  const content = <><img className={`wf-artwork-panel__image wf-artwork-panel__image--${imageFit}`} src={src} alt="" aria-hidden="true" /><div className={["wf-artwork-panel__content", contentClassName].filter(Boolean).join(" ")}>{children}</div></>;
  const classes = ["wf-artwork-panel", className].filter(Boolean).join(" ");
  if (as === "article") return <article {...props} style={{ ...style, ...props.style }} className={classes}>{content}</article>;
  if (as === "div") return <div {...props} style={{ ...style, ...props.style }} className={classes}>{content}</div>;
  return <section {...props} style={{ ...style, ...props.style }} className={classes}>{content}</section>;
}

export interface ArtworkCardProps extends ArtworkPanelProps {
  selected?: boolean;
  disabled?: boolean;
}

export function ArtworkCard({ selected = false, disabled = false, className = "", ...props }: ArtworkCardProps) {
  return <ArtworkPanel {...props} className={[
    "wf-artwork-card", selected ? "wf-artwork-card--selected" : "", disabled ? "wf-artwork-card--disabled" : "", className,
  ].filter(Boolean).join(" ")} />;
}

export function CounterPill({ src, value, label, className = "" }: { src: string; value: number | string; label?: string; className?: string }) {
  return <ArtworkSurface src={src} className={["wf-counter-pill", className].filter(Boolean).join(" ")} contentClassName="wf-counter-pill__content">
    {label ? <span className="wf-counter-pill__label">{label}</span> : null}
    <span className="wf-counter-pill__value" aria-live="polite">{value}</span>
  </ArtworkSurface>;
}
