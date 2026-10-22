import { ArrowRight } from "lucide-react";
import type { DecisionCategory, DecisionRoom } from "@wafflr/core";
import { Butters } from "@wafflr/ui";

type CardOption = DecisionRoom["cards"][number];
type TieResolutionScreenProps = {
  room: DecisionRoom;
  category: DecisionCategory;
  cards: CardOption[];
  onChooseWinner: (cardId: string) => void;
};

function emojiFor(category: DecisionCategory, index: number) {
  if (category === "eat") return ["🍕", "🍜", "🌮", "🍔", "🥗"][index % 5];
  if (category === "watch") return "🎬";
  if (category === "do") return "🎯";
  return "💡";
}

export function TieResolutionScreen({ room, category, cards, onChooseWinner }: TieResolutionScreenProps) {
  const isTie = room.phase === "tie-breaker";
  return (
    <section className="workflow-screen tie-resolution-screen">
      <div className="vote-intro"><Butters mood="thinking" size="md" /><h1>{isTie ? "Still tied!" : "Let’s pick one."}</h1><p>{isTie ? "One last call. Tap the option that wins for your group." : "Voting ended before anyone submitted. Choose a card to keep things moving."}</p></div>
      <div className="winner-choice-grid">{cards.map((card, index) => <button key={card.id} className="winner-choice" onClick={() => onChooseWinner(card.id)}>
        <span>{emojiFor(category, room.cards.findIndex((item) => item.id === card.id))}</span><strong>{card.title}</strong><small>Choose winner <ArrowRight size={14} /></small>
      </button>)}</div>
    </section>
  );
}
