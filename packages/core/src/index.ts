export type DecisionRoomStatus = 'draft' | 'voting' | 'finished';

export interface DecisionOption {
  id: string;
  title: string;
  description?: string;
  submittedBy?: string;
}

export interface DecisionRoom {
  id: string;
  question: string;
  status: DecisionRoomStatus;
  options: DecisionOption[];
}

export type VoteValue = 'yes' | 'no';

export interface Vote {
  roomId: string;
  optionId: string;
  participantId: string;
  value: VoteValue;
}

export function countYesVotes(votes: Vote[], optionId: string): number {
  return votes.filter((vote) => vote.optionId === optionId && vote.value === 'yes').length;
}
