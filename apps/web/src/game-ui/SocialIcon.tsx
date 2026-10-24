import { wafflrAssets } from "./assets";

export type SocialPlatform = "x" | "youtube" | "instagram" | "discord";

const socialIcons = {
  x: { src: wafflrAssets.ui.social.x, label: "X" },
  youtube: { src: wafflrAssets.ui.social.youtube, label: "YouTube" },
  instagram: { src: wafflrAssets.ui.social.instagram, label: "Instagram" },
  discord: { src: wafflrAssets.ui.social.discord, label: "Discord" },
} as const;

export type SocialIconProps = {
  platform: SocialPlatform;
  href: string;
  label?: string;
  className?: string;
  size?: string | number;
};

/** One accessible, artwork-backed link component for all supported platforms. */
export function SocialIcon({
  platform,
  href,
  label,
  className,
  size = "2.75rem",
}: SocialIconProps) {
  const social = socialIcons[platform];

  return (
    <a
      className={["wf-social-icon", className].filter(Boolean).join(" ")}
      href={href}
      aria-label={label ?? social.label}
      target="_blank"
      rel="noopener noreferrer"
      style={{ width: size, height: size }}
    >
      <img src={social.src} alt="" draggable={false} />
    </a>
  );
}
