export type RoomCategory = "eat" | "watch" | "do" | "custom";
export type ContributionMode = "open" | "guest-quota";
export type ParticipantRole = "host" | "guest";
export type RoomPhase = "setup" | "collecting" | "reviewing" | "voting" | "tie-breaker" | "tie-result" | "winner" | "closed";
export type RoomIdentity = { room_code: string; room_id: string; participant_id: string; participant_secret: string; role: ParticipantRole; title: string; category: RoomCategory; room_icon?: string; phase: RoomPhase; contribution_mode: ContributionMode; cards_per_participant: number | null };
export type RoomHistoryEntry = RoomIdentity & { last_opened_at: string };
export type RoomCard = { id: string; submitter_participant_id: string; category_data: { title?: string; category?: string; location?: string; [key: string]: unknown }; position: number; created_at: string; updated_at: string };
export type RoomSnapshot = { room_id: string; room_code: string; title: string; category: RoomCategory; phase: RoomPhase; contribution_mode: ContributionMode; cards_per_participant: number | null; active_round_id: string | null; active_round_eligible_card_ids: string[]; closed_at: string | null; expires_at: string | null; contribution_deadline: string | null; room_icon: string; participant_id: string; role: ParticipantRole; contribution_done: boolean; cards: RoomCard[] };
type RpcErrorPayload = { message?: string; details?: string; hint?: string; code?: string };
export class BackendError extends Error {
  constructor(message: string, readonly code?: string) { super(message); this.name = "BackendError"; }
}
export function createBackend(url: string = "", publishableKey: string = "", fetcher: typeof fetch = fetch) {
  const base = url.replace(/\/+$/, "");
  async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    if (!base || !publishableKey) {
      throw new BackendError("Shared rooms are not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in apps/web/.env.local, then restart the dev server.");
    }
    let response: Response;
    try {
      response = await fetcher(`${base}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(args),
      });
    } catch {
      throw new BackendError("Could not reach the room service. Check your connection and try again.");
    }
    const raw = await response.text();
    let body: unknown;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
    if (!response.ok) {
      const payload = body && typeof body === "object" ? body as RpcErrorPayload : {};
      const safeMessage = payload.message ?? "The room service rejected that request.";
      throw new BackendError(safeMessage, payload.code);
    }
    return body as T;
  }
  return {
    createRoom: (input: { title: string; category: RoomCategory; contributionMode: ContributionMode; quota: number | null }) =>
      rpc<RoomIdentity>("create_room", { p_title: input.title, p_category: input.category, p_contribution_mode: input.contributionMode, p_cards_per_participant: input.quota }),
    joinRoom: (code: string) => rpc<RoomIdentity>("join_room", { p_room_code: code }),
    snapshot: (identity: RoomIdentity) => rpc<RoomSnapshot>("get_room_snapshot", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    addCard: (identity: RoomIdentity, data: { title: string; category?: string; location?: string }) =>
      rpc<RoomCard>("add_card", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_category_data: data }),
    editCard: (identity: RoomIdentity, cardId: string, data: { title: string; category?: string; location?: string }) =>
      rpc<RoomCard>("edit_card", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_card_id: cardId, p_category_data: data }),
    removeCard: (identity: RoomIdentity, cardId: string) =>
      rpc<{ removed_card_id: string }>("remove_card", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_card_id: cardId }),
    startVoting: (identity: RoomIdentity) =>
      rpc<{ phase: RoomPhase; round_id: string; round_number: number; eligible_card_ids: string[] }>("start_voting", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    submitBallot: (identity: RoomIdentity, roundId: string, responses: { card_id: string; approved: boolean }[]) =>
      rpc<{ ballot_id: string; round_id: string; submitted_at: string; response_count: number }>("submit_ballot", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_round_id: roundId, p_responses: responses }),
    beginContributionCutoff: (identity: RoomIdentity) =>
      rpc<{ phase: RoomPhase; contribution_deadline: string; seconds_remaining: number }>("begin_contribution_cutoff", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    setRoomIcon: (identity: RoomIdentity, roomIcon: string) =>
      rpc<{ room_icon: string }>("set_room_icon", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_room_icon: roomIcon }),
    finishContribution: (identity: RoomIdentity) =>
      rpc<{ contribution_done: boolean; cards_submitted: number; unused_slots_skipped: number | null }>("finish_contribution", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    heartbeat: (identity: RoomIdentity) =>
      rpc<{ participant_id: string; last_seen_at: string }>("heartbeat_participant", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    endVotingEarly: (identity: RoomIdentity) =>
      rpc<{ round_id: string; submission_deadline: string }>("end_voting_early", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    resolveRound: (identity: RoomIdentity, roundId: string) =>
      rpc<{ resolution: "winner" | "tie"; winner_card_id: string | null; tied_card_ids: string[]; tally: { card_id: string; yep_count: number }[] }>("resolve_voting_round", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_round_id: roundId }),
    startTieBreaker: (identity: RoomIdentity) =>
      rpc<{ round_id: string; round_number: number; eligible_card_ids: string[] }>("start_tie_breaker", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    chooseTieWinner: (identity: RoomIdentity, cardId: string) =>
      rpc<{ winner_card_id: string; resolution: string }>("choose_tie_winner", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_card_id: cardId }),
    leaveTieUnresolved: (identity: RoomIdentity) =>
      rpc<{ phase: RoomPhase; resolution: string }>("leave_tie_unresolved", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    closeRoom: (identity: RoomIdentity) =>
      rpc<{ phase: RoomPhase; closed_at: string; expires_at: string }>("close_room", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret }),
    chooseNoBallotWinner: (identity: RoomIdentity, roundId: string, cardId: string) =>
      rpc<{ winner_card_id: string; resolution: string }>("choose_no_ballot_winner", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_round_id: roundId, p_card_id: cardId }),
    roundResults: (identity: RoomIdentity, roundId: string) =>
      rpc<{ round_id: string; round_number: number; resolution: string; winner_card_id: string | null; tally: { card_id: string; yep_count: number }[] }>("get_round_results", { p_room_code: identity.room_code, p_participant_id: identity.participant_id, p_participant_secret: identity.participant_secret, p_round_id: roundId }),
  };
}
