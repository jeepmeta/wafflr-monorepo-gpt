export type RoomPhase = "setup" | "collecting" | "reviewing" | "voting" | "tie-breaker" | "winner" | "closed";
export type DecisionCategory = "eat" | "watch" | "do" | "custom";
export type VoteValue = "yup" | "nah";
export type ContributionMode = "creator-only" | "guests-contribute";

export interface DecisionCard { id: string; title: string; category?: string; location?: string; submittedBy: string; createdAt: number }
export interface Ballot { participantId: string; responses: Record<string, VoteValue>; submittedAt: number }
export interface RoundResult { winnerId?: string; tiedCardIds: string[]; yupCounts: Record<string, number> }
export interface DecisionRoom {
  id: string; code: string; title: string; creatorId: string; category: DecisionCategory; phase: RoomPhase;
  contributionMode: ContributionMode; cards: DecisionCard[]; cardLimitPerGuest: 1 | 2 | 3;
  guestCount: number; createdAt: number; closedAt?: number; expiresAt?: number; ballots: Ballot[];
  currentRound: number; tieBreakerCardIds?: string[]; winnerCardId?: string;
}
export const ROOM_CARD_LIMIT = 100;
export const MIN_CARDS_TO_VOTE = 2;
export const ROOM_RETENTION_MS = 24 * 60 * 60 * 1000;
export const CREATOR_DISCONNECT_TIMEOUT_MS = 10 * 60 * 1000;
export type RoomAction =
  | { type: "add-card"; card: DecisionCard }
  | { type: "update-own-card"; cardId: string; participantId: string; patch: Partial<Pick<DecisionCard, "title" | "category" | "location">> }
  | { type: "remove-own-card"; cardId: string; participantId: string }
  | { type: "creator-veto-card"; cardId: string; participantId: string }
  | { type: "start-voting"; participantId: string }
  | { type: "submit-ballot"; participantId: string; responses: Record<string, VoteValue>; submittedAt: number }
  | { type: "creator-end-voting"; participantId: string }
  | { type: "begin-tie-breaker"; participantId: string }
  | { type: "creator-select-winner"; participantId: string; cardId: string }
  | { type: "creator-disconnect-timeout"; now: number };
export type RoomErrorCode = "room-closed" | "wrong-phase" | "not-authorized" | "card-limit-reached" | "duplicate-card-id" | "card-not-found" | "card-not-owned" | "minimum-two-cards" | "contribution-limit-reached" | "ballot-incomplete" | "ballot-already-submitted" | "invalid-ballot-card" | "tie-breaker-not-needed" | "winner-not-eligible";
export type RoomActionResult = { ok: true; room: DecisionRoom } | { ok: false; error: RoomErrorCode; room: DecisionRoom };
const success = (room: DecisionRoom): RoomActionResult => ({ ok: true, room });
const failure = (room: DecisionRoom, error: RoomErrorCode): RoomActionResult => ({ ok: false, error, room });
const isCreator = (room: DecisionRoom, id: string) => room.creatorId === id;
const activeCardIds = (room: DecisionRoom) => room.phase === "tie-breaker" && room.tieBreakerCardIds ? room.tieBreakerCardIds : room.cards.map((card) => card.id);
const countYup = (ballots: Ballot[], cardId: string) => ballots.reduce((count, ballot) => count + (ballot.responses[cardId] === "yup" ? 1 : 0), 0);
function resolveWinner(room: DecisionRoom, winnerCardId: string): DecisionRoom { return { ...room, phase: "winner", winnerCardId, tieBreakerCardIds: undefined }; }

export function createRoom(input: Pick<DecisionRoom, "id" | "code" | "title" | "creatorId" | "category" | "contributionMode" | "cardLimitPerGuest"> & { now: number }): DecisionRoom {
  return { id: input.id, code: input.code, title: input.title.trim(), creatorId: input.creatorId, category: input.category, contributionMode: input.contributionMode, cardLimitPerGuest: input.cardLimitPerGuest, phase: input.contributionMode === "guests-contribute" ? "collecting" : "setup", cards: [], guestCount: 0, createdAt: input.now, ballots: [], currentRound: 1 };
}
export function canStartVoting(room: DecisionRoom): boolean { return ["setup", "collecting", "reviewing"].includes(room.phase) && room.cards.length >= MIN_CARDS_TO_VOTE; }
export function canAddCard(room: DecisionRoom): boolean { return ["setup", "collecting", "reviewing"].includes(room.phase) && room.cards.length < ROOM_CARD_LIMIT; }
export function getYupCounts(room: DecisionRoom): Record<string, number> { return Object.fromEntries(activeCardIds(room).map((id) => [id, countYup(room.ballots, id)])); }
export function getRoundResult(room: DecisionRoom): RoundResult {
  const yupCounts = getYupCounts(room); const max = Math.max(0, ...Object.values(yupCounts));
  const tiedCardIds = Object.keys(yupCounts).filter((id) => yupCounts[id] === max);
  return { winnerId: tiedCardIds.length === 1 ? tiedCardIds[0] : undefined, tiedCardIds, yupCounts };
}
export function resolveCurrentRound(room: DecisionRoom): DecisionRoom {
  const result = getRoundResult(room);
  if (room.ballots.length === 0) return room;
  if (result.winnerId) return resolveWinner(room, result.winnerId);
  if (room.phase === "voting") return { ...room, phase: "tie-breaker", currentRound: 2, tieBreakerCardIds: result.tiedCardIds, ballots: [] };
  return room;
}
export function applyRoomAction(room: DecisionRoom, action: RoomAction): RoomActionResult {
  if (room.phase === "closed" || room.phase === "winner") return failure(room, "room-closed");
  switch (action.type) {
    case "add-card": {
      if (!canAddCard(room)) return failure(room, room.cards.length >= ROOM_CARD_LIMIT ? "card-limit-reached" : "wrong-phase");
      if (room.cards.some((card) => card.id === action.card.id)) return failure(room, "duplicate-card-id");
      if (room.contributionMode === "creator-only" && action.card.submittedBy !== room.creatorId) return failure(room, "not-authorized");
      if (room.contributionMode === "guests-contribute" && room.cards.filter((card) => card.submittedBy === action.card.submittedBy).length >= room.cardLimitPerGuest) return failure(room, "contribution-limit-reached");
      return success({ ...room, cards: [...room.cards, action.card], phase: "reviewing" });
    }
    case "update-own-card": {
      if (!["setup", "collecting", "reviewing"].includes(room.phase)) return failure(room, "wrong-phase");
      const card = room.cards.find((card) => card.id === action.cardId);
      if (!card) return failure(room, "card-not-found");
      if (card.submittedBy !== action.participantId) return failure(room, "card-not-owned");
      const title = action.patch.title?.trim();
      if (action.patch.title !== undefined && !title) return failure(room, "card-not-found");
      return success({ ...room, cards: room.cards.map((item) => item.id === card.id ? { ...item, ...action.patch, ...(title ? { title } : {}) } : item) });
    }
    case "remove-own-card": {
      if (!["setup", "collecting", "reviewing"].includes(room.phase)) return failure(room, "wrong-phase");
      const card = room.cards.find((item) => item.id === action.cardId);
      if (!card) return failure(room, "card-not-found");
      if (card.submittedBy !== action.participantId) return failure(room, "card-not-owned");
      return success({ ...room, cards: room.cards.filter((item) => item.id !== action.cardId) });
    }
    case "creator-veto-card": {
      if (!isCreator(room, action.participantId)) return failure(room, "not-authorized");
      if (!["setup", "collecting", "reviewing"].includes(room.phase)) return failure(room, "wrong-phase");
      if (!room.cards.some((card) => card.id === action.cardId)) return failure(room, "card-not-found");
      return success({ ...room, cards: room.cards.filter((card) => card.id !== action.cardId) });
    }
    case "start-voting": {
      if (!isCreator(room, action.participantId)) return failure(room, "not-authorized");
      if (!canStartVoting(room)) return failure(room, room.cards.length < MIN_CARDS_TO_VOTE ? "minimum-two-cards" : "wrong-phase");
      return success({ ...room, phase: "voting", ballots: [], currentRound: 1, tieBreakerCardIds: undefined, winnerCardId: undefined });
    }
    case "submit-ballot": {
      if (room.phase !== "voting" && room.phase !== "tie-breaker") return failure(room, "wrong-phase");
      if (room.ballots.some((ballot) => ballot.participantId === action.participantId)) return failure(room, "ballot-already-submitted");
      const eligible = activeCardIds(room);
      if (eligible.some((id) => !action.responses[id])) return failure(room, "ballot-incomplete");
      if (Object.keys(action.responses).some((id) => !eligible.includes(id))) return failure(room, "invalid-ballot-card");
      return success({ ...room, ballots: [...room.ballots, { participantId: action.participantId, responses: action.responses, submittedAt: action.submittedAt }] });
    }
    case "creator-end-voting": {
      if (!isCreator(room, action.participantId)) return failure(room, "not-authorized");
      if (room.phase !== "voting") return failure(room, "wrong-phase");
      if (room.ballots.length === 0) return success(room);
      const result = getRoundResult(room);
      if (result.winnerId) return success(resolveWinner(room, result.winnerId));
      return success({ ...room, phase: "tie-breaker", currentRound: 2, tieBreakerCardIds: result.tiedCardIds, ballots: [] });
    }
    case "begin-tie-breaker": {
      if (!isCreator(room, action.participantId)) return failure(room, "not-authorized");
      if (room.phase !== "voting") return failure(room, "wrong-phase");
      const result = getRoundResult(room);
      if (result.winnerId || result.tiedCardIds.length < 2) return failure(room, "tie-breaker-not-needed");
      return success({ ...room, phase: "tie-breaker", currentRound: 2, tieBreakerCardIds: result.tiedCardIds, ballots: [] });
    }
    case "creator-select-winner": {
      if (!isCreator(room, action.participantId)) return failure(room, "not-authorized");
      if (room.phase !== "tie-breaker" && !(room.phase === "voting" && room.ballots.length === 0)) return failure(room, "wrong-phase");
      if (!activeCardIds(room).includes(action.cardId)) return failure(room, "winner-not-eligible");
      return success(resolveWinner(room, action.cardId));
    }
    case "creator-disconnect-timeout": {
      if (room.phase !== "voting" && room.phase !== "tie-breaker") return failure(room, "wrong-phase");
      const pool = activeCardIds(room);
      if (!pool.length) return failure(room, "winner-not-eligible");
      const counts = getYupCounts(room); const max = Math.max(...Object.values(counts));
      const tied = pool.filter((id) => counts[id] === max);
      const winnerId = room.ballots.length ? tied[Math.floor(Math.random() * tied.length)] : pool[Math.floor(Math.random() * pool.length)];
      return success(resolveWinner(room, winnerId));
    }
  }
}
export function closeRoom(room: DecisionRoom, now: number): DecisionRoom { return { ...room, phase: "closed", closedAt: now, expiresAt: now + ROOM_RETENTION_MS }; }
export function isRoomExpired(room: DecisionRoom, now: number): boolean { return room.expiresAt !== undefined && now >= room.expiresAt; }
