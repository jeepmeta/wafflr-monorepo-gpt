import { ArrowRight, Clock3, Trash2 } from "lucide-react";
import { Button, Card } from "@wafflr/ui";
import { Modal } from "./components/Modal";
import type { RoomHistoryEntry } from "./supabase";

const phaseLabel = (phase: string) => ({
  setup: "Setting up",
  collecting: "Collecting options",
  reviewing: "Deck review",
  voting: "Voting",
  "tie-breaker": "Tie-breaker",
  "tie-result": "Tie result",
  winner: "Winner selected",
  closed: "Completed",
}[phase] ?? phase.replaceAll("-", " "));

export function YourRoomsDialog({ open, onClose, rooms, onOpen, onForget }: {
  open: boolean;
  onClose: () => void;
  rooms: RoomHistoryEntry[];
  onOpen: (room: RoomHistoryEntry) => void;
  onForget: (room: RoomHistoryEntry) => void;
}) {
  const sorted = [...rooms].sort((a, b) => Date.parse(b.last_opened_at) - Date.parse(a.last_opened_at));
  return <Modal open={open} title="Your Rooms" description="Your recent rooms on this device, newest first." onClose={onClose}>
    <div className="your-rooms-list">
      {sorted.length ? sorted.map(room => {
        const expired = room.phase === "closed" && Boolean(room.expires_at) && Date.parse(room.expires_at!) <= Date.now();
        const completed = room.phase === "closed" || room.phase === "winner" || room.phase === "tie-result";
        return <Card className="your-room-card" key={room.room_id}>
          <div className="your-room-main">
            <span className="your-room-emoji">{room.room_icon ?? "🧇"}</span>
            <div>
              <span className="eyebrow">{room.role === "host" ? "CREATED" : "JOINED"} · {room.room_code}</span>
              <h3>{room.title}</h3>
              <p><Clock3 size={14} /> {expired ? "Expired" : phaseLabel(room.phase)}</p>
              <span className={expired ? "room-history-status is-expired" : completed ? "room-history-status is-complete" : "room-history-status"}>{expired ? "Expired" : completed ? "Completed" : "Active"}</span>
            </div>
          </div>
          <div className="your-room-actions">
            <Button size="sm" disabled={expired} trailingIcon={<ArrowRight size={15} />} onClick={() => onOpen(room)}>{expired ? "Room expired" : "Open room"}</Button>
            <button type="button" className="text-action" aria-label={"Forget " + room.title + " from this device"} onClick={() => onForget(room)}><Trash2 size={14} /> Forget</button>
          </div>
        </Card>;
      }) : <Card className="form-card"><span className="your-room-emoji">🧇</span><h3>No rooms yet</h3><p className="field-note">Rooms you create or join will appear here on this device.</p></Card>}
    </div>
    <p className="field-note">Room access details are stored locally in this browser so you can return without creating a duplicate room. Forgetting a room only removes this device’s saved access.</p>
  </Modal>;
}
