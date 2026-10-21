import { ArrowLeft, Check, Pencil } from "lucide-react";
import { Button } from "@wafflr/ui";
import { Modal } from "./components/Modal";
type BallotCard={id:string;title:string};
export function BallotReviewDialog({open,onClose,cards,responses,onChange,onConfirm,busy}:{open:boolean;onClose:()=>void;cards:BallotCard[];responses:Record<string,boolean>;onChange:(index:number)=>void;onConfirm:()=>void;busy:boolean}) {
 return <Modal open={open} title="Review your ballot" description="Check every Yep and Nah before submitting. You can still change any choice." onClose={onClose}><div className="ballot-review-list">{cards.map((card,index)=><div className="ballot-review-row" key={card.id}><div><strong>{card.title}</strong><span className={responses[card.id]?"ballot-yep":"ballot-nah"}>{responses[card.id]?"Yep":"Nah"}</span></div><Button size="sm" variant="secondary" leadingIcon={<Pencil size={14}/>} onClick={()=>onChange(index)}>Change</Button></div>)}</div><div className="wf-modal-actions"><Button variant="secondary" onClick={onClose}><ArrowLeft size={16}/> Back to voting</Button><Button disabled={busy||cards.some(card=>responses[card.id]===undefined)} onClick={onConfirm}><Check size={16}/> Confirm ballot</Button></div></Modal>;
}
