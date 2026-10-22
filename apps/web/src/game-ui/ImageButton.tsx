import { useState, type CSSProperties, type ReactNode } from "react";

export type ImageButtonProps = {
  /** Path under /public, for example /assets/ui/buttons/create-room.webp. */
  src: string;
  /** Optional artwork for pointer/keyboard press and disabled states. */
  pressedSrc?: string;
  disabledSrc?: string;
  /** Accessible name. Required even when the artwork contains visible text. */
  label: string;
  onClick: () => void;
  /** Optional live text layered over the artwork. Prefer baked-in text for fixed labels. */
  children?: ReactNode;
  className?: string;
  width?: CSSProperties["width"];
  aspectRatio?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

/**
 * Artwork-first button. The image controls the visual shape; the native button
 * supplies keyboard behavior, focus, disabled semantics, and a dependable hit area.
 */
export function ImageButton({
  src,
  pressedSrc,
  disabledSrc,
  label,
  onClick,
  children,
  className,
  width = "100%",
  aspectRatio,
  disabled = false,
  type = "button",
}: ImageButtonProps) {
  const [pressed, setPressed] = useState(false);
  const imageSrc = disabled && disabledSrc ? disabledSrc : pressed && pressedSrc ? pressedSrc : src;
  const style: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : {}) };

  return (
    <button
      type={type}
      className={["wf-image-button", className].filter(Boolean).join(" ")}
      style={style}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onBlur={() => setPressed(false)}
    >
      <img className="wf-image-button__art" src={imageSrc} alt="" draggable={false} />
      {children ? <span className="wf-image-button__label">{children}</span> : null}
    </button>
  );
}
