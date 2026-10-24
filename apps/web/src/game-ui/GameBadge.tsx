import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { assetSrc, type WafflrAssetPath } from "./assets";

export type GameBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  src: WafflrAssetPath;
  children: ReactNode;
  width?: CSSProperties["width"];
};

/** Small artwork-backed label; text remains live and scales with the layout. */
export function GameBadge({ src, children, width = "auto", className, style, ...props }: GameBadgeProps) {
  return (
    <span {...props} className={["wf-game-badge", className].filter(Boolean).join(" ")} style={{ width, ...style }}>
      <img className="wf-game-badge__art" src={assetSrc(src)} alt="" aria-hidden="true" draggable={false} />
      <span className="wf-game-badge__label">{children}</span>
    </span>
  );
}
