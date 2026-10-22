import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Badge, Butters, Button, Card, SectionHeading, TextField } from "@wafflr/ui";
import { createBackend, type RoomCategory, type RoomHistoryEntry, type RoomIdentity, type RoomSnapshot } from "./supabase";
import { ConfirmDialog } from "./components/Modal";
import { RemoteSetupWizard } from "./screens/setup/RemoteSetupWizard";
import { QRScannerScreen, RoomIntroScreen, ShareRoomDialog, TalliesDialog, WaitingScreen } from "./screens/room/CatalogScreens";
import { HostFinalReview } from "./screens/room/HostFinalReview";
import { YourRoomsDialog } from "./YourRoomsDialog";
import { BallotReviewDialog } from "./BallotReviewDialog";
import { TieBreakIntroScreen } from "./screens/results/TieBreakIntroScreen";
import { ErrorRecoveryScreen } from "./screens/room/CatalogScreens";
import "./screens/room/CatalogScreens.css";

const categories: { id: RoomCategory; title: string; subtitle: string; emoji: string }[] = [
  { id: "eat", title: "Where to eat", subtitle: "Restaurants, snacks, the works", emoji: "🍕" },
  { id: "watch", title: "What to watch", subtitle: "Movies, shows, videos", emoji: "🎬" },
  { id: "do", title: "What to do", subtitle: "Plans, outings, activities", emoji: "🎯" },
  { id: "custom", title: "Custom", subtitle: "Make it your own", emoji: "💡" },
];
const storageKey = "wafflr.room-identity.v1";
const historyKey = "wafflr.room-history.v1";
function readRoomHistory(): RoomHistoryEntry[] { try { const value = localStorage.getItem(historyKey); return value ? JSON.parse(value) as RoomHistoryEntry[] : []; } catch { return []; } }
const backend = createBackend(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
type Draft = { title: string; category: string; location: string };
const emptyDraft = (): Draft => ({ title: "", category: "", location: "" });

export default function RemoteApp() {
  const [screen, setScreen] = useState<"home" | "setup" | "join" | "scanner">("home");
  const [showIntro, setShowIntro] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showTallies, setShowTallies] = useState(false);
  const [showYourRooms, setShowYourRooms] = useState(false);
  const [hostReviewOpen, setHostReviewOpen] = useState(false);
  const [ballotReviewOpen, setBallotReviewOpen] = useState(false);
  const [tieIntroOpen, setTieIntroOpen] = useState(false);
  const finishTieIntro = useCallback(() => setTieIntroOpen(false), []);
  const [roomHistory, setRoomHistory] = useState<RoomHistoryEntry[]>(readRoomHistory);
  const [roomIcon, setRoomIcon] = useState("🧇");
  const [clockNow, setClockNow] = useState(Date.now());
  const [identity, setIdentity] = useState<RoomIdentity | null>(() => {
    try { const saved = sessionStorage.getItem(storageKey); if (saved) return JSON.parse(saved) as RoomIdentity; } catch { /* fall back to persistent history */ }
    return readRoomHistory()[0] ?? null;
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
  const [confirmEndVotingOpen, setConfirmEndVotingOpen] = useState(false);
  const [confirmLeaveTieOpen, setConfirmLeaveTieOpen] = useState(false);
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
    setRoomHistory(current => {
      const entry: RoomHistoryEntry = { ...next, last_opened_at: new Date().toISOString() };
      const updated = [entry, ...current.filter(room => room.room_id !== next.room_id)].slice(0, 50);
      try { localStorage.setItem(historyKey, JSON.stringify(updated)); } catch { /* local history may be disabled */ }
      return updated;
    });
    setSnapshot(null); setResult(null); setResponses({}); setSubmitted(false); setDeadline(null); setError("");
  }, []);

  const refresh = useCallback(async (quiet = false) => {
    if (!identity || refreshLock.current) return;
    refreshLock.current = true;
    try {
      const next = await backend.snapshot(identity);
      setSnapshot(next);
      setRoomHistory(current => {
        const updated = current.map(room => room.room_id === next.room_id ? { ...room, title: next.title, category: next.category, room_icon: next.room_icon, expires_at: next.expires_at, phase: next.phase, contribution_mode: next.contribution_mode, cards_per_participant: next.cards_per_participant } : room);
        try { localStorage.setItem(historyKey, JSON.stringify(updated)); } catch { /* local history may be disabled */ }
        return updated;
      });
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
    setRoomHistory(current => {
      if (current.some(room => room.room_id === identity.room_id)) return current;
      const updated = [{ ...identity, last_opened_at: new Date().toISOString() }, ...current].slice(0, 50);
      try { localStorage.setItem(historyKey, JSON.stringify(updated)); } catch { /* local history may be disabled */ }
      return updated;
    });
  }, [identity]);

  useEffect(() => {
    if (!identity) return;
    void refresh();
    const poll = window.setInterval(() => { void refresh(true); }, 3000);
    const beat = window.setInterval(() => { void backend.heartbeat(identity).catch(() => undefined); }, 60000);
    return () => { window.clearInterval(poll); window.clearInterval(beat); };
  }, [identity, refresh]);

  useEffect(() => {
    if (!snapshot?.contribution_deadline) return;
    const deadlineAt = Date.parse(snapshot.contribution_deadline);
    if (deadlineAt <= Date.now()) return;
    const timer = window.setInterval(() => {
      const now = Date.now(); setClockNow(now);
      if (now >= deadlineAt) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [snapshot?.contribution_deadline]);

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
    if (created) {
      try { await backend.setRoomIcon(created, roomIcon); } catch (cause) { setError(cause instanceof Error ? cause.message : "Room created, but the icon could not be saved."); }
      saveIdentity({ ...created, room_icon: roomIcon }); setScreen("home");
    }
  }
  async function joinRoom() {
    const joined = await perform(() => backend.joinRoom(joinCode.trim().toUpperCase()));
    if (joined) { saveIdentity(joined); setShowIntro(true); setScreen("home"); }
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
  async function startContributionCutoff() {
    if (!identity) return;
    const cutoff = await perform(() => backend.beginContributionCutoff(identity));
    if (cutoff) { setError("Contribution cutoff started. Everyone has one minute to finish."); setClockNow(Date.now()); }
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
    if (started) { setResponses({}); setVoteIndex(0); setSubmitted(false); setDeadline(null); setResult(null); setTieIntroOpen(true); }
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
    const shareData = { title: snapshot?.title ?? identity?.title ?? "Join my Wafflr room", text: `Join my Wafflr decision room with code ${code}.` };
    try {
      if (typeof navigator.share === "function") { await navigator.share(shareData); setError("Room code ready to share."); }
      else { await navigator.clipboard.writeText(code); setError("Room code copied. Send it to your group."); }
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      try { await navigator.clipboard.writeText(code); setError("Room code copied. Send it to your group."); }
      catch { setError(`Share this room code: ${code}`); }
    }
  }
  function forgetRoom(room: RoomHistoryEntry) {
    setRoomHistory(current => {
      const updated = current.filter(item => item.room_id !== room.room_id);
      try { localStorage.setItem(historyKey, JSON.stringify(updated)); } catch { /* local history may be disabled */ }
      return updated;
    });
    if (identity?.room_id === room.room_id) {
      try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
      setIdentity(null); setSnapshot(null); setResult(null);
    }
  }
  function openHistoryRoom(room: RoomHistoryEntry) {
    saveIdentity(room); setShowYourRooms(false); setShowIntro(false); setScreen("home");
  }
  function leaveRoom() { setConfirmLeaveOpen(true); }
  function confirmLeaveRoom() {
    try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
    setIdentity(null); setSnapshot(null); setResult(null); setScreen("home"); setError("");
    setConfirmLeaveOpen(false);
  }

  if (!identity) return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setScreen("home")}><span className="brand-mark">🧇</span><span>wafflr</span></button><button className="topbar-rooms" onClick={() => setShowYourRooms(true)}>Your Rooms <span>{roomHistory.length}</span></button><span className="topbar-tag">Stop waffling. Start living.</span></header>
    {screen === "home" && <section className="home-layout"><div className="home-copy"><Badge tone="warning"><Sparkles size={13} /> SHARED GROUP DECISIONS</Badge><h1>Less waffling.<br /><span>More living.</span></h1><p className="hero-description">Create a room, share the code, and let everyone vote together. No accounts or names required.</p><div className="home-actions"><Button size="lg" trailingIcon={<ArrowRight size={18} />} onClick={() => { setScreen("setup"); setError(""); }}>Create a room</Button><Button size="lg" variant="secondary" onClick={() => { setScreen("join"); setError(""); }}>Join a room</Button></div><p className="microcopy">🧇 Rooms sync across devices. Participant secrets stay in this browser session.</p></div><div className="hero-art"><Card className="preview-card"><div className="preview-header"><div><span className="eyebrow">ONE ROOM. ONE DECISION.</span><h2>Where should we eat?</h2></div><span className="mini-avatar">👥</span></div><div className="food-art">🍕</div><div className="preview-option"><div><h3>Everyone gets a say</h3><p>One shared deck. A group decision.</p></div><span className="yes-chip">Yup!</span></div></Card><div className="butters-float"><Butters mood="celebrating" size="lg" /><span>Let’s pick!</span></div></div></section>}
    {screen === "setup" && <RemoteSetupWizard title={title} onTitleChange={setTitle} category={category} onCategoryChange={setCategory} roomIcon={roomIcon} onRoomIconChange={setRoomIcon} mode={mode} onModeChange={setMode} quota={quota} onQuotaChange={setQuota} error={error} busy={busy} onBack={() => { setError(""); setScreen("home"); }} onCreate={() => void createRoom()} />}
    {screen === "join" && <section className="narrow-screen"><Button variant="quiet" leadingIcon={<ArrowLeft size={17}/>} onClick={() => setScreen("home")}>Back</Button><Card className="form-card"><Butters size="md"/><SectionHeading title="Join the decision" description="Enter the room code shared by your host, or scan its QR code."/><TextField label="Room code" value={joinCode} onChange={event => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,12))} placeholder="12-character code" autoCapitalize="characters"/>{error && <p className="inline-error" role="alert">{error}</p>}<Button fullWidth disabled={busy || joinCode.trim().length < 4} onClick={() => void joinRoom()}>Join room</Button><Button fullWidth variant="secondary" onClick={() => setScreen("scanner")}>Scan QR code</Button></Card></section>}
    {screen === "scanner" && <QRScannerScreen onCode={code => { setJoinCode(code); setScreen("join"); }} onBack={() => setScreen("join")} />}
    {error && <p className="toast-message" role="status">{error}<button onClick={() => setError("")}>×</button></p>}<YourRoomsDialog open={showYourRooms} onClose={() => setShowYourRooms(false)} rooms={roomHistory} onOpen={openHistoryRoom} onForget={forgetRoom} />
    <footer className="site-footer"><span>🧇 Wafflr</span><span>Shared rooms · No accounts</span><span/></footer>
  </main>;

  const phase = snapshot?.phase ?? identity.phase;
  const cutoffRemaining = snapshot?.contribution_deadline ? Math.max(0, Math.ceil((Date.parse(snapshot.contribution_deadline) - clockNow) / 1000)) : null;
  const isVoting = phase === "voting" || phase === "tie-breaker";
  const winnerId = result?.winner_card_id ?? null;
  const currentVoteCard = activeCards[Math.min(voteIndex, Math.max(0, activeCards.length - 1))];
  const eligibleTieCards = result?.tally?.filter(item => item.yep_count === Math.max(...(result?.tally ?? []).map(x => x.yep_count))).map(item => cardById.get(item.card_id)).filter((card): card is NonNullable<typeof card> => Boolean(card)) ?? [];

  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => { setError(""); void refresh(); }}><span className="brand-mark">{snapshot?.room_icon ?? identity.room_icon ?? "🧇"}</span><span>wafflr</span></button><button className="topbar-rooms" onClick={() => setShowYourRooms(true)}>Your Rooms <span>{roomHistory.length}</span></button><span className="topbar-tag">Stop waffling. Start living.</span></header>
    <section className={`workflow-screen ${showIntro ? "intro-active" : ""}`}>
      {showIntro && snapshot && <RoomIntroScreen title={snapshot.title} category={currentCategory.title} onContinue={() => setShowIntro(false)} />}
      {snapshot && snapshot.contribution_mode === "guest-quota" && ["setup", "collecting", "reviewing"].includes(phase) && (isHost || snapshot.contribution_deadline !== null) && <div className="contribution-cutoff-panel"><div><strong>{cutoffRemaining === null ? "Ready to close contributions?" : cutoffRemaining > 0 ? "Contribution cutoff is running" : "Contribution window ended"}</strong><p>{cutoffRemaining === null ? "Give everyone one final minute to finish their options. New cards and edits stop when the timer ends." : cutoffRemaining > 0 ? "The deck stays editable during this grace period." : "New submissions and edits are now blocked by the room service."}</p></div>{isHost && cutoffRemaining === null ? <Button variant="secondary" disabled={busy} onClick={() => void startContributionCutoff()}>Start 1-minute cutoff</Button> : cutoffRemaining !== null ? <span className="cutoff-countdown" role="timer">{Math.floor(cutoffRemaining/60)}:{String(cutoffRemaining%60).padStart(2,"0")}</span> : null}</div>}
      <div className="room-topline"><Button variant="quiet" leadingIcon={<ArrowLeft size={17}/>} onClick={leaveRoom}>Leave room</Button><Badge tone={phase === "winner" ? "success" : "warning"}>{phase.replaceAll("-", " ")}</Badge></div>
      <div className="room-code-card"><div><span className="eyebrow">ROOM CODE · SHARE WITH YOUR CREW</span><strong>{snapshot?.room_code ?? identity.room_code}</strong><p>{snapshot?.title ?? identity.title} · {currentCategory.title}</p></div><div className="room-code-actions"><Button variant="secondary" size="sm" leadingIcon={<Copy size={15}/>} onClick={() => void copyCode()}>Copy code</Button><Button size="sm" leadingIcon={<ArrowRight size={15}/>} onClick={() => setShareOpen(true)}>Share room</Button></div></div>
      {!snapshot && error ? <ErrorRecoveryScreen message={error} onRetry={() => void refresh()} onBack={() => setError("")} /> : !snapshot && <Card className="form-card"><RefreshCw size={24}/><SectionHeading title="Connecting to your room…" description="Loading the latest room state."/><Button variant="secondary" onClick={() => void refresh()}>Retry connection</Button></Card>}
      {snapshot && (phase === "setup" || phase === "collecting" || phase === "reviewing") && !hostReviewOpen && <><SectionHeading eyebrow={isHost ? "HOST VIEW" : "GUEST VIEW"} title={snapshot.title} description={snapshot.contribution_done ? "You’ve marked yourself done. Wait for the host to start voting." : "Add your choices. Everyone can see the shared deck update as you go."} action={<Badge>{cards.length}/100 cards</Badge>}/>{!snapshot.contribution_done && <div className="add-card-panel"><div className="add-card-fields"><TextField label="Option name" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder={snapshot.category === "eat" ? "e.g. Noodle House" : "e.g. Movie night"} maxLength={160}/><div className="optional-fields"><TextField label={snapshot.category === "eat" ? "Cuisine / category (optional)" : "Type (optional)"} value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} placeholder="e.g. Thai"/><TextField label={snapshot.category === "eat" ? "Location (optional)" : "Extra detail (optional)"} value={draft.location} onChange={event => setDraft({ ...draft, location: event.target.value })} placeholder="Neighborhood or context"/></div></div><div className="add-card-actions"><Button disabled={busy || (!editCardId && cards.length >= 100)} leadingIcon={editCardId ? <Check size={17}/> : <Plus size={17}/>} onClick={() => void addCard()}>{editCardId ? "Save changes" : "Add option"}</Button>{editCardId && <Button variant="quiet" onClick={cancelEdit}>Cancel</Button>}</div></div>}{cards.length > 0 ? <div className="option-grid">{cards.map((card, index) => <Card className="option-card" key={card.id}><div className="option-card-top"><span className="option-number">{String(index + 1).padStart(2,"0")}</span>{(card.submitter_participant_id === identity.participant_id || isHost) && !snapshot.contribution_done && <div className="option-card-controls"><button className="remove-option" aria-label={`Edit ${card.category_data.title ?? "option"}`} onClick={() => editExistingCard(card.id)}><Pencil size={15}/></button><button className="remove-option" aria-label={`Remove ${card.category_data.title ?? "option"}`} onClick={() => setRemoveCardId(card.id)}><Trash2 size={15}/></button></div>}</div><div className="option-emoji">{currentCategory.emoji}</div><h3>{card.category_data.title ?? "Untitled option"}</h3>{card.category_data.category && <span className="option-meta">{card.category_data.category}</span>}{card.category_data.location && <p className="option-location">{card.category_data.location}</p>}</Card>)}</div> : <Card className="form-card"><Butters mood="thinking"/><SectionHeading title="Your deck starts here" description="Add at least two options before voting can begin."/></Card>}{snapshot.contribution_mode === "guest-quota" && !snapshot.contribution_done && <div className="workflow-footer"><span>Your cards: {myCards.length}/{snapshot.cards_per_participant ?? "—"} · Unused slots are okay.</span><Button variant="secondary" disabled={busy} onClick={() => void perform(() => backend.finishContribution(identity))}>I’m done adding cards</Button></div>}{isHost && <div className="workflow-footer"><span>{cards.length < 2 ? "Add at least two options to start voting." : "The deck locks when voting starts."}</span><Button size="lg" disabled={busy} onClick={() => setHostReviewOpen(true)}>Review deck <ArrowRight size={18}/></Button></div>}</>}
      {snapshot && isHost && hostReviewOpen && !isVoting && <HostFinalReview title={snapshot.title} category={snapshot.category} cards={cards} busy={busy} onEdit={id => { if (id) editExistingCard(id); setHostReviewOpen(false); }} onRemove={id => setRemoveCardId(id)} onBack={() => setHostReviewOpen(false)} onStart={() => setConfirmStartOpen(true)} />}
      {snapshot && isHost && phase === "collecting" && snapshot.contribution_mode === "guest-quota" && !hostReviewOpen && <WaitingScreen host={true} title={snapshot.title} phase={phase} onReview={() => setHostReviewOpen(true)} onRefresh={() => void refresh()} />}
      {snapshot && phase === "reviewing" && !isHost && <WaitingScreen host={false} title={snapshot.title} phase={phase} onRefresh={() => void refresh()} />}
      {snapshot && phase === "tie-breaker" && tieIntroOpen && <TieBreakIntroScreen onComplete={finishTieIntro} />}
      {snapshot && isVoting && !tieIntroOpen && <><div className="vote-intro"><Butters mood="thinking" size="md"/><h1>{phase === "tie-breaker" ? "Final round!" : "Cast your votes"}</h1><p>{submitted ? "Your ballot is in. Waiting for the rest of the crew…" : "Yup if you’re into it. Nah if you’re not. Every card gets a vote."}</p></div>{!submitted && currentVoteCard && <><div className="voting-top"><span>OPTION {voteIndex + 1} OF {activeCards.length}</span><span>{Object.keys(responses).length} of {activeCards.length} answered</span></div><Card className="vote-card"><div className="vote-card-emoji">{currentCategory.emoji}</div><h2>{currentVoteCard.category_data.title ?? "Untitled option"}</h2>{currentVoteCard.category_data.location && <p>{currentVoteCard.category_data.location}</p>}<div className="vote-actions"><Button size="lg" variant="danger" onClick={() => chooseVote(currentVoteCard.id, false)}>✕ Nah</Button><Button size="lg" onClick={() => chooseVote(currentVoteCard.id, true)}>♥ Yup</Button></div></Card><div className="vote-navigation"><Button variant="quiet" disabled={voteIndex === 0} onClick={() => setVoteIndex(i => Math.max(0,i-1))}>Previous</Button><Button variant="quiet" disabled={voteIndex >= activeCards.length - 1} onClick={() => setVoteIndex(i => Math.min(activeCards.length - 1,i+1))}>Next</Button></div><Button fullWidth size="lg" disabled={busy || activeCards.some(card => responses[card.id] === undefined)} onClick={() => setBallotReviewOpen(true)}>Review ballot <Check size={18}/></Button></>}{isHost && <button className="text-action" onClick={() => setConfirmEndVotingOpen(true)}>End voting early (1-minute grace)</button>}{isHost && deadline && Date.now() >= Date.parse(deadline) && <div className="workflow-screen"><p className="field-note">If nobody submitted a ballot during the grace period, choose a fallback winner:</p><div className="winner-choice-grid">{activeCards.map(card => <button className="winner-choice" key={card.id} onClick={() => void chooseNoBallot(card.id)}><span>{currentCategory.emoji}</span><strong>{card.category_data.title ?? "Untitled option"}</strong><small>Choose fallback <ArrowRight size={14}/></small></button>)}</div></div>}{error && <p className="inline-error" role="alert">{error}</p>}</>}
      {snapshot && phase === "tie-result" && <><div className="vote-intro"><Butters mood="thinking" size="md"/><h1>It’s a tie!</h1><p>Host can run one tie-breaker or choose from the tied options.</p></div>{result?.tally?.length ? <><Button variant="secondary" onClick={() => setShowTallies(true)}>View all tallies</Button><div className="results-tally"><h2>Group tally</h2>{result.tally.slice().sort((a, b) => b.yep_count - a.yep_count).slice(0,3).map(item => { const card = cardById.get(item.card_id); if (!card) return null; return <div className="results-tally-row" key={item.card_id}><span>{card.category_data.title ?? "Untitled option"}</span><strong>{item.yep_count} Yup{item.yep_count === 1 ? "" : "s"}</strong></div>; })}</div></> : null}{isHost && <div className="winner-choice-grid">{eligibleTieCards.map(card => <button className="winner-choice" key={card.id} onClick={() => void chooseTieWinner(card.id)}><span>{currentCategory.emoji}</span><strong>{card.category_data.title}</strong><small>Choose winner <ArrowRight size={14}/></small></button>)}</div>}{isHost && <Button fullWidth size="lg" disabled={busy} onClick={() => void startTieBreaker()}>Start one tie-breaker round</Button>}{isHost && <button className="text-action" disabled={busy} onClick={() => setConfirmLeaveTieOpen(true)}>Leave the tie unresolved and close the room</button>}{!isHost && <p className="field-note">The host is deciding how to resolve the tie.</p>}</>}
      {snapshot && (phase === "winner" || (phase === "closed" && Boolean(winnerId))) && <div className="winner-screen"><div className="confetti">✦　✧　✦　✧　✦</div><Butters mood="celebrating" size="lg"/><Badge tone="success">THE GROUP HAS SPOKEN</Badge><h1>It’s a <span>winner!</span></h1><p className="winner-subtitle">No more waffling. Go make it happen.</p><Card className="winner-card"><div className="winner-emoji">{currentCategory.emoji}</div><h2>{winnerCard?.category_data.title ?? "Your group’s pick"}</h2><p>{winnerCard?.category_data.location}</p><span className="winner-ribbon">WINNER ✨</span></Card>{result?.tally?.length ? <div className="results-tally"><h2>Group tally</h2>{result.tally.slice().sort((a, b) => b.yep_count - a.yep_count).map(item => { const card = cardById.get(item.card_id); if (!card) return null; return <div className="results-tally-row" key={item.card_id}><span>{card.category_data.title ?? "Untitled option"}</span><strong>{item.yep_count} Yup{item.yep_count === 1 ? "" : "s"}</strong></div>; })}</div> : null}{phase === "winner" && isHost ? <Button size="lg" disabled={busy} onClick={() => setConfirmCloseOpen(true)}>Close room · keep results for 24 hours</Button> : <Button size="lg" onClick={leaveRoom}>Back to home</Button>}{phase === "closed" && <p className="field-note">This room is closed. Results remain available for up to 24 hours.</p>}</div>}
      {snapshot && phase === "closed" && !winnerId && <Card className="form-card"><SectionHeading title={result?.resolution === "tie" ? "The group left it tied" : "This room has closed"} description="The room is closed. Operational data is retained for up to 24 hours."/></Card>}
      {error && !isVoting && <p className="inline-error" role="alert">{error}</p>}
      <div className="workflow-footer"><span>Updates automatically every few seconds.</span><Button variant="quiet" leadingIcon={<RefreshCw size={15}/>} onClick={() => void refresh()}>Refresh</Button></div>
    </section>
    <ShareRoomDialog open={shareOpen} code={snapshot?.room_code ?? identity.room_code} onClose={() => setShareOpen(false)} onCopy={() => void copyCode()} onShare={() => void shareInvite()} />
    <TalliesDialog open={showTallies} onClose={() => setShowTallies(false)} tally={result?.tally ?? []} cards={cards.map(card => ({ id: card.id, title: card.category_data.title ?? "Untitled option" }))} />
    <YourRoomsDialog open={showYourRooms} onClose={() => setShowYourRooms(false)} rooms={roomHistory} onOpen={openHistoryRoom} onForget={forgetRoom} />
    <BallotReviewDialog open={ballotReviewOpen} onClose={() => setBallotReviewOpen(false)} cards={activeCards.map(card => ({id:card.id,title:card.category_data.title ?? "Untitled option"}))} responses={responses} onChange={index => { setVoteIndex(index); setBallotReviewOpen(false); }} onConfirm={() => { setBallotReviewOpen(false); void submitBallot(); }} busy={busy} />
    <ConfirmDialog open={confirmStartOpen} title="Lock the deck and start voting?" description="Everyone will vote on this exact set of options. You won’t be able to add, edit, or remove cards once voting begins." confirmLabel="Lock deck & start" onCancel={() => setConfirmStartOpen(false)} onConfirm={() => { setConfirmStartOpen(false); void startVoting(); }} />
    <ConfirmDialog open={Boolean(removeCardId)} title="Remove this option?" description="This option will disappear from the shared deck for everyone. This can’t be undone." confirmLabel="Remove option" destructive onCancel={() => setRemoveCardId(null)} onConfirm={() => { if (removeCardId) void removeCard(removeCardId); setRemoveCardId(null); }} />
    <ConfirmDialog open={confirmCloseOpen} title="Close this room?" description="The room will stop accepting activity. Results will remain available for up to 24 hours." confirmLabel="Close room" destructive onCancel={() => setConfirmCloseOpen(false)} onConfirm={() => { setConfirmCloseOpen(false); void closeRoom(); }} />
    <ConfirmDialog open={confirmLeaveOpen} title="Leave this room?" description="You’ll leave this room on this device. To return, you’ll need to join again with the room code." confirmLabel="Leave room" destructive onCancel={() => setConfirmLeaveOpen(false)} onConfirm={confirmLeaveRoom} />
    <ConfirmDialog open={confirmEndVotingOpen} title="End voting early?" description="Everyone will have one final minute to finish their ballot. After that, the host can resolve the results." confirmLabel="Start 1-minute grace" onCancel={() => setConfirmEndVotingOpen(false)} onConfirm={() => { setConfirmEndVotingOpen(false); void endEarly(); }} />
    <ConfirmDialog open={confirmLeaveTieOpen} title="Close without a winner?" description="The room will close with the tie unresolved. The group will not get another tie-breaker round." confirmLabel="Close with tie" destructive onCancel={() => setConfirmLeaveTieOpen(false)} onConfirm={() => { setConfirmLeaveTieOpen(false); void leaveTieUnresolved(); }} />
    <footer className="site-footer"><span>🧇 Wafflr</span><span>Shared rooms · No accounts</span><span/></footer>
  </main>;
}
