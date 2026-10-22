import { ArrowLeft, ArrowRight, Clock3, Users } from "lucide-react";
import type { DecisionCategory, DecisionRoom } from "@wafflr/core";
import { Badge, Button, Card, EmptyState, SectionHeading } from "@wafflr/ui";

type YourRoomsScreenProps = { rooms: DecisionRoom[]; icons: Record<string, string>; onBack: () => void; onOpen: (room: DecisionRoom) => void };
const categoryLabel: Record<DecisionCategory, string> = { eat: "Where to eat", watch: "What to watch", do: "What to do", custom: "Custom decision" };

export function YourRoomsScreen({ rooms, icons, onBack, onOpen }: YourRoomsScreenProps) {
  return <section className="workflow-screen your-rooms-screen">
    <Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={onBack}>Back home</Button>
    <SectionHeading eyebrow="YOUR WAFFLR ROOMS" title="Pick up where you left off" description="Rooms you’ve created on this device, newest first." />
    {rooms.length === 0 ? <EmptyState title="No rooms just yet" description="Create your first room and it’ll show up here." /> :
      <div className="your-rooms-list">{rooms.map((room) => <Card className="your-room-card" key={room.id}>
        <div className="your-room-main"><span className="your-room-emoji">{icons[room.id] ?? (room.category === "eat" ? "🍕" : room.category === "watch" ? "🎬" : room.category === "do" ? "🎯" : "✨")}</span>
          <div><span className="eyebrow">{categoryLabel[room.category]}</span><h2>{room.title}</h2><p><Clock3 size={14} /> {room.phase === "winner" ? "Decision complete" : room.phase === "voting" || room.phase === "tie-breaker" ? "Voting in progress" : "Collecting options"} <span aria-hidden="true">·</span> <Users size={14} /> {room.cards.length} options</p></div>
        </div>
        <div className="your-room-actions"><Badge tone={room.phase === "winner" ? "success" : "neutral"}>{room.phase === "winner" ? "Complete" : "Active"}</Badge><Button size="sm" trailingIcon={<ArrowRight size={15} />} onClick={() => onOpen(room)}>Open room</Button></div>
      </Card>)}</div>}
  </section>;
}
