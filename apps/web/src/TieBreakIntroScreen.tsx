import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Butters, Button, Card, SectionHeading } from "@wafflr/ui";
export function TieBreakIntroScreen({ onComplete }: { onComplete: () => void }) {
 const [reducedMotion,setReducedMotion]=useState(false);
 useEffect(()=>{const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;setReducedMotion(reduce);if(reduce)return;const timer=window.setTimeout(onComplete,3000);return()=>window.clearTimeout(timer);},[onComplete]);
 return <section className="narrow-screen tie-break-intro-screen"><Card className="form-card"><Sparkles size={24}/><Butters mood="celebrating" size="lg"/><span className="eyebrow">ONE LAST ROUND</span><SectionHeading title="Eggin Targaryen" description="The decision is on the line. Only the tied options return for one final vote."/>{reducedMotion ? <Button fullWidth onClick={onComplete}>Start tie-breaker <ArrowRight size={17}/></Button> : <p className="field-note" role="status">The final round begins in a moment…</p>}</Card></section>;
}
