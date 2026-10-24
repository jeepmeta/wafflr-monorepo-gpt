import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { assetSrc, type WafflrAssetPath } from "./assets";

export type CounterPillProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  src: WafflrAssetPath;
  label: ReactNode;
  count: ReactNode;
  countLabel?: string;
  width?: CSSProperties["width"];
};

/** Artwork shell with live, accessible label and count. */
export function CounterPill({ src, label, count, countLabel, width = "auto", className, style, ...props }: CounterPillProps) {
  return (
    <div {...props} className={["wf-counter-pill", className].filter(Boolean).join(" ")} style={{ width, ...style }}>
      <img className="wf-counter-pill__art" src={assetSrc(src)} alt="" aria-hidden="true" draggable={false} />
      <span className="wf-counter-pill__label">{label}</span>
      <span className="wf-counter-pill__count" aria-label={countLabel}>{count}</span>
    </div>
  );
}
