import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, Copy, Plus, Sparkles, Trash2, Utensils, Clapperboard, Footprints, WandSparkles, Users, X } from "lucide-react";
import { applyRoomAction, canStartVoting, createRoom, resolveCurrentRound, type DecisionCategory, type DecisionRoom, type VoteValue } from "@wafflr/core";
import { Badge, Butters, Button, Card, EmptyState, SectionHeading, TextField } from "@wafflr/ui";

type Screen = "home" | "join" | "setup" | "room" | "vote" | "tie" | "choose-winner" | "winner";
type DraftCard = { title: string; category: string; location: string };
const categories: { id: DecisionCategory; title: string; subtitle: string; icon: typeof Utensils }[] = [
  { id: "eat", title: "What to eat", subtitle: "Restaurants, snacks, the works", icon: Utensils },
  { id: "watch", title: "What to watch", subtitle: "Movies, shows, videos", icon: Clapperboard },
  { id: "do", title: "What to do", subtitle: "Plans, outings, activities", icon: Footprints },
  { id: "custom", title: "Something else", subtitle: "Make it your own", icon: WandSparkles },
];
const blankCard = (): DraftCard => ({ title: "", category: "", location: "" });
const newId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [category, setCategory] = useState<DecisionCategory>("eat");
  const [mode, setMode] = useState<"creator-only" | "guests-contribute">("guests-contribute");
  const [quota, setQuota] = useState<1 | 2 | 3>(2);
  const [room, setRoom] = useState<DecisionRoom | null>(null);
  const [draft, setDraft] = useState<DraftCard>(blankCard());
  const [error, setError] = useState("");
  const [responses, setResponses] = useState<Record<string, VoteValue>>({});
  const [voteIndex, setVoteIndex] = useState(0);
  const [joinCode, setJoinCode] = useState("");

  const creatorId = "this-device";
  const activeCards = useMemo(() => {
    if (!room) return [];
    const ids = room.phase === "tie-breaker" && room.tieBreakerCardIds ? room.tieBreakerCardIds : room.cards.map((card) => card.id);
    return ids.map((id) => room.cards.find((card) => card.id === id)).filter((card): card is NonNullable<typeof card> => Boolean(card));
  }, [room]);

  function beginSetup() {
    setRoom(null); setDraft(blankCard()); setError(""); setCategory("eat"); setMode("guests-contribute"); setQuota(2); setScreen("setup");
  }

  function createNewRoom() {
    const next = createRoom({ id: newId(), code: Math.random().toString(36).slice(2, 8).toUpperCase(), creatorId, category, contributionMode: mode, cardLimitPerGuest: quota, now: Date.now() });
    setRoom(next); setScreen("room");
  }

  const myCardCount = room?.cards.filter((card) => card.submittedBy === creatorId).length ?? 0;
  const contributionFull = Boolean(room && room.contributionMode === "guests-contribute" && myCardCount >= room.cardLimitPerGuest);

  function addCard() {
    if (!room) return;
    if (contributionFull) { setError("You’ve added all your cards for this room."); return; }
    const title = draft.title.trim();
    if (!title) { setError("Give this option a name first."); return; }
    if (room.cards.length >= 100) { setError("Room full — 100/100 cards."); return; }
    const result = applyRoomAction(room, { type: "add-card", card: { id: newId(), title, category: draft.category.trim() || undefined, location: draft.location.trim() || undefined, submittedBy: creatorId, createdAt: Date.now() } });
    if (!result.ok) { setError(result.error === "card-limit-reached" ? "Room full — 100/100 cards." : result.error === "contribution-limit-reached" ? "You’ve added all your cards for this room." : "Couldn’t add that option. Try again."); return; }
    setRoom(result.room); setDraft(blankCard()); setError("");
  }

  function removeCard(cardId: string) {
    if (!room) return;
    const result = applyRoomAction(room, { type: "creator-veto-card", cardId, participantId: creatorId });
    if (result.ok) setRoom(result.room);
  }

  function startVoting() {
    if (!room) return;
    const result = applyRoomAction(room, { type: "start-voting", participantId: creatorId });
    if (!result.ok) { setError("Add at least two options before voting."); return; }
    setRoom(result.room); setResponses({}); setVoteIndex(0); setScreen("vote");
  }

  function setVote(cardId: string, value: VoteValue) {
    setResponses((current) => ({ ...current, [cardId]: value }));
    const nextIndex = voteIndex + 1;
    if (nextIndex < activeCards.length) setVoteIndex(nextIndex);
  }

  function submitVotes() {
    if (!room) return;
    if (activeCards.some((card) => !responses[card.id])) { setError("Choose Yup or Nah on every card before submitting."); return; }
    const result = applyRoomAction(room, { type: "submit-ballot", participantId: creatorId, responses, submittedAt: Date.now() });
    if (!result.ok) { setError("Couldn’t submit these votes. Please try again."); return; }
    const resolved = resolveCurrentRound(result.room);
    setRoom(resolved);
    if (resolved.phase === "winner") {
      setScreen("winner");
    } else if (resolved.phase === "tie-breaker") {
      if (result.room.phase === "tie-breaker") setScreen("choose-winner");
      else { setResponses({}); setVoteIndex(0); setScreen("tie"); }
    }
    setError("");
  }

  function chooseWinner(cardId: string) {
    if (!room) return;
    const result = applyRoomAction(room, { type: "creator-select-winner", participantId: creatorId, cardId });
    if (result.ok) { setRoom(result.room); setScreen("winner"); }
  }

  function copyCode() {
    if (room?.code && navigator.clipboard) void navigator.clipboard.writeText(room.code);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("home")} aria-label="Wafflr home"><span className="brand-mark">🧇</span><span>wafflr</span></button>
        <span className="topbar-tag">Stop waffling. Start living.</span>
      </header>

      {screen === "home" && <section className="home-layout">
        <div className="home-copy">
          <Badge tone="warning"><Sparkles size={13} /> MADE FOR GROUP DECISIONS</Badge>
          <h1>Less waffling.<br /><span>More living.</span></h1>
          <p className="hero-description">Get everyone’s options on the table, vote together, and get on with the good stuff.</p>
          <div className="home-actions">
            <Button size="lg" trailingIcon={<ArrowRight size={18} />} onClick={beginSetup}>Create a room</Button>
            <Button size="lg" variant="secondary" onClick={() => { setError(""); setScreen("join"); }}>Join a room</Button>
          </div>
          <p className="microcopy"><Users size={15} /> No accounts. No names. Just a decision.</p>
        </div>
        <div className="hero-art" aria-label="A preview of a group decision">
          <div className="floating-spark spark-one">✦</div><div className="floating-spark spark-two">✧</div>
          <Card className="preview-card">
            <div className="preview-header"><div><span className="eyebrow">TONIGHT’S BIG QUESTION</span><h2>Where should we eat?</h2></div><span className="mini-avatar">👥</span></div>
            <div className="food-art">🍕</div>
            <div className="preview-option"><div><h3>Pizza night?</h3><p>Crispy edges. Melty cheese. Happy crew.</p></div><span className="yes-chip">Yup!</span></div>
            <div className="preview-footer"><span>Everyone gets a say</span><span>One happy winner <Sparkles size={13} /></span></div>
          </Card>
          <div className="butters-float"><Butters mood="celebrating" size="lg" /><span>Hey, friend!</span></div>
        </div>
      </section>}

      {screen === "join" && <section className="narrow-screen">
        <Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={() => setScreen("home")}>Back</Button>
        <Card className="form-card"><Butters size="md" /><SectionHeading title="Join the decision" description="Enter the room code or scan the host’s QR code." /><TextField label="Room code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} placeholder="e.g. WAFFLR" autoCapitalize="characters" /><p className="field-note">Joining a live shared room will be connected when room sync is implemented.</p><Button fullWidth disabled={joinCode.trim().length < 4} onClick={() => setError("Live room joining needs the shared room service, which is not connected yet.")}>Continue with code</Button>{error && <p className="inline-error" role="alert">{error}</p>}</Card>
      </section>}

      {screen === "setup" && <section className="workflow-screen">
        <Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={() => setScreen("home")}>Back home</Button>
        <SectionHeading eyebrow="STEP 1 OF 2" title="What are we deciding?" description="One room, one decision. Keep it simple." />
        <div className="category-grid">{categories.map((item) => { const Icon = item.icon; return <button key={item.id} className={`category-choice ${category === item.id ? "is-selected" : ""}`} onClick={() => setCategory(item.id)}><span className="category-icon"><Icon size={22} /></span><span className="category-title">{item.title}</span><span className="category-subtitle">{item.subtitle}</span>{category === item.id && <span className="selected-check"><Check size={14} /></span>}</button>; })}</div>
        <SectionHeading eyebrow="STEP 2 OF 2" title="Who’s adding options?" description="The creator is a regular participant, too." />
        <div className="mode-grid">
          <button className={`mode-choice ${mode === "creator-only" ? "is-selected" : ""}`} onClick={() => setMode("creator-only")}><span className="mode-emoji">🧇</span><strong>I’ll add all the cards</strong><span>I’ll build the deck, then everyone votes.</span></button>
          <button className={`mode-choice ${mode === "guests-contribute" ? "is-selected" : ""}`} onClick={() => setMode("guests-contribute")}><span className="mode-emoji">🙌</span><strong>Let everyone contribute</strong><span>Everyone can add their own options before voting.</span></button>
        </div>
        {mode === "guests-contribute" && <div className="quota-row"><div><strong>Cards per guest</strong><p>Unused slots are fine. Nobody gets stuck.</p></div><div className="quota-picker">{([1,2,3] as const).map((n) => <button key={n} className={quota === n ? "active" : ""} onClick={() => setQuota(n)} aria-pressed={quota === n}>{n}</button>)}</div></div>}
        <div className="workflow-footer"><span>Room limit: 100 cards total</span><Button size="lg" trailingIcon={<ArrowRight size={18} />} onClick={createNewRoom}>Create room</Button></div>
      </section>}

      {screen === "room" && room && <section className="workflow-screen">
        <div className="room-topline"><Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={() => setScreen("home")}>Home</Button><Badge tone="success">Room created</Badge></div>
        <div className="room-code-card"><div><span className="eyebrow">YOUR ROOM CODE</span><strong>{room.code}</strong><p>Share this code with your crew. QR sharing arrives with room sync.</p></div><Button variant="secondary" size="sm" leadingIcon={<Copy size={15} />} onClick={copyCode}>Copy code</Button></div>
        <SectionHeading eyebrow="BUILD THE DECK" title="What are the options?" description="Add the choices your group could be happy with. You can veto cards before voting starts." action={<Badge>{room.cards.length}/100 cards</Badge>} />
        <div className="add-card-panel">
          <div className="add-card-fields"><TextField label={category === "eat" ? "Restaurant or option name" : "Option name"} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={category === "eat" ? "e.g. Noodle House" : "e.g. Movie night"} onKeyDown={(event) => { if (event.key === "Enter") addCard(); }} /><div className="optional-fields">{category === "eat" && <TextField label="Cuisine / category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="e.g. Thai" /> }<TextField label={category === "eat" ? "Location (optional)" : "Extra detail (optional)"} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder={category === "eat" ? "Neighborhood or address" : "A little context"} /></div></div>
          <Button leadingIcon={<Plus size={17} />} onClick={addCard} disabled={room.cards.length >= 100 || contributionFull}>Add option</Button>
          {error && <p className="inline-error" role="alert">{error}</p>}
        </div>
        {room.cards.length === 0 ? <EmptyState title="Your deck starts here" description="Add at least two options to unlock voting. No need to make this complicated." /> : <div className="option-grid">{room.cards.map((card, index) => <Card className="option-card" key={card.id}><div className="option-card-top"><span className="option-number">{String(index + 1).padStart(2, "0")}</span><button className="remove-option" onClick={() => removeCard(card.id)} aria-label={`Veto ${card.title}`} title="Veto this card"><X size={16} /></button></div><div className="option-emoji">{category === "eat" ? ["🍕","🍜","🌮","🍔","🥗"][index % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</div><h3>{card.title}</h3>{card.category && <span className="option-meta">{card.category}</span>}{card.location && <p className="option-location">{card.location}</p>}</Card>)}</div>}
        <div className="workflow-footer sticky-footer"><span>{room.contributionMode === "guests-contribute" ? `Your cards: ${myCardCount}/${room.cardLimitPerGuest} · ` : ""}{room.cards.length < 2 ? `Add ${2 - room.cards.length} more option${2 - room.cards.length === 1 ? "" : "s"} to start` : "Deck ready when you are"}</span><Button size="lg" trailingIcon={<ArrowRight size={18} />} disabled={!canStartVoting(room)} onClick={startVoting}>Start voting</Button></div>
      </section>}

      {(screen === "vote" || screen === "tie") && room && <section className="voting-screen">
        <div className="voting-top"><Badge tone="warning">{screen === "tie" ? "TIE-BREAKER" : "YOUR TURN"}</Badge><span>{Math.min(voteIndex + 1, activeCards.length)} of {activeCards.length}</span></div>
        <div className="vote-intro"><Butters mood="thinking" size="md" /><h1>{screen === "tie" ? "One more little round." : "Could you go for this?"}</h1><p>{screen === "tie" ? "Only the tied options. Let’s break it." : "A Yup says yes. A Nah says no. Trust your gut."}</p></div>
        {activeCards[voteIndex] ? <Card className="vote-card"><div className="vote-card-emoji">{category === "eat" ? ["🍕","🍜","🌮","🍔","🥗"][room.cards.findIndex((card) => card.id === activeCards[voteIndex].id) % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</div><span className="eyebrow">OPTION {voteIndex + 1}</span><h2>{activeCards[voteIndex].title}</h2>{activeCards[voteIndex].category && <p>{activeCards[voteIndex].category}</p>}{activeCards[voteIndex].location && <p>{activeCards[voteIndex].location}</p>}<div className="vote-actions"><Button size="lg" variant="danger" onClick={() => setVote(activeCards[voteIndex].id, "nah")}>✕ Nah</Button><Button size="lg" onClick={() => setVote(activeCards[voteIndex].id, "yup")}>♥ Yup</Button></div></Card> : <EmptyState title="All caught up" description="Your choices are ready to submit." />}
        <div className="voting-bottom"><div className="vote-navigation"><Button variant="quiet" size="sm" disabled={voteIndex === 0} onClick={() => setVoteIndex((index) => Math.max(0, index - 1))}>Previous card</Button><Button variant="quiet" size="sm" disabled={voteIndex >= activeCards.length - 1} onClick={() => setVoteIndex((index) => Math.min(activeCards.length - 1, index + 1))}>Next card</Button></div>{error && <p className="inline-error">{error}</p>}<Button fullWidth size="lg" disabled={activeCards.some((card) => !responses[card.id])} onClick={submitVotes}>Submit votes <ArrowRight size={17} /></Button><button className="text-action" onClick={() => { if (room) { const ended = applyRoomAction(room, { type: "creator-end-voting", participantId: creatorId }); if (ended.ok) { setRoom(ended.room); if (ended.room.phase === "tie-breaker") setScreen("choose-winner"); else if (ended.room.phase === "winner") setScreen("winner"); else setScreen("choose-winner"); } } }}>End voting early</button></div>
      </section>}

      {screen === "choose-winner" && room && <section className="workflow-screen"><div className="vote-intro"><Butters mood="thinking" size="md" /><h1>{room.phase === "tie-breaker" ? "Still tied!" : "Let’s pick one."}</h1><p>{room.phase === "tie-breaker" ? "One last call. Tap the option that wins for your group." : "Voting ended before anyone submitted. Choose a card to keep things moving."}</p></div><div className="winner-choice-grid">{activeCards.map((card, index) => <button key={card.id} className="winner-choice" onClick={() => chooseWinner(card.id)}><span>{category === "eat" ? ["🍕","🍜","🌮","🍔","🥗"][index % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</span><strong>{card.title}</strong><small>Choose winner <ArrowRight size={14} /></small></button>)}</div></section>}

      {screen === "winner" && room && <section className="winner-screen"><div className="confetti" aria-hidden="true">✦　✧　✦　✧　✦</div><Butters mood="celebrating" size="lg" /><Badge tone="success">THE GROUP HAS SPOKEN</Badge><h1>It’s a <span>winner!</span></h1><p className="winner-subtitle">No more waffling. Go make it happen.</p><Card className="winner-card"><div className="winner-emoji">{category === "eat" ? "🍕" : category === "watch" ? "🎬" : category === "do" ? "🎉" : "💡"}</div><h2>{room.cards.find((card) => card.id === room.winnerCardId)?.title ?? "Your group’s pick"}</h2><p>{room.cards.find((card) => card.id === room.winnerCardId)?.location}</p><span className="winner-ribbon">WINNER ✨</span></Card><Button size="lg" onClick={() => setScreen("home")}>Back to home</Button><p className="field-note">This is a local prototype; shared real-time rooms are the next integration step.</p></section>}

      <footer className="site-footer"><span>🧇 Wafflr</span><span>Stop waffling. Start living.</span><button onClick={() => setError(error ? "" : "Wafflr keeps decisions anonymous. No participant names or individual vote details are shown.")} aria-label="About Wafflr"><CircleHelp size={16} /></button></footer>
      {error && screen !== "room" && screen !== "vote" && screen !== "tie" && screen !== "join" && <p className="toast-message" role="status">{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></p>}
    </main>
  );
}
