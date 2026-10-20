-- Server-authoritative card editing, deck lock, and ballot submission.
-- All public operations authenticate a room-scoped participant secret. Mutations
-- serialize on the room row so card edits cannot race with deck lock.

create or replace function public._participant_for_secret(
  p_room_id uuid,
  p_participant_id uuid,
  p_participant_secret text
)
returns public.participants
language sql
security definer
set search_path = ''
as $$
  select p
  from public.participants p
  where p.room_id = p_room_id
    and p.id = p_participant_id
    and p.identity_secret_hash = pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(p_participant_secret, 'UTF8'), 'sha256'),
      'hex'
    );
$$;

revoke all on function public._participant_for_secret(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.add_card(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text,
  p_category_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_card public.cards%rowtype;
  v_count integer;
  v_own_count integer;
begin
  if p_room_code is null or p_participant_id is null or p_participant_secret is null
    or pg_catalog.length(p_participant_secret) <> 64
    or p_category_data is null or pg_catalog.jsonb_typeof(p_category_data) <> 'object'
    or pg_catalog.octet_length(p_category_data::text) > 16384 then
    raise exception using errcode = '22023', message = 'Invalid card input';
  end if;

  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase not in ('setup', 'collecting', 'reviewing') then
    raise exception using errcode = '55000', message = 'Room is not accepting card changes';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.contribution_done_at is not null then
    raise exception using errcode = '55000', message = 'Contribution is already marked complete';
  end if;

  select count(*) into v_count from public.cards where room_id = v_room.id;
  if v_count >= 100 then
    raise exception using errcode = '54000', message = 'Room has reached the 100-card limit';
  end if;

  select count(*) into v_own_count from public.cards
    where room_id = v_room.id and submitter_participant_id = v_participant.id;
  if v_room.contribution_mode = 'guest-quota'
    and v_own_count >= v_room.cards_per_participant then
    raise exception using errcode = '54000', message = 'Contribution quota reached';
  end if;

  insert into public.cards (room_id, submitter_participant_id, category_data, position)
  values (
    v_room.id,
    v_participant.id,
    p_category_data,
    coalesce((select max(position) + 1 from public.cards where room_id = v_room.id), 0)
  )
  returning * into v_card;

  return pg_catalog.jsonb_build_object(
    'id', v_card.id,
    'room_id', v_card.room_id,
    'submitter_participant_id', v_card.submitter_participant_id,
    'category_data', v_card.category_data,
    'position', v_card.position,
    'created_at', v_card.created_at,
    'updated_at', v_card.updated_at
  );
end;
$$;

create or replace function public.edit_card(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text,
  p_card_id uuid,
  p_category_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_card public.cards%rowtype;
begin
  if p_participant_id is null or p_participant_secret is null or p_card_id is null
    or pg_catalog.length(p_participant_secret) <> 64
    or p_category_data is null or pg_catalog.jsonb_typeof(p_category_data) <> 'object'
    or pg_catalog.octet_length(p_category_data::text) > 16384 then
    raise exception using errcode = '22023', message = 'Invalid card input';
  end if;

  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase not in ('setup', 'collecting', 'reviewing') then
    raise exception using errcode = '55000', message = 'Room is not accepting card changes';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;

  update public.cards
    set category_data = p_category_data
    where room_id = v_room.id
      and id = p_card_id
      and (submitter_participant_id = v_participant.id or v_participant.role = 'host')
    returning * into v_card;

  if not found then
    raise exception using errcode = '42501', message = 'You can only edit your own cards unless you are the host';
  end if;

  return pg_catalog.jsonb_build_object(
    'id', v_card.id,
    'room_id', v_card.room_id,
    'submitter_participant_id', v_card.submitter_participant_id,
    'category_data', v_card.category_data,
    'position', v_card.position,
    'created_at', v_card.created_at,
    'updated_at', v_card.updated_at
  );
end;
$$;

create or replace function public.remove_card(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text,
  p_card_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_card public.cards%rowtype;
begin
  if p_participant_id is null or p_participant_secret is null or p_card_id is null
    or pg_catalog.length(p_participant_secret) <> 64 then
    raise exception using errcode = '22023', message = 'Invalid card removal input';
  end if;

  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase not in ('setup', 'collecting', 'reviewing') then
    raise exception using errcode = '55000', message = 'Room is not accepting card changes';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;

  select * into v_card from public.cards
    where room_id = v_room.id and id = p_card_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Card not found';
  end if;
  if v_card.submitter_participant_id <> v_participant.id and v_participant.role <> 'host' then
    raise exception using errcode = '42501', message = 'You can only remove your own cards';
  end if;

  delete from public.cards where room_id = v_room.id and id = p_card_id;
  return pg_catalog.jsonb_build_object('removed_card_id', p_card_id);
end;
$$;

create or replace function public.start_voting(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_card_ids uuid[];
  v_card_count integer;
  v_round public.voting_rounds%rowtype;
begin
  if p_participant_id is null or p_participant_secret is null
    or pg_catalog.length(p_participant_secret) <> 64 then
    raise exception using errcode = '28000', message = 'Valid room-scoped identity required';
  end if;

  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Room not found';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can start voting';
  end if;
  if v_room.phase not in ('setup', 'collecting', 'reviewing') then
    raise exception using errcode = '55000', message = 'Voting cannot be started in this phase';
  end if;

  select pg_catalog.array_agg(id order by position), pg_catalog.count(*)
    into v_card_ids, v_card_count
    from public.cards where room_id = v_room.id;
  if v_card_count < 2 or v_card_count > 100 then
    raise exception using errcode = '22023', message = 'Voting requires 2 to 100 cards';
  end if;

  insert into public.voting_rounds (room_id, round_number, status, eligible_card_ids)
  values (v_room.id, 1, 'open', v_card_ids)
  returning * into v_round;

  update public.rooms
    set phase = 'voting', active_round_id = v_round.id
    where id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'room_id', v_room.id,
    'phase', 'voting',
    'round_id', v_round.id,
    'round_number', v_round.round_number,
    'eligible_card_ids', to_jsonb(v_card_ids),
    'started_at', v_round.started_at
  );
end;
$$;

create or replace function public.submit_ballot(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text,
  p_round_id uuid,
  p_responses jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_participant public.participants%rowtype;
  v_round public.voting_rounds%rowtype;
  v_ballot_id uuid;
  v_response_count integer;
  v_distinct_count integer;
  v_invalid_count integer;
begin
  if p_participant_id is null or p_participant_secret is null or p_round_id is null
    or pg_catalog.length(p_participant_secret) <> 64
    or p_responses is null or pg_catalog.jsonb_typeof(p_responses) <> 'array'
    or pg_catalog.jsonb_array_length(p_responses) > 100 then
    raise exception using errcode = '22023', message = 'Invalid ballot input';
  end if;

  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Room not found';
  end if;
  if v_room.phase not in ('voting', 'tie-breaker') or v_room.active_round_id <> p_round_id then
    raise exception using errcode = '55000', message = 'This voting round is not accepting ballots';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;

  select * into v_round from public.voting_rounds
    where room_id = v_room.id and id = p_round_id
    for update;
  if not found or v_round.status <> 'open' then
    raise exception using errcode = '55000', message = 'This voting round is closed';
  end if;
  if v_participant.created_at > v_round.started_at then
    raise exception using errcode = '42501', message = 'You joined after this round started';
  end if;
  if v_round.submission_deadline is not null and now() > v_round.submission_deadline then
    raise exception using errcode = '55000', message = 'Ballot submission deadline has passed';
  end if;

  select count(*), count(distinct x.card_id),
         count(*) filter (where x.card_id is null or not (x.card_id = any(v_round.eligible_card_ids)))
    into v_response_count, v_distinct_count, v_invalid_count
    from pg_catalog.jsonb_to_recordset(p_responses) as x(card_id uuid, approved boolean);

  if v_response_count <> pg_catalog.cardinality(v_round.eligible_card_ids)
    or v_distinct_count <> v_response_count
    or v_invalid_count <> 0
    or exists (
      select 1 from pg_catalog.jsonb_to_recordset(p_responses) as x(card_id uuid, approved boolean)
      where x.approved is null
    ) then
    raise exception using errcode = '22023', message = 'A Yep/Nah response is required for every eligible card';
  end if;

  insert into public.ballots (room_id, voting_round_id, participant_id)
  values (v_room.id, v_round.id, v_participant.id)
  returning id into v_ballot_id;

  insert into public.ballot_responses (ballot_id, room_id, card_id, approved)
  select v_ballot_id, v_room.id, x.card_id, x.approved
    from pg_catalog.jsonb_to_recordset(p_responses) as x(card_id uuid, approved boolean);

  return pg_catalog.jsonb_build_object(
    'ballot_id', v_ballot_id,
    'round_id', v_round.id,
    'submitted_at', now(),
    'response_count', v_response_count
  );
end;
$$;

revoke all on function public.add_card(text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.edit_card(text, uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.remove_card(text, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.start_voting(text, uuid, text) from public, anon, authenticated;
revoke all on function public.submit_ballot(text, uuid, text, uuid, jsonb) from public, anon, authenticated;

grant execute on function public.add_card(text, uuid, text, jsonb) to anon, authenticated;
grant execute on function public.edit_card(text, uuid, text, uuid, jsonb) to anon, authenticated;
grant execute on function public.remove_card(text, uuid, text, uuid) to anon, authenticated;
grant execute on function public.start_voting(text, uuid, text) to anon, authenticated;
grant execute on function public.submit_ballot(text, uuid, text, uuid, jsonb) to anon, authenticated;

comment on function public.add_card(text, uuid, text, jsonb) is
  'Adds a card before voting; enforces room-scoped identity, card limit, quota, and contribution completion.';
comment on function public.edit_card(text, uuid, text, uuid, jsonb) is
  'Allows a participant to edit only their own card before deck lock.';
comment on function public.remove_card(text, uuid, text, uuid) is
  'Allows a participant to remove their own card or the host to veto any card before deck lock.';
comment on function public.start_voting(text, uuid, text) is
  'Atomically freezes the current deck and starts the first voting round; host only.';
comment on function public.submit_ballot(text, uuid, text, uuid, jsonb) is
  'Submits one complete Yep/Nah ballot for an eligible participant in the active round; duplicate submissions are rejected.';
