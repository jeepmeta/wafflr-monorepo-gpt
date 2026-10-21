import { useEffect, useMemo, useState } from "react";
import { HomeScreen } from "./screens/HomeScreen";
import { JoinScreen } from "./screens/JoinScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { BallotReviewScreen } from "./screens/BallotReviewScreen";
import { WinnerScreen } from "./screens/WinnerScreen";
import { VoteScreen } from "./screens/VoteScreen";
import { TieResolutionScreen } from "./screens/TieResolutionScreen";
import { YourRoomsScreen } from "./screens/YourRoomsScreen";
import { RoomBuilderScreen } from "./screens/RoomBuilderScreen";
import { ConfirmDialog, Modal } from "./components/Modal";
import { Toast } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Clapperboard, Copy, Footprints, Plus, Sparkles, Trash2, Utensils, Users, WandSparkles, X } from "lucide-react";
import { applyRoomAction, canStartVoting, createRoom, resolveCurrentRound, type DecisionCategory, type DecisionRoom, type VoteValue } from "@wafflr/core";
import { Badge, Butters, Button, Card, EmptyState, SectionHeading, TextField } from "@wafflr/ui";

type Screen = "home" | "join" | "setup" | "room" | "review" | "vote" | "ballot-review" | "tie" | "choose-winner" | "winner" | "your-rooms";
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
  const [rooms, setRooms] = useState<DecisionRoom[]>([]);
  const [draft, setDraft] = useState<DraftCard>(blankCard());
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState<Record<string, VoteValue>>({});
  const [voteIndex, setVoteIndex] = useState(0);
  const [joinCode, setJoinCode] = useState("");
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [removeCardId, setRemoveCardId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { toast, show: showToast, dismiss: dismissToast } = useToast();

  const creatorId = "this-device";

  useEffect(() => {
    if (!room) return;
    setRooms((current) => [room, ...current.filter((item) => item.id !== room.id)]);
  }, [room]);
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
      setRoom(result.room); setDraft(blankCard()); setEditCardId(null); setError(""); showToast("Option updated.", "success"); return;
    }
    if (contributionFull) { setError("You’ve added all your cards for this room."); return; }
    if (room.cards.length >= 100) { setError("Room full — 100/100 cards."); return; }
    const result = applyRoomAction(room, { type: "add-card", card: { id: newId(), title, category: draft.category.trim() || undefined, location: draft.location.trim() || undefined, submittedBy: creatorId, createdAt: Date.now() } });
    if (!result.ok) { setError(result.error === "card-limit-reached" ? "Room full — 100/100 cards." : result.error === "contribution-limit-reached" ? "You’ve added all your cards for this room." : "Couldn’t add that option. Try again."); return; }
    setRoom(result.room); setDraft(blankCard()); setError(""); showToast(editCardId ? "Option updated." : "Option added to the deck.", "success");
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
    if (result.ok) { setRoom(result.room); showToast("Option removed.", "success"); }
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
    if (!room?.code) return;
    if (!navigator.clipboard) { showToast("Clipboard access isn’t available in this browser.", "error"); return; }
    void navigator.clipboard.writeText(room.code)
      .then(() => showToast("Room code copied.", "success"))
      .catch(() => showToast("Couldn’t copy the code. You can select it and copy manually.", "error"));
  }

  function shareCode() {
    if (!room?.code) return;
    if (navigator.share) {
      void navigator.share({ title: `Join ${room.title} on Wafflr`, text: `Join my Wafflr room with code ${room.code}` })
        .then(() => showToast("Room code shared.", "success"))
        .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) showToast("Sharing wasn’t available. Try copying the room code.", "info"); });
      return;
    }
    copyCode();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("home")} aria-label="Wafflr home"><span className="brand-mark">🧇</span><span>wafflr</span></button>
        <span className="topbar-tag">Stop waffling. Start living.</span>
      </header>

      {screen === "home" && <HomeScreen onCreate={beginSetup} onJoin={() => { setError(""); setScreen("join"); }} onYourRooms={() => setScreen("your-rooms")} />}

      {screen === "your-rooms" && <YourRoomsScreen rooms={rooms} onBack={() => setScreen("home")} onOpen={(selectedRoom) => { setRoom(selectedRoom); setScreen(selectedRoom.phase === "winner" ? "winner" : selectedRoom.phase === "voting" ? "vote" : selectedRoom.phase === "tie-breaker" ? "tie" : selectedRoom.phase === "reviewing" ? "review" : "room"); }} />}

      {screen === "join" && <JoinScreen code={joinCode} onCodeChange={setJoinCode} error={error} onBack={() => setScreen("home")} onContinue={() => setError("Live room joining needs the shared room service, which is not connected yet.")} />}

      {screen === "setup" && <SetupScreen title={roomTitle} onTitleChange={setRoomTitle} category={category} onCategoryChange={setCategory} mode={mode} onModeChange={setMode} quota={quota} onQuotaChange={setQuota} error={error} onBack={() => setScreen("home")} onCreate={createNewRoom} />}

      {screen === "review" && room && <ReviewScreen room={room} category={category} error={error} onBack={() => setScreen("room")} onAddMore={() => setScreen("room")} onEditCard={editCard} onRequestRemove={(id) => setRemoveCardId(id)} onRequestStart={() => setConfirmStartOpen(true)} />}

      {screen === "room" && room && <RoomBuilderScreen room={room} category={category} draft={draft} editCardId={editCardId} error={error} myCardCount={myCardCount} contributionFull={contributionFull} onBack={() => setScreen("home")} onDraftChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} onAddCard={addCard} onEditCard={editCard} onRequestRemove={setRemoveCardId} onCancelEdit={cancelCardEdit} onCopyCode={copyCode} onShare={() => setShareOpen(true)} onStartVoting={startVoting} />}

      {screen === "ballot-review" && room && <BallotReviewScreen room={room} category={category} cards={activeCards} responses={responses} error={error} onBack={() => setScreen(room.phase === "tie-breaker" ? "tie" : "vote")} onChangeVote={(index) => { setVoteIndex(index); setScreen(room.phase === "tie-breaker" ? "tie" : "vote"); }} onSubmit={submitVotes} />}

      {(screen === "vote" || screen === "tie") && room && <VoteScreen room={room} category={category} mode={screen} cards={activeCards} responses={responses} voteIndex={voteIndex} error={error} onVote={setVote} onIndexChange={setVoteIndex} onReview={() => { setError(""); setScreen("ballot-review"); }} onEndEarly={() => { const ended = applyRoomAction(room, { type: "creator-end-voting", participantId: creatorId }); if (ended.ok) { setRoom(ended.room); if (ended.room.phase === "tie-breaker") setScreen("choose-winner"); else if (ended.room.phase === "winner") setScreen("winner"); else setScreen("choose-winner"); } }} />}

      {screen === "choose-winner" && room && <TieResolutionScreen room={room} category={category} cards={activeCards} onChooseWinner={chooseWinner} />}

      {screen === "winner" && room && <WinnerScreen room={room} category={category} onHome={() => setScreen("home")} />}

      <Modal open={shareOpen} title="Share your room" description="Invite your crew to join the decision. No account or name needed." onClose={() => setShareOpen(false)}>
        <div className="share-room-content">
          <span className="eyebrow">ROOM CODE</span>
          <strong className="share-room-code">{room?.code ?? "—"}</strong>
          <p>Send this code to your group. They can enter it from the Join a room screen.</p>
          <div className="wf-modal-actions"><Button variant="secondary" onClick={copyCode}>Copy code</Button><Button onClick={shareCode}>Share code</Button></div>
          <p className="field-note">QR and live room links will be available when shared-room joining is connected.</p>
        </div>
      </Modal>
      <ConfirmDialog open={confirmStartOpen} title="Lock the deck and start voting?" description="Everyone will vote on this exact set of options. You won’t be able to edit the deck after voting starts." confirmLabel="Lock deck & start" onCancel={() => setConfirmStartOpen(false)} onConfirm={() => { setConfirmStartOpen(false); confirmStartVoting(); }} />
      <ConfirmDialog open={Boolean(removeCardId)} title="Remove this option?" description="This option will be removed from the deck. You can add it again before voting starts." confirmLabel="Remove option" destructive onCancel={() => setRemoveCardId(null)} onConfirm={() => { if (removeCardId) removeCard(removeCardId); setRemoveCardId(null); }} />
      <footer className="site-footer"><span>🧇 Wafflr</span><span>Stop waffling. Start living.</span><button onClick={() => setError(error ? "" : "Wafflr keeps decisions anonymous. No participant names or individual vote details are shown.")} aria-label="About Wafflr"><CircleHelp size={16} /></button></footer>
      {error && screen !== "room" && screen !== "vote" && screen !== "tie" && screen !== "join" && <p className="toast-message" role="status">{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></p>}
      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
}
