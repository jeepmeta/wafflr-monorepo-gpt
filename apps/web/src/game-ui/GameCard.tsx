import type { HTMLAttributes, ReactNode } from "react";
import { wafflrAssets } from "./assets";
import { GamePanel } from "./GamePanel";

export type CardCategory = "eat" | "watch" | "do" | "custom";

const categoryIcons = {
  eat: wafflrAssets.ui.cards.cardCategoryEat,
  watch: wafflrAssets.ui.cards.cardCategoryWatch,
  do: wafflrAssets.ui.cards.cardCategoryDo,
  custom: wafflrAssets.ui.cards.cardCategoryCustom,
} as const;

export type GameCardProps = Omit<HTMLAttributes<HTMLElement>, "children" | "title"> & {
  title: string;
  category: CardCategory;
  description?: string;
  children?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
};

/** Standard decision card. Category artwork is selected centrally; title stays live text. */
export function GameCard({
  title, category, description, children, selected = false, disabled = false, className, ...props
}: GameCardProps) {
  const frame = selected
    ? wafflrAssets.ui.cards.cardFrameSelected
    : disabled
      ? wafflrAssets.ui.cards.cardFrameDisabled
      : wafflrAssets.ui.cards.cardFrame;

  return (
    <GamePanel
      {...props}
      as={undefined}
      src={frame}
      slice={28}
      borderWidth={24}
      className={["wf-game-card", selected && "is-selected", disabled && "is-disabled", className].filter(Boolean).join(" ")}
    >
      <img className="wf-game-card__category" src={categoryIcons[category]} alt="" aria-hidden="true" draggable={false} />
      <h3 className="wf-game-card__title">{title}</h3>
      {description ? <p className="wf-game-card__description">{description}</p> : null}
      {children}
    </GamePanel>
  );
}
