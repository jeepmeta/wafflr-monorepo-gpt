-- Result calculation, early-end grace, and tie-resolution operations.
-- Tallying is derived from submitted ballot responses; clients cannot supply totals.

create or replace function public.end_voting_early(
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
  v_round public.voting_rounds%rowtype;
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase not in ('voting', 'tie-breaker') or v_room.active_round_id is null then
    raise exception using errcode = '55000', message = 'No active voting round';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can end voting early';
  end if;

  select * into v_round from public.voting_rounds
    where room_id = v_room.id and id = v_room.active_round_id
    for update;
  if not found or v_round.status <> 'open' then
    raise exception using errcode = '55000', message = 'Voting round is already resolved';
  end if;

  if v_round.submission_deadline is null then
    update public.voting_rounds
      set submission_deadline = now() + interval '1 minute'
      where id = v_round.id
      returning * into v_round;
  end if;

  return pg_catalog.jsonb_build_object(
    'round_id', v_round.id,
    'submission_deadline', v_round.submission_deadline
  );
end;
$$;

create or replace function public.resolve_voting_round(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text,
  p_round_id uuid
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
  v_expected_voters integer;
  v_ballot_count integer;
  v_highest_count integer;
  v_top_ids uuid[];
  v_tally jsonb;
  v_resolution text;
  v_winner uuid;
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.active_round_id <> p_round_id
    or v_room.phase not in ('voting', 'tie-breaker') then
    raise exception using errcode = '55000', message = 'Round is not active';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can resolve voting';
  end if;

  select * into v_round from public.voting_rounds
    where room_id = v_room.id and id = p_round_id
    for update;
  if not found or v_round.status <> 'open' then
    raise exception using errcode = '55000', message = 'Voting round is already resolved';
  end if;

  select pg_catalog.count(*) into v_expected_voters
    from public.participants
    where room_id = v_room.id and created_at <= v_round.started_at;
  select pg_catalog.count(*) into v_ballot_count
    from public.ballots
    where room_id = v_room.id and voting_round_id = v_round.id;

  if v_round.submission_deadline is not null and now() < v_round.submission_deadline
    and v_ballot_count < v_expected_voters then
    raise exception using errcode = '55000', message = 'One-minute grace period is still active';
  end if;
  if v_round.submission_deadline is null and v_ballot_count < v_expected_voters then
    raise exception using errcode = '55000', message = 'Voting is still open; end voting first';
  end if;
  if v_ballot_count = 0 then
    raise exception using errcode = '55000', message = 'No ballots submitted; host must choose a card';
  end if;

  with counts as (
    select eligible.card_id,
      (
        select pg_catalog.count(*)::integer
        from public.ballots b
        join public.ballot_responses br
          on br.room_id = b.room_id and br.ballot_id = b.id
        where b.room_id = v_room.id
          and b.voting_round_id = v_round.id
          and br.card_id = eligible.card_id
          and br.approved
      ) as yep_count
    from pg_catalog.unnest(v_round.eligible_card_ids) as eligible(card_id)
  )
  select
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('card_id', card_id, 'yep_count', yep_count)
      order by yep_count desc, card_id
    ),
    max(yep_count),
    pg_catalog.array_agg(card_id order by card_id) filter (
      where yep_count = (select max(yep_count) from counts)
    )
  into v_tally, v_highest_count, v_top_ids
  from counts;

  if pg_catalog.cardinality(v_top_ids) = 1 then
    v_resolution := 'winner';
    v_winner := v_top_ids[1];
  else
    v_resolution := 'tie';
    v_winner := null;
  end if;

  update public.voting_rounds
    set status = 'resolved',
        resolved_at = now(),
        resolution = v_resolution,
        selected_winner_card_id = v_winner
    where id = v_round.id;

  update public.rooms
    set phase = case when v_resolution = 'winner' then 'winner' else 'tie-result' end
    where id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'round_id', v_round.id,
    'resolution', v_resolution,
    'winner_card_id', v_winner,
    'tied_card_ids', case when v_resolution = 'tie' then pg_catalog.to_jsonb(v_top_ids) else '[]'::jsonb end,
    'tally', v_tally
  );
end;
$$;

create or replace function public.choose_no_ballot_winner(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text,
  p_round_id uuid,
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
  v_round public.voting_rounds%rowtype;
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.active_round_id <> p_round_id
    or v_room.phase not in ('voting', 'tie-breaker') then
    raise exception using errcode = '55000', message = 'Round is not active';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can choose a fallback winner';
  end if;

  select * into v_round from public.voting_rounds
    where room_id = v_room.id and id = p_round_id
    for update;
  if not found or v_round.status <> 'open' then
    raise exception using errcode = '55000', message = 'Voting round is already resolved';
  end if;
  if v_round.submission_deadline is null or now() < v_round.submission_deadline then
    raise exception using errcode = '55000', message = 'The voting grace period must finish first';
  end if;
  if exists (select 1 from public.ballots where voting_round_id = v_round.id) then
    raise exception using errcode = '55000', message = 'Ballots exist; resolve from submitted votes';
  end if;
  if not (p_card_id = any(v_round.eligible_card_ids)) then
    raise exception using errcode = '22023', message = 'Choose a card from this round';
  end if;

  update public.voting_rounds
    set status = 'resolved', resolved_at = now(),
        resolution = 'host-choice', selected_winner_card_id = p_card_id
    where id = v_round.id;
  update public.rooms set phase = 'winner' where id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'round_id', v_round.id,
    'resolution', 'host-choice',
    'winner_card_id', p_card_id,
    'tally', '[]'::jsonb
  );
end;
$$;

create or replace function public.start_tie_breaker(
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
  v_previous public.voting_rounds%rowtype;
  v_tied_ids uuid[];
  v_round public.voting_rounds%rowtype;
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase <> 'tie-result' or v_room.active_round_id is null then
    raise exception using errcode = '55000', message = 'There is no tie to break';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can start a tie-breaker';
  end if;

  select * into v_previous from public.voting_rounds
    where room_id = v_room.id and id = v_room.active_round_id
    for update;
  if not found or v_previous.status <> 'resolved' or v_previous.resolution <> 'tie'
    or v_previous.round_number <> 1 then
    raise exception using errcode = '55000', message = 'Only the first tied round can start a tie-breaker';
  end if;

  with counts as (
    select eligible.card_id,
      (
        select pg_catalog.count(*)::integer
        from public.ballots b
        join public.ballot_responses br on br.room_id = b.room_id and br.ballot_id = b.id
        where b.room_id = v_room.id
          and b.voting_round_id = v_previous.id
          and br.card_id = eligible.card_id
          and br.approved
      ) as yep_count
    from pg_catalog.unnest(v_previous.eligible_card_ids) as eligible(card_id)
  )
  select pg_catalog.array_agg(card_id order by card_id)
    into v_tied_ids
    from counts
    where yep_count = (select max(yep_count) from counts);

  if pg_catalog.cardinality(v_tied_ids) < 2 then
    raise exception using errcode = '55000', message = 'No tied cards are available';
  end if;

  insert into public.voting_rounds (room_id, round_number, status, eligible_card_ids)
  values (v_room.id, 2, 'open', v_tied_ids)
  returning * into v_round;

  update public.rooms set phase = 'tie-breaker', active_round_id = v_round.id
    where id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'round_id', v_round.id,
    'round_number', 2,
    'eligible_card_ids', pg_catalog.to_jsonb(v_tied_ids),
    'started_at', v_round.started_at
  );
end;
$$;

create or replace function public.choose_tie_winner(
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
  v_round public.voting_rounds%rowtype;
  v_top_ids uuid[];
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase <> 'tie-result' or v_room.active_round_id is null then
    raise exception using errcode = '55000', message = 'There is no unresolved tie';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can resolve a tie';
  end if;

  select * into v_round from public.voting_rounds
    where room_id = v_room.id and id = v_room.active_round_id
    for update;
  if not found or v_round.status <> 'resolved' or v_round.resolution <> 'tie' then
    raise exception using errcode = '55000', message = 'Current round is not tied';
  end if;

  with counts as (
    select eligible.card_id,
      (
        select pg_catalog.count(*)::integer
        from public.ballots b
        join public.ballot_responses br on br.room_id = b.room_id and br.ballot_id = b.id
        where b.room_id = v_room.id
          and b.voting_round_id = v_round.id
          and br.card_id = eligible.card_id
          and br.approved
      ) as yep_count
    from pg_catalog.unnest(v_round.eligible_card_ids) as eligible(card_id)
  )
  select pg_catalog.array_agg(card_id order by card_id)
    into v_top_ids
    from counts
    where yep_count = (select max(yep_count) from counts);

  if not (p_card_id = any(v_top_ids)) then
    raise exception using errcode = '22023', message = 'Choose one of the tied cards';
  end if;

  update public.voting_rounds
    set resolution = 'host-choice', selected_winner_card_id = p_card_id
    where id = v_round.id;
  update public.rooms set phase = 'winner' where id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'round_id', v_round.id,
    'resolution', 'host-choice',
    'winner_card_id', p_card_id,
    'tally', (
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'card_id', eligible.card_id,
          'yep_count', (
            select pg_catalog.count(*)::integer
            from public.ballots b
            join public.ballot_responses br on br.room_id = b.room_id and br.ballot_id = b.id
            where b.room_id = v_room.id and b.voting_round_id = v_round.id
              and br.card_id = eligible.card_id and br.approved
          )
        )
        order by eligible.card_id
      )
      from pg_catalog.unnest(v_round.eligible_card_ids) as eligible(card_id)
    )
  );
end;
$$;

create or replace function public.leave_tie_unresolved(
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
  v_round public.voting_rounds%rowtype;
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase <> 'tie-result' or v_room.active_round_id is null then
    raise exception using errcode = '55000', message = 'There is no unresolved tie';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can leave a tie unresolved';
  end if;

  select * into v_round from public.voting_rounds
    where room_id = v_room.id and id = v_room.active_round_id;
  if not found or v_round.status <> 'resolved' or v_round.resolution <> 'tie' then
    raise exception using errcode = '55000', message = 'Current round is not tied';
  end if;

  update public.rooms
    set phase = 'closed', closed_at = now(), expires_at = now() + interval '24 hours'
    where id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'phase', 'closed',
    'resolution', 'tie',
    'closed_at', now(),
    'expires_at', now() + interval '24 hours'
  );
end;
$$;

create or replace function public.close_room(
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
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase <> 'winner' then
    raise exception using errcode = '55000', message = 'Only a finished winner result can be closed';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can close the room';
  end if;

  update public.rooms
    set phase = 'closed', closed_at = now(), expires_at = now() + interval '24 hours'
    where id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'phase', 'closed',
    'closed_at', now(),
    'expires_at', now() + interval '24 hours'
  );
end;
$$;

create or replace function public.get_round_results(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text,
  p_round_id uuid
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
  v_tally jsonb;
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code));
  if not found then
    raise exception using errcode = 'P0002', message = 'Room not found';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;

  select * into v_round from public.voting_rounds
    where room_id = v_room.id and id = p_round_id;
  if not found or v_round.status <> 'resolved' then
    raise exception using errcode = '55000', message = 'Round results are not available yet';
  end if;

  with counts as (
    select eligible.card_id,
      (
        select pg_catalog.count(*)::integer
        from public.ballots b
        join public.ballot_responses br on br.room_id = b.room_id and br.ballot_id = b.id
        where b.room_id = v_room.id
          and b.voting_round_id = v_round.id
          and br.card_id = eligible.card_id
          and br.approved
      ) as yep_count
    from pg_catalog.unnest(v_round.eligible_card_ids) as eligible(card_id)
  )
  select pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object('card_id', card_id, 'yep_count', yep_count)
    order by yep_count desc, card_id
  ) into v_tally from counts;

  return pg_catalog.jsonb_build_object(
    'round_id', v_round.id,
    'round_number', v_round.round_number,
    'resolution', v_round.resolution,
    'winner_card_id', v_round.selected_winner_card_id,
    'tally', coalesce(v_tally, '[]'::jsonb),
    'resolved_at', v_round.resolved_at
  );
end;
$$;

revoke all on function public.end_voting_early(text, uuid, text) from public, anon, authenticated;
revoke all on function public.resolve_voting_round(text, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.choose_no_ballot_winner(text, uuid, text, uuid, uuid) from public, anon, authenticated;
revoke all on function public.start_tie_breaker(text, uuid, text) from public, anon, authenticated;
revoke all on function public.choose_tie_winner(text, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.leave_tie_unresolved(text, uuid, text) from public, anon, authenticated;
revoke all on function public.close_room(text, uuid, text) from public, anon, authenticated;
revoke all on function public.get_round_results(text, uuid, text, uuid) from public, anon, authenticated;

grant execute on function public.end_voting_early(text, uuid, text) to anon, authenticated;
grant execute on function public.resolve_voting_round(text, uuid, text, uuid) to anon, authenticated;
grant execute on function public.choose_no_ballot_winner(text, uuid, text, uuid, uuid) to anon, authenticated;
grant execute on function public.start_tie_breaker(text, uuid, text) to anon, authenticated;
grant execute on function public.choose_tie_winner(text, uuid, text, uuid) to anon, authenticated;
grant execute on function public.leave_tie_unresolved(text, uuid, text) to anon, authenticated;
grant execute on function public.close_room(text, uuid, text) to anon, authenticated;
grant execute on function public.get_round_results(text, uuid, text, uuid) to anon, authenticated;
