import { ArrowRight } from "lucide-react";
import type { DecisionCategory, DecisionRoom } from "@wafflr/core";
import { Badge, Butters, Button, Card } from "@wafflr/ui";

type CardOption = DecisionRoom["cards"][number];
type WinnerScreenProps = {
  room: DecisionRoom;
  category: DecisionCategory;
  onHome: () => void;
};

function winnerEmoji(category: DecisionCategory) {
  if (category === "eat") return "🍕";
  if (category === "watch") return "🎬";
  if (category === "do") return "🎉";
  return "💡";
}

export function WinnerScreen({ room, category, onHome }: WinnerScreenProps) {
  const winner = room.cards.find((card: CardOption) => card.id === room.winnerCardId);
  return (
    <section className="winner-screen">
      <div className="confetti" aria-hidden="true">✦　✧　✦　✧　✦</div>
      <Butters mood="celebrating" size="lg" />
      <Badge tone="success">THE GROUP HAS SPOKEN</Badge>
      <h1>It’s a <span>winner!</span></h1>
      <p className="winner-subtitle">No more waffling. Go make it happen.</p>
      <Card className="winner-card">
        <div className="winner-emoji">{winnerEmoji(category)}</div>
        <h2>{winner?.title ?? "Your group’s pick"}</h2>
        {winner?.location && <p>{winner.location}</p>}
        <span className="winner-ribbon">WINNER ✨</span>
      </Card>
      <Button size="lg" onClick={onHome}>Back to home</Button>
      <p className="field-note">This is a local prototype; shared real-time rooms are the next integration step.</p>
    </section>
  );
}
