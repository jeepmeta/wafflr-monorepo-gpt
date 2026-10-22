import { ArrowLeft, ArrowRight } from "lucide-react";
import type { DecisionCategory, DecisionRoom, VoteValue } from "@wafflr/core";
import { Badge, Butters, Button } from "@wafflr/ui";

type Card = DecisionRoom["cards"][number];
type BallotReviewScreenProps = {
  room: DecisionRoom;
  category: DecisionCategory;
  cards: Card[];
  responses: Record<string, VoteValue>;
  error: string;
  onBack: () => void;
  onChangeVote: (index: number) => void;
  onSubmit: () => void;
};

function emojiFor(category: DecisionCategory, index: number) {
  if (category === "eat") return ["🍕", "🍜", "🌮", "🍔", "🥗"][index % 5];
  if (category === "watch") return "🎬";
  if (category === "do") return "🎯";
  return "💡";
}

export function BallotReviewScreen({ room, category, cards, responses, error, onBack, onChangeVote, onSubmit }: BallotReviewScreenProps) {
  return (
    <section className="workflow-screen ballot-review-screen">
      <Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={onBack}>Back to voting</Button>
      <div className="vote-intro"><Butters mood="thinking" size="md" /><h1>One last look.</h1><p>Make sure your Yup and Nah choices feel right. You can still change any answer before submitting.</p></div>
      <div className="ballot-review-list">
        {cards.map((card, index) => <div className="ballot-review-row" key={card.id}>
          <span className="ballot-review-emoji">{emojiFor(category, room.cards.findIndex((item) => item.id === card.id))}</span>
          <div className="ballot-review-copy"><strong>{card.title}</strong><span>{card.location || card.category || "Your choice"}</span></div>
          <Badge tone={responses[card.id] === "yup" ? "success" : "danger"}>{responses[card.id] === "yup" ? "♥ Yup" : "✕ Nah"}</Badge>
          <Button size="sm" variant="secondary" onClick={() => onChangeVote(index)}>Change</Button>
        </div>)}
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="workflow-footer"><span>{cards.length} answers · one submission</span><Button size="lg" onClick={onSubmit}>Confirm and submit votes <ArrowRight size={17} /></Button></div>
    </section>
  );
}
