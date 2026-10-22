import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { type DecisionCategory, type DecisionRoom, canStartVoting } from "@wafflr/core";
import { Badge, Button, Card, SectionHeading } from "@wafflr/ui";

type ReviewScreenProps = {
  room: DecisionRoom;
  category: DecisionCategory;
  error: string;
  onBack: () => void;
  onAddMore: () => void;
  onEditCard: (cardId: string) => void;
  onRequestRemove: (cardId: string) => void;
  onRequestStart: () => void;
};

export function ReviewScreen({ room, category, error, onBack, onAddMore, onEditCard, onRequestRemove, onRequestStart }: ReviewScreenProps) {
  return (
    <section className="workflow-screen deck-review-screen">
      <Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={onBack}>Back to deck</Button>
      <SectionHeading eyebrow="FINAL DECK REVIEW" title={room.title} description="Give the deck one last look. You can edit or remove any option before the group starts voting." action={<Badge>{room.cards.length}/100 cards</Badge>} />
      <div className="review-card-grid">
        {room.cards.map((card, index) => (
          <Card className="review-card" key={card.id}>
            <div className="option-card-top">
              <span className="option-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="option-card-controls">
                <button className="remove-option" onClick={() => onEditCard(card.id)} aria-label={`Edit ${card.title}`} title="Edit this card"><span aria-hidden="true">✎</span></button>
                <button className="remove-option" onClick={() => onRequestRemove(card.id)} aria-label={`Remove ${card.title}`} title="Remove this card"><X size={16} /></button>
              </div>
            </div>
            <div className="option-emoji">{category === "eat" ? ["🍕", "🍜", "🌮", "🍔", "🥗"][index % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</div>
            <h3>{card.title}</h3>
            {card.category && <span className="option-meta">{card.category}</span>}
            {card.location && <p className="option-location">{card.location}</p>}
          </Card>
        ))}
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="workflow-footer sticky-footer">
        <span>{room.cards.length < 2 ? "Add at least two options before voting." : "Once voting starts, this deck is locked."}</span>
        <div className="review-actions">
          <Button variant="secondary" onClick={onAddMore}>Add more options</Button>
          <Button size="lg" trailingIcon={<ArrowRight size={18} />} disabled={!canStartVoting(room)} onClick={onRequestStart}>Lock deck &amp; start voting</Button>
        </div>
      </div>
    </section>
  );
}
