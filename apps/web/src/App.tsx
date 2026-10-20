import { useMemo, useState } from "react";
import { HomeScreen } from "./screens/HomeScreen";
import { JoinScreen } from "./screens/JoinScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { ConfirmDialog } from "./components/Modal";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clapperboard, Copy, Footprints, Plus, Sparkles, Trash2, Utensils, Users, WandSparkles, X } from "lucide-react";
import { applyRoomAction, canStartVoting, createRoom, resolveCurrentRound, type DecisionCategory, type DecisionRoom, type VoteValue } from "@wafflr/core";
import { Badge, Butters, Button, Card, EmptyState, SectionHeading, TextField } from "@wafflr/ui";

type Screen = "home" | "join" | "setup" | "room" | "review" | "vote" | "ballot-review" | "tie" | "choose-winner" | "winner";
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
  const [roomTitle, setRoomTitle] = useState("");
  const [mode, setMode] = useState<"creator-only" | "guests-contribute">("guests-contribute");
  const [quota, setQuota] = useState<1 | 2 | 3>(2);
  const [room, setRoom] = useState<DecisionRoom | null>(null);
  const [draft, setDraft] = useState<DraftCard>(blankCard());
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState<Record<string, VoteValue>>({});
  const [voteIndex, setVoteIndex] = useState(0);
  const [joinCode, setJoinCode] = useState("");
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [removeCardId, setRemoveCardId] = useState<string | null>(null);

  const creatorId = "this-device";
  const activeCards = useMemo(() => {
    if (!room) return [];
    const ids = room.phase === "tie-breaker" && room.tieBreakerCardIds ? room.tieBreakerCardIds : room.cards.map((card) => card.id);
    return ids.map((id) => room.cards.find((card) => card.id === id)).filter((card): card is NonNullable<typeof card> => Boolean(card));
  }, [room]);

  function beginSetup() {
    setRoom(null); setDraft(blankCard()); setError(""); setCategory("eat"); setRoomTitle(""); setMode("guests-contribute"); setQuota(2); setScreen("setup");
  }

  function createNewRoom() {
    const title = roomTitle.trim();
    if (!title) { setError("Give your decision a title first."); return; }
    const next = createRoom({ id: newId(), code: Math.random().toString(36).slice(2, 8).toUpperCase(), title, creatorId, category, contributionMode: mode, cardLimitPerGuest: quota, now: Date.now() });
    setRoom(next); setError(""); setScreen("room");
  }

  const myCardCount = room?.cards.filter((card) => card.submittedBy === creatorId).length ?? 0;
  const contributionFull = Boolean(room && room.contributionMode === "guests-contribute" && myCardCount >= room.cardLimitPerGuest);

  function addCard() {
    if (!room) return;
    const title = draft.title.trim();
    if (!title) { setError("Give this option a name first."); return; }
    if (editCardId) {
      const result = applyRoomAction(room, { type: "update-own-card", cardId: editCardId, participantId: creatorId, patch: { title, category: draft.category.trim() || undefined, location: draft.location.trim() || undefined } });
      if (!result.ok) { setError("Couldn’t update that option. Try again."); return; }
      setRoom(result.room); setDraft(blankCard()); setEditCardId(null); setError(""); return;
    }
    if (contributionFull) { setError("You’ve added all your cards for this room."); return; }
    if (room.cards.length >= 100) { setError("Room full — 100/100 cards."); return; }
    const result = applyRoomAction(room, { type: "add-card", card: { id: newId(), title, category: draft.category.trim() || undefined, location: draft.location.trim() || undefined, submittedBy: creatorId, createdAt: Date.now() } });
    if (!result.ok) { setError(result.error === "card-limit-reached" ? "Room full — 100/100 cards." : result.error === "contribution-limit-reached" ? "You’ve added all your cards for this room." : "Couldn’t add that option. Try again."); return; }
    setRoom(result.room); setDraft(blankCard()); setError("");
  }

  function editCard(cardId: string) {
    const card = room?.cards.find((item) => item.id === cardId);
    if (!card) return;
    setDraft({ title: card.title, category: card.category ?? "", location: card.location ?? "" });
    setEditCardId(card.id); setError(""); setScreen("room");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelCardEdit() { setDraft(blankCard()); setEditCardId(null); setError(""); }

  function removeCard(cardId: string) {
    if (!room) return;
    const result = applyRoomAction(room, { type: "creator-veto-card", cardId, participantId: creatorId });
    if (result.ok) setRoom(result.room);
  }

  function startVoting() {
    if (!room || !canStartVoting(room)) { setError("Add at least two options before voting."); return; }
    setError(""); setScreen("review");
  }

  function confirmStartVoting() {
    if (!room) return;
    const result = applyRoomAction(room, { type: "start-voting", participantId: creatorId });
    if (!result.ok) { setError("Add at least two options before voting."); setScreen("room"); return; }
    setRoom(result.room); setResponses({}); setVoteIndex(0); setScreen("vote"); setError("");
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

      {screen === "home" && <HomeScreen onCreate={beginSetup} onJoin={() => { setError(""); setScreen("join"); }} />}

      {screen === "join" && <JoinScreen code={joinCode} onCodeChange={setJoinCode} error={error} onBack={() => setScreen("home")} onContinue={() => setError("Live room joining needs the shared room service, which is not connected yet.")} />}

      {screen === "setup" && <SetupScreen title={roomTitle} onTitleChange={setRoomTitle} category={category} onCategoryChange={setCategory} mode={mode} onModeChange={setMode} quota={quota} onQuotaChange={setQuota} error={error} onBack={() => setScreen("home")} onCreate={createNewRoom} />}

      {screen === "review" && room && <section className="workflow-screen deck-review-screen"><Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={() => setScreen("room")}>Back to deck</Button><SectionHeading eyebrow="FINAL DECK REVIEW" title={room.title} description="Give the deck one last look. You can edit or remove any option before the group starts voting." action={<Badge>{room.cards.length}/100 cards</Badge>} /><div className="review-card-grid">{room.cards.map((card, index) => <Card className="review-card" key={card.id}><div className="option-card-top"><span className="option-number">{String(index + 1).padStart(2, "0")}</span><div className="option-card-controls"><button className="remove-option" onClick={() => editCard(card.id)} aria-label={`Edit ${card.title}`} title="Edit this card"><span aria-hidden="true">✎</span></button><button className="remove-option" onClick={() => setRemoveCardId(card.id)} aria-label={`Remove ${card.title}`} title="Remove this card"><X size={16} /></button></div></div><div className="option-emoji">{category === "eat" ? ["🍕","🍜","🌮","🍔","🥗"][index % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</div><h3>{card.title}</h3>{card.category && <span className="option-meta">{card.category}</span>}{card.location && <p className="option-location">{card.location}</p>}</Card>)}</div>{error && <p className="inline-error" role="alert">{error}</p>}<div className="workflow-footer sticky-footer"><span>{room.cards.length < 2 ? "Add at least two options before voting." : "Once voting starts, this deck is locked."}</span><div className="review-actions"><Button variant="secondary" onClick={() => setScreen("room")}>Add more options</Button><Button size="lg" trailingIcon={<ArrowRight size={18} />} disabled={!canStartVoting(room)} onClick={() => setConfirmStartOpen(true)}>Lock deck & start voting</Button></div></div></section>}

      {screen === "room" && room && <section className="workflow-screen">
        <div className="room-topline"><Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={() => setScreen("home")}>Home</Button><Badge tone="success">Room created</Badge></div>
        <div className="room-code-card"><div><span className="eyebrow">YOUR ROOM CODE</span><strong>{room.code}</strong><p>Share this code with your crew. QR sharing arrives with room sync.</p></div><Button variant="secondary" size="sm" leadingIcon={<Copy size={15} />} onClick={copyCode}>Copy code</Button></div>
        <SectionHeading eyebrow="BUILD THE DECK" title={room.title} description="Add the choices your group could be happy with. You can edit or remove options before voting starts." action={<Badge>{room.cards.length}/100 cards</Badge>} />
        <div className="add-card-panel">
          <div className="add-card-fields"><TextField label={category === "eat" ? "Restaurant or option name" : "Option name"} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={category === "eat" ? "e.g. Noodle House" : "e.g. Movie night"} onKeyDown={(event) => { if (event.key === "Enter") addCard(); }} /><div className="optional-fields">{category === "eat" && <TextField label="Cuisine / category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="e.g. Thai" /> }<TextField label={category === "eat" ? "Location (optional)" : "Extra detail (optional)"} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder={category === "eat" ? "Neighborhood or address" : "A little context"} /></div></div>
          <div className="add-card-actions"><Button leadingIcon={<Plus size={17} />} onClick={addCard} disabled={!editCardId && (room.cards.length >= 100 || contributionFull)}>{editCardId ? "Save changes" : "Add option"}</Button>{editCardId && <Button variant="quiet" onClick={cancelCardEdit}>Cancel</Button>}</div>
          {error && <p className="inline-error" role="alert">{error}</p>}
        </div>
        {room.cards.length === 0 ? <EmptyState title="Your deck starts here" description="Add at least two options to unlock voting. No need to make this complicated." /> : <div className="option-grid">{room.cards.map((card, index) => <Card className="option-card" key={card.id}><div className="option-card-top"><span className="option-number">{String(index + 1).padStart(2, "0")}</span><div className="option-card-controls"><button className="remove-option" onClick={() => editCard(card.id)} aria-label={`Edit ${card.title}`} title="Edit this card"><span aria-hidden="true">✎</span></button><button className="remove-option" onClick={() => removeCard(card.id)} aria-label={`Remove ${card.title}`} title="Remove this card"><X size={16} /></button></div></div><div className="option-emoji">{category === "eat" ? ["🍕","🍜","🌮","🍔","🥗"][index % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</div><h3>{card.title}</h3>{card.category && <span className="option-meta">{card.category}</span>}{card.location && <p className="option-location">{card.location}</p>}</Card>)}</div>}
        <div className="workflow-footer sticky-footer"><span>{room.contributionMode === "guests-contribute" ? `Your cards: ${myCardCount}/${room.cardLimitPerGuest} · ` : ""}{room.cards.length < 2 ? `Add ${2 - room.cards.length} more option${2 - room.cards.length === 1 ? "" : "s"} to start` : "Deck ready when you are"}</span><Button size="lg" trailingIcon={<ArrowRight size={18} />} disabled={!canStartVoting(room)} onClick={startVoting}>Review deck & vote</Button></div>
      </section>}

      {screen === "ballot-review" && room && <section className="workflow-screen ballot-review-screen"><Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={() => setScreen(room.phase === "tie-breaker" ? "tie" : "vote")}>Back to voting</Button><div className="vote-intro"><Butters mood="thinking" size="md" /><h1>One last look.</h1><p>Make sure your Yup and Nah choices feel right. You can still change any answer before submitting.</p></div><div className="ballot-review-list">{activeCards.map((card, index) => <div className="ballot-review-row" key={card.id}><span className="ballot-review-emoji">{category === "eat" ? ["🍕","🍜","🌮","🍔","🥗"][room.cards.findIndex((item) => item.id === card.id) % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</span><div className="ballot-review-copy"><strong>{card.title}</strong><span>{card.location || card.category || "Your choice"}</span></div><Badge tone={responses[card.id] === "yup" ? "success" : "danger"}>{responses[card.id] === "yup" ? "♥ Yup" : "✕ Nah"}</Badge><Button size="sm" variant="secondary" onClick={() => { setVoteIndex(index); setScreen(room.phase === "tie-breaker" ? "tie" : "vote"); }}>Change</Button></div>)}</div>{error && <p className="inline-error" role="alert">{error}</p>}<div className="workflow-footer"><span>{activeCards.length} answers · one submission</span><Button size="lg" onClick={submitVotes}>Confirm and submit votes <ArrowRight size={17} /></Button></div></section>}

      {(screen === "vote" || screen === "tie") && room && <section className="voting-screen">
        <div className="voting-top"><Badge tone="warning">{screen === "tie" ? "TIE-BREAKER" : "YOUR TURN"}</Badge><span>{Math.min(voteIndex + 1, activeCards.length)} of {activeCards.length}</span></div>
        <div className="vote-intro"><Butters mood="thinking" size="md" /><h1>{screen === "tie" ? "One more little round." : "Could you go for this?"}</h1><p>{screen === "tie" ? "Only the tied options. Let’s break it." : "A Yup says yes. A Nah says no. Trust your gut."}</p></div>
        {activeCards[voteIndex] ? <Card className="vote-card"><div className="vote-card-emoji">{category === "eat" ? ["🍕","🍜","🌮","🍔","🥗"][room.cards.findIndex((card) => card.id === activeCards[voteIndex].id) % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</div><span className="eyebrow">OPTION {voteIndex + 1}</span><h2>{activeCards[voteIndex].title}</h2>{activeCards[voteIndex].category && <p>{activeCards[voteIndex].category}</p>}{activeCards[voteIndex].location && <p>{activeCards[voteIndex].location}</p>}<div className="vote-actions"><Button size="lg" variant="danger" onClick={() => setVote(activeCards[voteIndex].id, "nah")}>✕ Nah</Button><Button size="lg" onClick={() => setVote(activeCards[voteIndex].id, "yup")}>♥ Yup</Button></div></Card> : <EmptyState title="All caught up" description="Your choices are ready to submit." />}
        <div className="voting-bottom"><div className="vote-navigation"><Button variant="quiet" size="sm" disabled={voteIndex === 0} onClick={() => setVoteIndex((index) => Math.max(0, index - 1))}>Previous card</Button><Button variant="quiet" size="sm" disabled={voteIndex >= activeCards.length - 1} onClick={() => setVoteIndex((index) => Math.min(activeCards.length - 1, index + 1))}>Next card</Button></div>{error && <p className="inline-error">{error}</p>}<Button fullWidth size="lg" disabled={activeCards.some((card) => !responses[card.id])} onClick={() => { setError(""); setScreen("ballot-review"); }}>Review my votes <ArrowRight size={17} /></Button><button className="text-action" onClick={() => { if (room) { const ended = applyRoomAction(room, { type: "creator-end-voting", participantId: creatorId }); if (ended.ok) { setRoom(ended.room); if (ended.room.phase === "tie-breaker") setScreen("choose-winner"); else if (ended.room.phase === "winner") setScreen("winner"); else setScreen("choose-winner"); } } }}>End voting early</button></div>
      </section>}

      {screen === "choose-winner" && room && <section className="workflow-screen"><div className="vote-intro"><Butters mood="thinking" size="md" /><h1>{room.phase === "tie-breaker" ? "Still tied!" : "Let’s pick one."}</h1><p>{room.phase === "tie-breaker" ? "One last call. Tap the option that wins for your group." : "Voting ended before anyone submitted. Choose a card to keep things moving."}</p></div><div className="winner-choice-grid">{activeCards.map((card, index) => <button key={card.id} className="winner-choice" onClick={() => chooseWinner(card.id)}><span>{category === "eat" ? ["🍕","🍜","🌮","🍔","🥗"][index % 5] : category === "watch" ? "🎬" : category === "do" ? "🎯" : "💡"}</span><strong>{card.title}</strong><small>Choose winner <ArrowRight size={14} /></small></button>)}</div></section>}

      {screen === "winner" && room && <section className="winner-screen"><div className="confetti" aria-hidden="true">✦　✧　✦　✧　✦</div><Butters mood="celebrating" size="lg" /><Badge tone="success">THE GROUP HAS SPOKEN</Badge><h1>It’s a <span>winner!</span></h1><p className="winner-subtitle">No more waffling. Go make it happen.</p><Card className="winner-card"><div className="winner-emoji">{category === "eat" ? "🍕" : category === "watch" ? "🎬" : category === "do" ? "🎉" : "💡"}</div><h2>{room.cards.find((card) => card.id === room.winnerCardId)?.title ?? "Your group’s pick"}</h2><p>{room.cards.find((card) => card.id === room.winnerCardId)?.location}</p><span className="winner-ribbon">WINNER ✨</span></Card><Button size="lg" onClick={() => setScreen("home")}>Back to home</Button><p className="field-note">This is a local prototype; shared real-time rooms are the next integration step.</p></section>}

      <ConfirmDialog open={confirmStartOpen} title="Lock the deck and start voting?" description="Everyone will vote on this exact set of options. You won’t be able to edit the deck after voting starts." confirmLabel="Lock deck & start" onCancel={() => setConfirmStartOpen(false)} onConfirm={() => { setConfirmStartOpen(false); confirmStartVoting(); }} />
      <ConfirmDialog open={Boolean(removeCardId)} title="Remove this option?" description="This option will be removed from the deck. You can add it again before voting starts." confirmLabel="Remove option" destructive onCancel={() => setRemoveCardId(null)} onConfirm={() => { if (removeCardId) removeCard(removeCardId); setRemoveCardId(null); }} />
      <footer className="site-footer"><span>🧇 Wafflr</span><span>Stop waffling. Start living.</span><button onClick={() => setError(error ? "" : "Wafflr keeps decisions anonymous. No participant names or individual vote details are shown.")} aria-label="About Wafflr"><CircleHelp size={16} /></button></footer>
      {error && screen !== "room" && screen !== "vote" && screen !== "tie" && screen !== "join" && <p className="toast-message" role="status">{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></p>}
    </main>
  );
}
