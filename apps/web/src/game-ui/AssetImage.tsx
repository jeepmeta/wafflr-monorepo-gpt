import type { ImgHTMLAttributes } from "react";
import { assetSrc, type WafflrAssetPath } from "./assets";

export type AssetImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: WafflrAssetPath;
  decorative?: boolean;
};

/** Image helper for artwork paths from the central registry. */
export function AssetImage({ src, decorative = false, alt, ...props }: AssetImageProps) {
  return <img {...props} src={assetSrc(src)} alt={decorative ? "" : (alt ?? "")} draggable={false} />;
}
