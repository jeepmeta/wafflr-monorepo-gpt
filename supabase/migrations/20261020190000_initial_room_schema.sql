-- Wafflr initial persistence schema.
-- Access is intentionally closed until trusted RPCs and room-scoped RLS policies
-- are added in a follow-up migration. Do not grant direct browser writes.

create extension if not exists pgcrypto;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique
    check (room_code = upper(room_code) and room_code ~ '^[A-Z0-9]{1,32}$'),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  category text not null check (category in ('eat', 'watch', 'do', 'custom')),
  phase text not null default 'setup'
    check (phase in ('setup', 'collecting', 'reviewing', 'voting', 'tie-breaker', 'winner', 'tie-result', 'closed')),
  contribution_mode text not null default 'open'
    check (contribution_mode in ('open', 'guest-quota')),
  cards_per_participant smallint
    check (cards_per_participant is null or cards_per_participant between 1 and 3),
  creator_participant_id uuid,
  active_round_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  expires_at timestamptz,
  constraint rooms_contribution_mode_quota_check check (
    (contribution_mode = 'open' and cards_per_participant is null)
    or (contribution_mode = 'guest-quota' and cards_per_participant is not null)
  ),
  constraint rooms_closed_expiry_check check (
    (phase <> 'closed' and closed_at is null and expires_at is null)
    or (phase = 'closed' and closed_at is not null and expires_at is not null and expires_at >= closed_at)
  )
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  role text not null check (role in ('host', 'guest')),
  -- Store only a digest of a random room-scoped secret; never store the raw token.
  identity_secret_hash text not null,
  contribution_done_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (room_id, id),
  unique (room_id, identity_secret_hash),
  unique (room_id, role, id)
);

alter table public.rooms
  add constraint rooms_creator_participant_same_room_fk
  foreign key (id, creator_participant_id)
  references public.participants(room_id, id)
  deferrable initially deferred;

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  submitter_participant_id uuid not null,
  category_data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(category_data) = 'object'),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, id),
  unique (room_id, position),
  foreign key (room_id, submitter_participant_id)
    references public.participants(room_id, id) on delete cascade
);

create table public.voting_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number smallint not null check (round_number between 1 and 2),
  status text not null default 'open'
    check (status in ('open', 'resolved', 'cancelled')),
  eligible_card_ids uuid[] not null check (cardinality(eligible_card_ids) between 2 and 100),
  started_at timestamptz not null default now(),
  submission_deadline timestamptz,
  resolved_at timestamptz,
  resolution text check (resolution in ('winner', 'tie', 'host-choice', 'no-ballots-random')),
  selected_winner_card_id uuid,
  unique (room_id, id),
  unique (room_id, round_number),
  foreign key (room_id, selected_winner_card_id)
    references public.cards(room_id, id)
);

alter table public.rooms
  add constraint rooms_active_round_same_room_fk
  foreign key (id, active_round_id)
  references public.voting_rounds(room_id, id)
  deferrable initially deferred;

create table public.ballots (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  voting_round_id uuid not null,
  participant_id uuid not null,
  submitted_at timestamptz not null default now(),
  unique (voting_round_id, participant_id),
  unique (room_id, id),
  foreign key (room_id, voting_round_id)
    references public.voting_rounds(room_id, id) on delete cascade,
  foreign key (room_id, participant_id)
    references public.participants(room_id, id) on delete cascade
);

create table public.ballot_responses (
  ballot_id uuid not null,
  room_id uuid not null,
  card_id uuid not null,
  approved boolean not null,
  created_at timestamptz not null default now(),
  primary key (ballot_id, card_id),
  foreign key (room_id, ballot_id)
    references public.ballots(room_id, id) on delete cascade,
  foreign key (room_id, card_id)
    references public.cards(room_id, id) on delete cascade
);

create index rooms_expiry_idx on public.rooms (expires_at) where phase = 'closed';
create index participants_room_idx on public.participants (room_id);
create index cards_room_position_idx on public.cards (room_id, position);
create index voting_rounds_room_status_idx on public.voting_rounds (room_id, status);
create index ballots_round_idx on public.ballots (voting_round_id);
create index ballot_responses_room_card_idx on public.ballot_responses (room_id, card_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

-- Defense in depth: no direct Data API access until narrowly scoped policies
-- and SECURITY DEFINER RPCs have been reviewed and added.
alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.cards enable row level security;
alter table public.voting_rounds enable row level security;
alter table public.ballots enable row level security;
alter table public.ballot_responses enable row level security;

revoke all on table public.rooms from anon, authenticated;
revoke all on table public.participants from anon, authenticated;
revoke all on table public.cards from anon, authenticated;
revoke all on table public.voting_rounds from anon, authenticated;
revoke all on table public.ballots from anon, authenticated;
revoke all on table public.ballot_responses from anon, authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
