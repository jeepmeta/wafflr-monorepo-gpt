-- Trusted host-disconnect fallback. Schedule this function only after clients
-- send heartbeat_participant calls at a documented interval.

create or replace function public.resolve_stale_host_rooms(p_batch_size integer default 50)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_round public.voting_rounds%rowtype;
  v_ballot_count integer;
  v_highest_count integer;
  v_top_ids uuid[];
  v_winner uuid;
  v_resolution text;
  v_next_phase text;
  v_resolved integer := 0;
  v_limit integer := greatest(1, least(coalesce(p_batch_size, 50), 500));
begin
  for v_room in
    select r.*
    from public.rooms r
    join public.participants host
      on host.room_id = r.id
      and host.id = r.creator_participant_id
      and host.role = 'host'
    where r.phase in ('voting', 'tie-breaker')
      and r.active_round_id is not null
      and host.last_seen_at <= now() - interval '10 minutes'
    order by host.last_seen_at
    limit v_limit
    for update of r, host skip locked
  loop
    select * into v_round
      from public.voting_rounds
      where room_id = v_room.id
        and id = v_room.active_round_id
        and status = 'open'
      for update;
    if not found then
      continue;
    end if;

    select pg_catalog.count(*) into v_ballot_count
      from public.ballots
      where room_id = v_room.id and voting_round_id = v_round.id;

    if v_ballot_count = 0 then
      select eligible.card_id into v_winner
        from pg_catalog.unnest(v_round.eligible_card_ids) as eligible(card_id)
        order by pg_catalog.random()
        limit 1;
      v_resolution := 'no-ballots-random';
      v_next_phase := 'winner';
    else
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
        max(yep_count),
        pg_catalog.array_agg(card_id order by card_id) filter (
          where yep_count = (select max(yep_count) from counts)
        )
      into v_highest_count, v_top_ids
      from counts;

      if pg_catalog.cardinality(v_top_ids) = 1 then
        v_winner := v_top_ids[1];
        v_resolution := 'winner';
        v_next_phase := 'winner';
      else
        v_winner := null;
        v_resolution := 'tie';
        v_next_phase := 'tie-result';
      end if;
    end if;

    update public.voting_rounds
      set status = 'resolved',
          resolved_at = now(),
          resolution = v_resolution,
          selected_winner_card_id = v_winner
      where id = v_round.id;

    update public.rooms set phase = v_next_phase where id = v_room.id;
    v_resolved := v_resolved + 1;
  end loop;

  return v_resolved;
end;
$$;

revoke all on function public.resolve_stale_host_rooms(integer) from public, anon, authenticated;
grant execute on function public.resolve_stale_host_rooms(integer) to service_role;

comment on function public.resolve_stale_host_rooms(integer) is
  'Service-role-only 10-minute host disconnect fallback. Resolve from submitted ballots, or randomly select an eligible card when no ballots exist. Schedule only after heartbeat integration.';
