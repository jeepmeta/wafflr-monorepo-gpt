import type { DecisionCategory, DecisionRoom, VoteValue } from "@wafflr/core";
import { Badge, Butters, Button, Card, EmptyState } from "@wafflr/ui";

type CardOption = DecisionRoom["cards"][number];
type VoteScreenProps = {
  room: DecisionRoom;
  category: DecisionCategory;
  mode: "vote" | "tie";
  cards: CardOption[];
  responses: Record<string, VoteValue>;
  voteIndex: number;
  error: string;
  onVote: (cardId: string, value: VoteValue) => void;
  onIndexChange: (index: number) => void;
  onReview: () => void;
  onEndEarly: () => void;
};

function emojiFor(category: DecisionCategory, index: number) {
  if (category === "eat") return ["🍕", "🍜", "🌮", "🍔", "🥗"][index % 5];
  if (category === "watch") return "🎬";
  if (category === "do") return "🎯";
  return "💡";
}

export function VoteScreen({ room, category, mode, cards, responses, voteIndex, error, onVote, onIndexChange, onReview, onEndEarly }: VoteScreenProps) {
  const current = cards[voteIndex];
  const complete = cards.every((card) => Boolean(responses[card.id]));
  return (
    <section className="voting-screen">
      <div className="voting-top"><Badge tone="warning">{mode === "tie" ? "TIE-BREAKER" : "YOUR TURN"}</Badge><span>{Math.min(voteIndex + 1, cards.length)} of {cards.length}</span></div>
      <div className="vote-intro"><Butters mood="thinking" size="md" /><h1>{mode === "tie" ? "One more little round." : "Could you go for this?"}</h1><p>{mode === "tie" ? "Only the tied options. Let’s break it." : "A Yup says yes. A Nah says no. Trust your gut."}</p></div>
      {current ? <Card className="vote-card">
        <div className="vote-card-emoji">{emojiFor(category, room.cards.findIndex((card) => card.id === current.id))}</div>
        <span className="eyebrow">OPTION {voteIndex + 1}</span><h2>{current.title}</h2>
        {current.category && <p>{current.category}</p>}{current.location && <p>{current.location}</p>}
        <div className="vote-actions"><Button size="lg" variant="danger" onClick={() => onVote(current.id, "nah")}>✕ Nah</Button><Button size="lg" onClick={() => onVote(current.id, "yup")}>♥ Yup</Button></div>
      </Card> : <EmptyState title="All caught up" description="Your choices are ready to submit." />}
      <div className="voting-bottom">
        <div className="vote-navigation">
          <Button variant="quiet" size="sm" disabled={voteIndex === 0} onClick={() => onIndexChange(Math.max(0, voteIndex - 1))}>Previous card</Button>
          <Button variant="quiet" size="sm" disabled={voteIndex >= cards.length - 1} onClick={() => onIndexChange(Math.min(cards.length - 1, voteIndex + 1))}>Next card</Button>
        </div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <Button fullWidth size="lg" disabled={!complete} onClick={onReview}>Review my votes</Button>
        {mode === "vote" && <button className="text-action" onClick={onEndEarly}>End voting early</button>}
      </div>
    </section>
  );
}
