import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, RefreshCw, ShieldAlert } from "lucide-react";
import { Butters, Button, Card, SectionHeading } from "@wafflr/ui";
import { Modal } from "../../components/Modal";

type Tally = { card_id: string; yep_count: number };
type TallyCard = { id: string; title: string };
export function RoomIntroScreen({ title, category, onContinue }: { title: string; category: string; onContinue: () => void }) {
 return <section className="narrow-screen room-intro-screen"><Card className="form-card"><Butters mood="celebrating" size="lg"/><span className="eyebrow">YOU’RE IN THE ROOM</span><SectionHeading title={title} description={`You’ve joined the ${category} decision. Let’s make the choice together.`}/><Button fullWidth size="lg" onClick={onContinue}>Let’s go <span aria-hidden="true">→</span></Button></Card></section>;
}
export function WaitingScreen({ host, title, phase, onReview, onRefresh }: { host: boolean; title: string; phase: string; onReview?: () => void; onRefresh: () => void }) {
 const review = phase === "reviewing";
 return <Card className="form-card waiting-screen"><Butters mood="thinking" size="lg"/><SectionHeading eyebrow={host ? "HOST VIEW" : "GUEST VIEW"} title={review ? (host ? "Your deck is ready to review" : "The host is reviewing the deck") : "You’re all caught up"} description={review ? (host ? "Check every option before locking the deck for voting." : "The host is checking everyone’s options. The deck can still change until voting starts.") : "We’ll keep this room updated. Hang tight while everyone gets ready."}/><p className="field-note">Room: {title}. Participant identities and individual votes stay private.</p><div className="wf-modal-actions">{host && review && onReview ? <Button onClick={onReview}>Review deck</Button> : null}<Button variant="secondary" leadingIcon={<RefreshCw size={15}/>} onClick={onRefresh}>Refresh room</Button></div></Card>;
}
export function ErrorRecoveryScreen({ message, onRetry, onBack }: { message: string; onRetry: () => void; onBack: () => void }) {
 return <section className="narrow-screen"><Card className="form-card"><ShieldAlert size={28}/><SectionHeading title="Let’s get you back on track" description={message || "This room didn’t load as expected."}/><p className="field-note">Your room code and saved room identity are kept so you can safely retry.</p><Button fullWidth size="lg" onClick={onRetry}>Try again</Button><Button fullWidth variant="secondary" onClick={onBack}>Back to room</Button></Card></section>;
}
export function ShareRoomDialog({ open, code, onClose, onCopy, onShare }: { open: boolean; code: string; onClose: () => void; onCopy: () => void; onShare: () => void; onScan?: () => void }) {
 const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&margin=8&data=${encodeURIComponent(code)}`;
 return <Modal open={open} title="Share your room" description="Invite your crew with this room code. No accounts or names required." onClose={onClose}><div className="share-room-content"><div className="share-qr-wrap"><img className="share-qr" src={qrUrl} alt={`QR code containing room code ${code}`} loading="lazy"/><span className="field-note">QR encodes the room code only.</span></div><span className="eyebrow">ROOM CODE</span><strong className="share-room-code">{code || "—"}</strong><p>Guests can scan this QR code or enter the code from Join Room.</p><div className="wf-modal-actions"><Button variant="secondary" leadingIcon={<Copy size={15}/>} onClick={onCopy}>Copy code</Button><Button onClick={onShare}>Share room</Button></div></div></Modal>;
}
export function QRScannerScreen({ onCode, onBack }: { onCode: (code: string) => void; onBack: () => void }) {
 const videoRef = useRef<HTMLVideoElement>(null);
 const onCodeRef = useRef(onCode);
 const [status,setStatus]=useState("Requesting camera access…");
 useEffect(()=>{onCodeRef.current=onCode;},[onCode]);
 useEffect(()=>{
   let stopped=false; let stream:MediaStream|undefined; let timer:number|undefined;
   type Detector={detect:(source:HTMLVideoElement)=>Promise<Array<{rawValue?:string}>>};
   type DetectorConstructor=new(options:{formats:string[]})=>Detector;
   const run=async()=>{
     try {
       const detectorCtor=(window as unknown as {BarcodeDetector?:DetectorConstructor}).BarcodeDetector;
       if(!detectorCtor){setStatus("QR scanning isn’t supported in this browser. Enter the room code manually instead.");return;}
       stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
       if(stopped)return;
       if(videoRef.current){videoRef.current.srcObject=stream; await videoRef.current.play();}
       const detector=new detectorCtor({formats:["qr_code"]}); setStatus("Point your camera at the Wafflr room QR code.");
       const scan=async()=>{if(stopped||!videoRef.current)return;try{const codes=await detector.detect(videoRef.current);const value=codes[0]?.rawValue;if(value){const match=value.match(/^[A-Z0-9]{4,12}$/i);if(match){onCodeRef.current(match[0].toUpperCase());return;}}}catch{}timer=window.setTimeout(()=>void scan(),350);};
       void scan();
     }catch{setStatus("Camera access was denied or unavailable. You can still join with a room code.");}
   };void run();
   return()=>{stopped=true;if(timer)window.clearTimeout(timer);stream?.getTracks().forEach(track=>track.stop());};
 },[]);
 return <section className="narrow-screen qr-scanner-screen"><Button variant="quiet" leadingIcon={<ArrowLeft size={17}/>} onClick={onBack}>Back to Join Room</Button><Card className="form-card"><SectionHeading title="Scan a room code" description="Allow camera access and hold the QR code inside the frame."/><video ref={videoRef} className="qr-camera-preview" playsInline muted aria-label="QR code camera preview"/><p role="status" className="field-note">{status}</p><Button fullWidth variant="secondary" onClick={onBack}>Enter code manually</Button></Card></section>;
}
export function TalliesDialog({ open, onClose, tally, cards }: { open: boolean; onClose: () => void; tally: Tally[]; cards: TallyCard[] }) {
 const byId=new Map(cards.map(card=>[card.id,card]));
 const rows=[...tally].sort((a,b)=>b.yep_count-a.yep_count).filter(item=>byId.has(item.card_id));
 return <Modal open={open} title="All group tallies" description="Ranked Yep totals only. Individual ballots and participant activity are never shown." onClose={onClose}><div className="all-tallies-list">{rows.length?rows.map((item,index)=><div className="results-tally-row" key={item.card_id}><span><small>{String(index+1).padStart(2,"0")}</small> {byId.get(item.card_id)?.title}</span><strong>{item.yep_count} Yep{item.yep_count===1?"":"s"}</strong></div>):<p className="field-note">Tallies aren’t available yet.</p>}</div><div className="wf-modal-actions"><Button onClick={onClose}><Check size={16}/> Done</Button></div></Modal>;
}
