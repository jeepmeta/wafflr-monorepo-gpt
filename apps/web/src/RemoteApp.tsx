import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Badge, Butters, Button, Card, SectionHeading, TextField } from "@wafflr/ui";
import { createBackend, type RoomCategory, type RoomIdentity, type RoomSnapshot } from "./supabase";
import { ConfirmDialog } from "./components/Modal";

const categories: { id: RoomCategory; title: string; subtitle: string; emoji: string }[] = [
  { id: "eat", title: "Where to eat", subtitle: "Restaurants, snacks, the works", emoji: "🍕" },
  { id: "watch", title: "What to watch", subtitle: "Movies, shows, videos", emoji: "🎬" },
  { id: "do", title: "What to do", subtitle: "Plans, outings, activities", emoji: "🎯" },
  { id: "custom", title: "Custom", subtitle: "Make it your own", emoji: "💡" },
];
const storageKey = "wafflr.room-identity.v1";
const backend = createBackend(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
type Draft = { title: string; category: string; location: string };
const emptyDraft = (): Draft => ({ title: "", category: "", location: "" });

export default function RemoteApp() {
  const [screen, setScreen] = useState<"home" | "setup" | "join">("home");
  const [identity, setIdentity] = useState<RoomIdentity | null>(() => {
    try { const saved = sessionStorage.getItem(storageKey); return saved ? JSON.parse(saved) as RoomIdentity : null; } catch { return null; }
  });
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [category, setCategory] = useState<RoomCategory>("eat");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"open" | "guest-quota">("guest-quota");
  const [quota, setQuota] = useState(2);
  const [joinCode, setJoinCode] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [voteIndex, setVoteIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [result, setResult] = useState<{ winner_card_id: string | null; tally: { card_id: string; yep_count: number }[]; resolution?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [removeCardId, setRemoveCardId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const refreshLock = useRef(false);
  const isHost = identity?.role === "host";
  const cards = snapshot?.cards ?? [];
  const activeCards = useMemo(() => {
    const eligible = snapshot?.active_round_eligible_card_ids;
    return (snapshot?.phase === "voting" || snapshot?.phase === "tie-breaker") && eligible?.length
      ? cards.filter(card => eligible.includes(card.id))
      : cards;
  }, [cards, snapshot?.phase, snapshot?.active_round_eligible_card_ids]);
  const cardById = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);
  const myCards = cards.filter(card => card.submitter_participant_id === identity?.participant_id);
  const currentCategory = categories.find(item => item.id === snapshot?.category) ?? categories[0];
  const winnerCard = result?.winner_card_id ? cardById.get(result.winner_card_id) : null;

  const saveIdentity = useCallback((next: RoomIdentity) => {
    setIdentity(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* session storage may be unavailable */ }
    setSnapshot(null); setResult(null); setResponses({}); setSubmitted(false); setDeadline(null); setError("");
  }, []);

  const refresh = useCallback(async (quiet = false) => {
    if (!identity || refreshLock.current) return;
    refreshLock.current = true;
    try {
      const next = await backend.snapshot(identity);
      setSnapshot(next);
      if (next.active_round_id && (next.phase === "winner" || next.phase === "tie-result" || next.phase === "closed")) {
        try { const r = await backend.roundResults(identity, next.active_round_id); setResult(r); } catch { /* result is not available for an unresolved or empty round */ }
      }
      if (!quiet) setError("");
    } catch (cause) {
      if (!quiet) setError(cause instanceof Error ? cause.message : "Could not load this room.");
    } finally { refreshLock.current = false; }
  }, [identity]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("room");
    if (!identity && inviteCode) { setJoinCode(inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)); setScreen("join"); }
  }, [identity]);

  useEffect(() => {
    if (!identity) return;
    void refresh();
    const poll = window.setInterval(() => { void refresh(true); }, 3000);
    const beat = window.setInterval(() => { void backend.heartbeat(identity).catch(() => undefined); }, 60000);
    return () => { window.clearInterval(poll); window.clearInterval(beat); };
  }, [identity, refresh]);

  useEffect(() => {
    if (!identity || !snapshot?.active_round_id || snapshot.role !== "host" || !submitted) return;
    let active = true;
    const tryResolve = async () => {
      if (!active) return;
      try {
        if (deadline && Date.now() < Date.parse(deadline)) return;
        const resolved = await backend.resolveRound(identity, snapshot.active_round_id!);
        if (!active) return;
        setResult(resolved);
        setSubmitted(false);
        await refresh(true);
      } catch { /* Other participants may still be voting; retry on the next poll. */ }
    };
    const timer = window.setInterval(() => { void tryResolve(); }, 4000);
    void tryResolve();
    return () => { active = false; window.clearInterval(timer); };
  }, [identity, snapshot?.active_round_id, snapshot?.phase, submitted, deadline, refresh]);

  async function perform<T>(action: () => Promise<T>, onSuccess?: (value: T) => void) {
    setBusy(true); setError("");
    try { const value = await action(); onSuccess?.(value); await refresh(true); return value; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again."); return null; }
    finally { setBusy(false); }
  }

  async function createRoom() {
    const trimmed = title.trim();
    if (!trimmed) { setError("Give your decision a title first."); return; }
    const created = await perform(() => backend.createRoom({ title: trimmed, category, contributionMode: mode, quota: mode === "guest-quota" ? quota : null }));
    if (created) { saveIdentity(created); setScreen("home"); }
  }
  async function joinRoom() {
    const joined = await perform(() => backend.joinRoom(joinCode.trim().toUpperCase()));
    if (joined) { saveIdentity(joined); setScreen("home"); }
  }
  async function addCard() {
    if (!identity || !draft.title.trim()) { setError("Give this option a name first."); return; }
    const data = { title: draft.title.trim(), ...(draft.category.trim() ? { category: draft.category.trim() } : {}), ...(draft.location.trim() ? { location: draft.location.trim() } : {}) };
    const saved = editCardId
      ? await perform(() => backend.editCard(identity, editCardId, data))
      : await perform(() => backend.addCard(identity, data));
    if (saved) { setDraft(emptyDraft()); setEditCardId(null); }
  }
  function editExistingCard(cardId: string) {
    const card = cardById.get(cardId);
    if (!card) return;
    setDraft({ title: card.category_data.title ?? "", category: card.category_data.category ?? "", location: card.category_data.location ?? "" });
    setEditCardId(card.id);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() { setDraft(emptyDraft()); setEditCardId(null); setError(""); }
  async function removeCard(cardId: string) {
    if (!identity) return;
    await perform(() => backend.removeCard(identity, cardId));
  }
  async function startVoting() {
    if (!identity) return;
    const started = await perform(() => backend.startVoting(identity));
    if (started) { setResponses({}); setVoteIndex(0); setSubmitted(false); }
  }
  function chooseVote(cardId: string, approved: boolean) {
    setResponses(current => ({ ...current, [cardId]: approved }));
    setVoteIndex(current => Math.min(activeCards.length - 1, current + 1));
  }
  async function submitBallot() {
    if (!identity || !snapshot?.active_round_id) return;
    if (activeCards.some(card => responses[card.id] === undefined)) { setError("Choose Yup or Nah for every option."); return; }
    const answer = await perform(() => backend.submitBallot(identity, snapshot.active_round_id!, activeCards.map(card => ({ card_id: card.id, approved: responses[card.id] }))));
    if (answer) { setSubmitted(true); setError(""); }
  }
  async function endEarly() {
    if (!identity) return;
    const ended = await perform(() => backend.endVotingEarly(identity));
    if (ended) { setDeadline(ended.submission_deadline); setSubmitted(true); setError("Voting is closing. Everyone has one minute to finish their ballot."); }
  }
  async function chooseNoBallot(cardId: string) {
    if (!identity || !snapshot?.active_round_id) return;
    await perform(() => backend.chooseNoBallotWinner(identity, snapshot.active_round_id!, cardId));
    await refresh(true);
  }
  async function startTieBreaker() {
    if (!identity) return;
    const started = await perform(() => backend.startTieBreaker(identity));
    if (started) { setResponses({}); setVoteIndex(0); setSubmitted(false); setDeadline(null); setResult(null); }
  }
  async function chooseTieWinner(cardId: string) {
    if (!identity) return;
    await perform(() => backend.chooseTieWinner(identity, cardId));
    await refresh(true);
  }
  async function leaveTieUnresolved() {
    if (!identity) return;
    await perform(() => backend.leaveTieUnresolved(identity));
    await refresh(true);
  }
  async function closeRoom() {
    if (!identity) return;
    await perform(() => backend.closeRoom(identity));
    await refresh(true);
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(snapshot?.room_code ?? identity?.room_code ?? ""); setError("Room code copied."); }
    catch { setError("Copy failed. Select the room code and copy it manually."); }
  }
  async function shareInvite() {
    const code = snapshot?.room_code ?? identity?.room_code;
    if (!code) return;
    const inviteUrl = new URL(window.location.href);
    inviteUrl.searchParams.set("room", code);
    inviteUrl.hash = "";
    const shareData = { title: snapshot?.title ?? identity?.title ?? "Join my Wafflr room", text: `Join my Wafflr decision room with code ${code}.`, url: inviteUrl.toString() };
    try {
      if (typeof navigator.share === "function") { await navigator.share(shareData); setError("Invite ready to share."); }
      else { await navigator.clipboard.writeText(inviteUrl.toString()); setError("Invite link copied. Send it to your group."); }
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      try { await navigator.clipboard.writeText(inviteUrl.toString()); setError("Invite link copied. Send it to your group."); }
      catch { setError(`Share this room code: ${code}`); }
    }
  }
  function leaveRoom() { setConfirmLeaveOpen(true); }
  function confirmLeaveRoom() {
    try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
    setIdentity(null); setSnapshot(null); setResult(null); setScreen("home"); setError("");
    setConfirmLeaveOpen(false);
  }

  if (!identity) return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setScreen("home")}><span className="brand-mark">🧇</span><span>wafflr</span></button><span className="topbar-tag">Stop waffling. Start living.</span></header>
    {screen === "home" && <section className="home-layout"><div className="home-copy"><Badge tone="warning"><Sparkles size={13} /> SHARED GROUP DECISIONS</Badge><h1>Less waffling.<br /><span>More living.</span></h1><p className="hero-description">Create a room, share the code, and let everyone vote together. No accounts or names required.</p><div className="home-actions"><Button size="lg" trailingIcon={<ArrowRight size={18} />} onClick={() => { setScreen("setup"); setError(""); }}>Create a room</Button><Button size="lg" variant="secondary" onClick={() => { setScreen("join"); setError(""); }}>Join a room</Button></div><p className="microcopy">🧇 Rooms sync across devices. Participant secrets stay in this browser session.</p></div><div className="hero-art"><Card className="preview-card"><div className="preview-header"><div><span className="eyebrow">ONE ROOM. ONE DECISION.</span><h2>Where should we eat?</h2></div><span className="mini-avatar">👥</span></div><div className="food-art">🍕</div><div className="preview-option"><div><h3>Everyone gets a say</h3><p>One shared deck. A group decision.</p></div><span className="yes-chip">Yup!</span></div></Card><div className="butters-float"><Butters mood="celebrating" size="lg" /><span>Let’s pick!</span></div></div></section>}
    {screen === "setup" && <section className="workflow-screen"><Button variant="quiet" leadingIcon={<ArrowLeft size={17} />} onClick={() => setScreen("home")}>Back home</Button><SectionHeading eyebrow="STEP 1 OF 2" title="What are we deciding?" description="Pick a category and give your room a title."/><div className="room-title-field"><TextField label="Decision title" value={title} onChange={event => setTitle(event.target.value.slice(0,80))} placeholder="e.g. Where should we eat?" maxLength={80} required/></div><div className="category-grid">{categories.map(item => <button key={item.id} className={`category-choice ${category === item.id ? "is-selected" : ""}`} onClick={() => setCategory(item.id)}><span className="category-icon">{item.emoji}</span><span className="category-title">{item.title}</span><span className="category-subtitle">{item.subtitle}</span>{category === item.id && <span className="selected-check"><Check size={14}/></span>}</button>)}</div><SectionHeading title="Who’s adding options?" description="The creator is a regular participant, too."/><div className="mode-grid"><button className={`mode-choice ${mode === "open" ? "is-selected" : ""}`} onClick={() => setMode("open")}><span className="mode-emoji">🧇</span><strong>I’ll add the options</strong><span>I’ll build the deck, then everyone votes.</span></button><button className={`mode-choice ${mode === "guest-quota" ? "is-selected" : ""}`} onClick={() => setMode("guest-quota")}><span className="mode-emoji">🙌</span><strong>Everyone contributes</strong><span>Everyone can add their own options before voting.</span></button></div>{mode === "guest-quota" && <div className="quota-row"><div><strong>Cards per guest</strong><p>Unused slots can be skipped with “I’m done”.</p></div><div className="quota-picker">{[1,2,3].map(n => <button key={n} className={quota === n ? "active" : ""} aria-pressed={quota === n} onClick={() => setQuota(n)}>{n}</button>)}</div></div>}{error && <p className="inline-error" role="alert">{error}</p>}<div className="workflow-footer"><span>2–100 options · Anonymous participation</span><Button size="lg" disabled={busy} onClick={() => void createRoom()}>Create room <ArrowRight size={18}/></Button></div></section>}
    {screen === "join" && <section className="narrow-screen"><Button variant="quiet" leadingIcon={<ArrowLeft size={17}/>} onClick={() => setScreen("home")}>Back</Button><Card className="form-card"><Butters size="md"/><SectionHeading title="Join the decision" description="Enter the room code shared by your host."/><TextField label="Room code" value={joinCode} onChange={event => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,12))} placeholder="12-character code" autoCapitalize="characters"/>{error && <p className="inline-error" role="alert">{error}</p>}<Button fullWidth disabled={busy || joinCode.trim().length < 4} onClick={() => void joinRoom()}>Join room</Button></Card></section>}
    {error && <p className="toast-message" role="status">{error}<button onClick={() => setError("")}>×</button></p>}<footer className="site-footer"><span>🧇 Wafflr</span><span>Shared rooms · No accounts</span><span/></footer>
  </main>;

  const phase = snapshot?.phase ?? identity.phase;
  const isVoting = phase === "voting" || phase === "tie-breaker";
  const winnerId = result?.winner_card_id ?? null;
  const currentVoteCard = activeCards[Math.min(voteIndex, Math.max(0, activeCards.length - 1))];
  const eligibleTieCards = result?.tally?.filter(item => item.yep_count === Math.max(...(result?.tally ?? []).map(x => x.yep_count))).map(item => cardById.get(item.card_id)).filter((card): card is NonNullable<typeof card> => Boolean(card)) ?? [];

  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => { setError(""); void refresh(); }}><span className="brand-mark">🧇</span><span>wafflr</span></button><span className="topbar-tag">Stop waffling. Start living.</span></header>
    <section className="workflow-screen">
      <div className="room-topline"><Button variant="quiet" leadingIcon={<ArrowLeft size={17}/>} onClick={leaveRoom}>Leave room</Button><Badge tone={phase === "winner" ? "success" : "warning"}>{phase.replaceAll("-", " ")}</Badge></div>
      <div className="room-code-card"><div><span className="eyebrow">ROOM CODE · SHARE WITH YOUR CREW</span><strong>{snapshot?.room_code ?? identity.room_code}</strong><p>{snapshot?.title ?? identity.title} · {currentCategory.title}</p></div><div className="room-code-actions"><Button variant="secondary" size="sm" leadingIcon={<Copy size={15}/>} onClick={() => void copyCode()}>Copy code</Button><Button size="sm" leadingIcon={<ArrowRight size={15}/>} onClick={() => void shareInvite()}>Share invite</Button></div></div>
      {!snapshot && <Card className="form-card"><RefreshCw size={24}/><SectionHeading title="Connecting to your room…" description="Loading the latest room state."/><Button variant="secondary" onClick={() => void refresh()}>Retry connection</Button></Card>}
      {snapshot && (phase === "setup" || phase === "collecting" || phase === "reviewing") && <><SectionHeading eyebrow={isHost ? "HOST VIEW" : "GUEST VIEW"} title={snapshot.title} description={snapshot.contribution_done ? "You’ve marked yourself done. Wait for the host to start voting." : "Add your choices. Everyone can see the shared deck update as you go."} action={<Badge>{cards.length}/100 cards</Badge>}/>{!snapshot.contribution_done && <div className="add-card-panel"><div className="add-card-fields"><TextField label="Option name" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder={snapshot.category === "eat" ? "e.g. Noodle House" : "e.g. Movie night"} maxLength={160}/><div className="optional-fields"><TextField label={snapshot.category === "eat" ? "Cuisine / category (optional)" : "Type (optional)"} value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} placeholder="e.g. Thai"/><TextField label={snapshot.category === "eat" ? "Location (optional)" : "Extra detail (optional)"} value={draft.location} onChange={event => setDraft({ ...draft, location: event.target.value })} placeholder="Neighborhood or context"/></div></div><div className="add-card-actions"><Button disabled={busy || (!editCardId && cards.length >= 100)} leadingIcon={editCardId ? <Check size={17}/> : <Plus size={17}/>} onClick={() => void addCard()}>{editCardId ? "Save changes" : "Add option"}</Button>{editCardId && <Button variant="quiet" onClick={cancelEdit}>Cancel</Button>}</div></div>}{cards.length > 0 ? <div className="option-grid">{cards.map((card, index) => <Card className="option-card" key={card.id}><div className="option-card-top"><span className="option-number">{String(index + 1).padStart(2,"0")}</span>{(card.submitter_participant_id === identity.participant_id || isHost) && !snapshot.contribution_done && <div className="option-card-controls"><button className="remove-option" aria-label={`Edit ${card.category_data.title ?? "option"}`} onClick={() => editExistingCard(card.id)}><Pencil size={15}/></button><button className="remove-option" aria-label={`Remove ${card.category_data.title ?? "option"}`} onClick={() => setRemoveCardId(card.id)}><Trash2 size={15}/></button></div>}</div><div className="option-emoji">{currentCategory.emoji}</div><h3>{card.category_data.title ?? "Untitled option"}</h3>{card.category_data.category && <span className="option-meta">{card.category_data.category}</span>}{card.category_data.location && <p className="option-location">{card.category_data.location}</p>}</Card>)}</div> : <Card className="form-card"><Butters mood="thinking"/><SectionHeading title="Your deck starts here" description="Add at least two options before voting can begin."/></Card>}{snapshot.contribution_mode === "guest-quota" && !snapshot.contribution_done && <div className="workflow-footer"><span>Your cards: {myCards.length}/{snapshot.cards_per_participant ?? "—"} · Unused slots are okay.</span><Button variant="secondary" disabled={busy} onClick={() => void perform(() => backend.finishContribution(identity))}>I’m done adding cards</Button></div>}{isHost && <div className="workflow-footer"><span>{cards.length < 2 ? "Add at least two options to start voting." : "The deck locks when voting starts."}</span><Button size="lg" disabled={busy || cards.length < 2} onClick={() => setConfirmStartOpen(true)}>Review deck & start voting <ArrowRight size={18}/></Button></div>}</>}
      {snapshot && isVoting && <><div className="vote-intro"><Butters mood="thinking" size="md"/><h1>{phase === "tie-breaker" ? "Final round!" : "Cast your votes"}</h1><p>{submitted ? "Your ballot is in. Waiting for the rest of the crew…" : "Yup if you’re into it. Nah if you’re not. Every card gets a vote."}</p></div>{!submitted && currentVoteCard && <><div className="voting-top"><span>OPTION {voteIndex + 1} OF {activeCards.length}</span><span>{Object.keys(responses).length} of {activeCards.length} answered</span></div><Card className="vote-card"><div className="vote-card-emoji">{currentCategory.emoji}</div><h2>{currentVoteCard.category_data.title ?? "Untitled option"}</h2>{currentVoteCard.category_data.location && <p>{currentVoteCard.category_data.location}</p>}<div className="vote-actions"><Button size="lg" variant="danger" onClick={() => chooseVote(currentVoteCard.id, false)}>✕ Nah</Button><Button size="lg" onClick={() => chooseVote(currentVoteCard.id, true)}>♥ Yup</Button></div></Card><div className="vote-navigation"><Button variant="quiet" disabled={voteIndex === 0} onClick={() => setVoteIndex(i => Math.max(0,i-1))}>Previous</Button><Button variant="quiet" disabled={voteIndex >= activeCards.length - 1} onClick={() => setVoteIndex(i => Math.min(activeCards.length - 1,i+1))}>Next</Button></div><Button fullWidth size="lg" disabled={busy || activeCards.some(card => responses[card.id] === undefined)} onClick={() => void submitBallot()}>Submit ballot <Check size={18}/></Button></>}{isHost && <button className="text-action" onClick={() => void endEarly()}>End voting early (1-minute grace)</button>}{isHost && deadline && Date.now() >= Date.parse(deadline) && <div className="workflow-screen"><p className="field-note">If nobody submitted a ballot during the grace period, choose a fallback winner:</p><div className="winner-choice-grid">{activeCards.map(card => <button className="winner-choice" key={card.id} onClick={() => void chooseNoBallot(card.id)}><span>{currentCategory.emoji}</span><strong>{card.category_data.title ?? "Untitled option"}</strong><small>Choose fallback <ArrowRight size={14}/></small></button>)}</div></div>}{error && <p className="inline-error" role="alert">{error}</p>}</>}
      {snapshot && phase === "tie-result" && <><div className="vote-intro"><Butters mood="thinking" size="md"/><h1>It’s a tie!</h1><p>Host can run one tie-breaker or choose from the tied options.</p></div>{result?.tally?.length ? <div className="results-tally"><h2>Group tally</h2>{result.tally.slice().sort((a, b) => b.yep_count - a.yep_count).map(item => { const card = cardById.get(item.card_id); if (!card) return null; return <div className="results-tally-row" key={item.card_id}><span>{card.category_data.title ?? "Untitled option"}</span><strong>{item.yep_count} Yup{item.yep_count === 1 ? "" : "s"}</strong></div>; })}</div> : null}{isHost && <div className="winner-choice-grid">{eligibleTieCards.map(card => <button className="winner-choice" key={card.id} onClick={() => void chooseTieWinner(card.id)}><span>{currentCategory.emoji}</span><strong>{card.category_data.title}</strong><small>Choose winner <ArrowRight size={14}/></small></button>)}</div>}{isHost && <Button fullWidth size="lg" disabled={busy} onClick={() => void startTieBreaker()}>Start one tie-breaker round</Button>}{isHost && <button className="text-action" disabled={busy} onClick={() => void leaveTieUnresolved()}>Leave the tie unresolved and close the room</button>}{!isHost && <p className="field-note">The host is deciding how to resolve the tie.</p>}</>}
      {snapshot && (phase === "winner" || (phase === "closed" && Boolean(winnerId))) && <div className="winner-screen"><div className="confetti">✦　✧　✦　✧　✦</div><Butters mood="celebrating" size="lg"/><Badge tone="success">THE GROUP HAS SPOKEN</Badge><h1>It’s a <span>winner!</span></h1><p className="winner-subtitle">No more waffling. Go make it happen.</p><Card className="winner-card"><div className="winner-emoji">{currentCategory.emoji}</div><h2>{winnerCard?.category_data.title ?? "Your group’s pick"}</h2><p>{winnerCard?.category_data.location}</p><span className="winner-ribbon">WINNER ✨</span></Card>{result?.tally?.length ? <div className="results-tally"><h2>Group tally</h2>{result.tally.slice().sort((a, b) => b.yep_count - a.yep_count).map(item => { const card = cardById.get(item.card_id); if (!card) return null; return <div className="results-tally-row" key={item.card_id}><span>{card.category_data.title ?? "Untitled option"}</span><strong>{item.yep_count} Yup{item.yep_count === 1 ? "" : "s"}</strong></div>; })}</div> : null}{phase === "winner" && isHost ? <Button size="lg" disabled={busy} onClick={() => setConfirmCloseOpen(true)}>Close room · keep results for 24 hours</Button> : <Button size="lg" onClick={leaveRoom}>Back to home</Button>}{phase === "closed" && <p className="field-note">This room is closed. Results remain available for up to 24 hours.</p>}</div>}
      {snapshot && phase === "closed" && !winnerId && <Card className="form-card"><SectionHeading title={result?.resolution === "tie" ? "The group left it tied" : "This room has closed"} description="The room is closed. Operational data is retained for up to 24 hours."/></Card>}
      {error && !isVoting && <p className="inline-error" role="alert">{error}</p>}
      <div className="workflow-footer"><span>Updates automatically every few seconds.</span><Button variant="quiet" leadingIcon={<RefreshCw size={15}/>} onClick={() => void refresh()}>Refresh</Button></div>
    </section>
    <ConfirmDialog open={confirmStartOpen} title="Lock the deck and start voting?" description="Everyone will vote on this exact set of options. You won’t be able to add, edit, or remove cards once voting begins." confirmLabel="Lock deck & start" onCancel={() => setConfirmStartOpen(false)} onConfirm={() => { setConfirmStartOpen(false); void startVoting(); }} />
    <ConfirmDialog open={Boolean(removeCardId)} title="Remove this option?" description="This option will disappear from the shared deck for everyone. This can’t be undone." confirmLabel="Remove option" destructive onCancel={() => setRemoveCardId(null)} onConfirm={() => { if (removeCardId) void removeCard(removeCardId); setRemoveCardId(null); }} />
    <ConfirmDialog open={confirmCloseOpen} title="Close this room?" description="The room will stop accepting activity. Results will remain available for up to 24 hours." confirmLabel="Close room" destructive onCancel={() => setConfirmCloseOpen(false)} onConfirm={() => { setConfirmCloseOpen(false); void closeRoom(); }} />
    <ConfirmDialog open={confirmLeaveOpen} title="Leave this room?" description="You’ll leave this room on this device. To return, you’ll need to join again with the room code." confirmLabel="Leave room" destructive onCancel={() => setConfirmLeaveOpen(false)} onConfirm={confirmLeaveRoom} />
    <footer className="site-footer"><span>🧇 Wafflr</span><span>Shared rooms · No accounts</span><span/></footer>
  </main>;
}
