import { ArrowRight, Clock3 } from "lucide-react";
import { Button, Card } from "@wafflr/ui";
import { Modal } from "./components/Modal";
export function YourRoomsDialog({ open, onClose, title, code, phase, onOpen }: { open: boolean; onClose: () => void; title: string; code: string; phase: string; onOpen: () => void }) {
 return <Modal open={open} title="Your Rooms" description="Pick up where you left off." onClose={onClose}><Card className="your-room-card"><div className="your-room-main"><span className="your-room-emoji">🧇</span><div><span className="eyebrow">ROOM · {code}</span><h3>{title}</h3><p><Clock3 size={14}/> {phase.replaceAll("-"," ")}</p></div></div><Button trailingIcon={<ArrowRight size={15}/>} onClick={onOpen}>Open room</Button></Card><p className="field-note">Your active room is remembered in this browser session. Full room history is not yet persisted here.</p></Modal>;
}
