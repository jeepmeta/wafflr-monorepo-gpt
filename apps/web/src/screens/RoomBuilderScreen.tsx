import { ArrowLeft, ArrowRight, Copy, Plus, X } from "lucide-react";
import type { DecisionCategory, DecisionRoom } from "@wafflr/core";
import { Badge, Button, Card, EmptyState, SectionHeading, TextField } from "@wafflr/ui";

type Draft = { title: string; category: string; location: string };
type RoomBuilderScreenProps = {
  room: DecisionRoom;
  category: DecisionCategory;
  draft: Draft;
  editCardId: string | null;
  error: string;
  myCardCount: number;
  contributionFull: boolean;
  onBack: () => void;
  onDraftChange: (field: keyof Draft, value: string) => void;
  onAddCard: () => void;
  onEditCard: (cardId: string) => void;
  onRequestRemove: (cardId: string) => void;
  onCancelEdit: () => void;
  onCopyCode: () => void;
  onShare: () => void;
  onStartVoting: () => void;
};

function emojiFor(category: DecisionCategory, index: number) {
  if (category === "eat") return ["🍕", "🍜", "🌮", "🍔", "🥗"][index % 5];
  if (category === "watch") return "🎬";
  if (category === "do") return "🎯";
  return "💡";
}

export function RoomBuilderScreen({ room, category, draft, editCardId, error, myCardCount, contributionFull, onBack, onDraftChange, onAddCard, onEditCard, onRequestRemove, onCancelEdit, onCopyCode, onShare, onStartVoting }: RoomBuilderScreenProps) {
  return <section className="workflow-screen">
    <div className="room-topline"><Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={onBack}>Home</Button><Badge tone="success">Room created</Badge></div>
    <div className="room-code-card">
      <div><span className="eyebrow">YOUR ROOM CODE</span><strong>{room.code}</strong><p>Share this code with your crew. QR sharing arrives with room sync.</p></div>
      <div className="room-code-actions"><Button variant="secondary" size="sm" leadingIcon={<Copy size={15} />} onClick={onCopyCode}>Copy code</Button><Button size="sm" onClick={onShare}>Share room</Button></div>
    </div>
    <SectionHeading eyebrow="BUILD THE DECK" title={room.title} description="Add the choices your group could be happy with. You can edit or remove options before voting starts." action={<Badge>{room.cards.length}/100 cards</Badge>} />
    <div className="add-card-panel">
      <div className="add-card-fields">
        <TextField label={category === "eat" ? "Restaurant or option name" : "Option name"} value={draft.title} onChange={(event) => onDraftChange("title", event.target.value)} placeholder={category === "eat" ? "e.g. Noodle House" : "e.g. Movie night"} onKeyDown={(event) => { if (event.key === "Enter") onAddCard(); }} />
        <div className="optional-fields">
          {category === "eat" && <TextField label="Cuisine / category" value={draft.category} onChange={(event) => onDraftChange("category", event.target.value)} placeholder="e.g. Thai" />}
          <TextField label={category === "eat" ? "Location (optional)" : "Extra detail (optional)"} value={draft.location} onChange={(event) => onDraftChange("location", event.target.value)} placeholder={category === "eat" ? "Neighborhood or address" : "A little context"} />
        </div>
      </div>
      <div className="add-card-actions"><Button leadingIcon={<Plus size={17} />} onClick={onAddCard} disabled={!editCardId && (room.cards.length >= 100 || contributionFull)}>{editCardId ? "Save changes" : "Add option"}</Button>{editCardId && <Button variant="quiet" onClick={onCancelEdit}>Cancel</Button>}</div>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
    {room.cards.length === 0 ? <EmptyState title="Your deck starts here" description="Add at least two options to unlock voting. No need to make this complicated." /> :
      <div className="option-grid">{room.cards.map((card, index) => <Card className="option-card" key={card.id}>
        <div className="option-card-top"><span className="option-number">{String(index + 1).padStart(2, "0")}</span><div className="option-card-controls">
          <button className="remove-option" onClick={() => onEditCard(card.id)} aria-label={`Edit ${card.title}`} title="Edit this card"><span aria-hidden="true">✎</span></button>
          <button className="remove-option" onClick={() => onRequestRemove(card.id)} aria-label={`Remove ${card.title}`} title="Remove this card"><X size={16} /></button>
        </div></div>
        <div className="option-emoji">{emojiFor(category, index)}</div><h3>{card.title}</h3>{card.category && <span className="option-meta">{card.category}</span>}{card.location && <p className="option-location">{card.location}</p>}
      </Card>)}</div>}
    <div className="workflow-footer sticky-footer"><span>{room.contributionMode === "guests-contribute" ? `Your cards: ${myCardCount}/${room.cardLimitPerGuest} · ` : ""}{room.cards.length < 2 ? `Add ${2 - room.cards.length} more option${room.cards.length === 1 ? "" : "s"} to start` : "Deck ready when you are"}</span><Button size="lg" trailingIcon={<ArrowRight size={18} />} disabled={room.cards.length < 2} onClick={onStartVoting}>Review deck &amp; vote</Button></div>
  </section>;
}
