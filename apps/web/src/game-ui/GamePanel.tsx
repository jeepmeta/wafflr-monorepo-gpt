import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { assetSrc, type WafflrAssetPath } from "./assets";

export type GamePanelProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  src: WafflrAssetPath;
  children: ReactNode;
  /** Border slice in source-image pixels; protect the corners when the panel resizes. */
  slice?: number | string;
  /** CSS border width, controlling how much of the source artwork is used as the frame. */
  borderWidth?: CSSProperties["borderWidth"];
  contentClassName?: string;
};

/** Nine-slice panel: corners stay intact while the center stretches with live content. */
export function GamePanel({
  src, children, slice = 28, borderWidth = 24, className, contentClassName, style, ...props
}: GamePanelProps) {
  const panelStyle: CSSProperties = {
    borderStyle: "solid",
    borderWidth,
    borderImageSource: `url("${assetSrc(src)}")`,
    borderImageSlice: slice,
    borderImageWidth: borderWidth,
    borderImageRepeat: "stretch",
    minWidth: 0,
    ...style,
  };
  return (
    <div {...props} className={["wf-game-panel", className].filter(Boolean).join(" ")} style={panelStyle}>
      <div className={["wf-game-panel__content", contentClassName].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
}
