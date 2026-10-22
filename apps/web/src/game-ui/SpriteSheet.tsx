import { useEffect, useState, type CSSProperties } from "react";

export type SpriteSheetProps = {
  /** Path under /public, e.g. /assets/characters/butters/dance/sheet.webp. */
  src: string;
  columns: number;
  rows: number;
  frameCount?: number;
  frameDurationMs?: number;
  /** Set to a number to render a specific frame without animation. */
  frameIndex?: number;
  loop?: boolean;
  label: string;
  className?: string;
  width?: CSSProperties["width"];
  aspectRatio?: string;
};

/** Renders a regular-grid WebP sprite sheet, with optional frame-by-frame animation. */
export function SpriteSheet({
  src,
  columns,
  rows,
  frameCount = columns * rows,
  frameDurationMs = 100,
  frameIndex,
  loop = true,
  label,
  className,
  width = "100%",
  aspectRatio,
}: SpriteSheetProps) {
  const [animatedFrame, setAnimatedFrame] = useState(0);
  const count = Math.max(1, Math.min(frameCount, columns * rows));
  const isControlled = frameIndex !== undefined;

  useEffect(() => {
    if (isControlled || count < 2 || frameDurationMs <= 0) return;
    let frame = 0;
    const timer = window.setInterval(() => {
      frame = loop ? (frame + 1) % count : Math.min(frame + 1, count - 1);
      setAnimatedFrame(frame);
      if (!loop && frame === count - 1) window.clearInterval(timer);
    }, frameDurationMs);
    return () => window.clearInterval(timer);
  }, [count, frameDurationMs, isControlled, loop, src]);

  const activeFrame = Math.max(0, Math.min(count - 1, frameIndex ?? animatedFrame));
  const column = activeFrame % columns;
  const row = Math.floor(activeFrame / columns);
  const style: CSSProperties = {
    width,
    ...(aspectRatio ? { aspectRatio } : {}),
    backgroundImage: `url("${src}")`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${columns === 1 ? 0 : (column / (columns - 1)) * 100}% ${rows === 1 ? 0 : (row / (rows - 1)) * 100}%`,
  };

  return <span className={["wf-sprite-sheet", className].filter(Boolean).join(" ")} style={style} role="img" aria-label={label} />;
}
