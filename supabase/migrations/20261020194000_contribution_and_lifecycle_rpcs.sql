-- Contribution completion, participant heartbeat, and expired-room cleanup.
-- Cleanup is a trusted server operation; clients cannot call it or delete rows directly.

create or replace function public.finish_contribution(
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
  v_card_count integer;
  v_remaining_slots integer;
  v_done_at timestamptz;
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase not in ('setup', 'collecting', 'reviewing') then
    raise exception using errcode = '55000', message = 'Contribution is no longer open';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;

  update public.participants
    set contribution_done_at = coalesce(contribution_done_at, now()),
        last_seen_at = now(),
        disconnected_at = null
    where room_id = v_room.id and id = v_participant.id
    returning contribution_done_at into v_done_at;

  select pg_catalog.count(*) into v_card_count
    from public.cards where room_id = v_room.id and submitter_participant_id = v_participant.id;

  if v_room.contribution_mode = 'guest-quota' then
    v_remaining_slots := greatest(v_room.cards_per_participant - v_card_count, 0);
  else
    v_remaining_slots := null;
  end if;

  return pg_catalog.jsonb_build_object(
    'participant_id', v_participant.id,
    'contribution_done', true,
    'contribution_done_at', v_done_at,
    'cards_submitted', v_card_count,
    'unused_slots_skipped', v_remaining_slots
  );
end;
$$;

create or replace function public.heartbeat_participant(
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
  v_last_seen timestamptz;
begin
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code));
  if not found or (v_room.phase = 'closed' and v_room.expires_at <= now()) then
    raise exception using errcode = 'P0002', message = 'Room not found or expired';
  end if;

  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;

  update public.participants
    set last_seen_at = now(), disconnected_at = null
    where room_id = v_room.id and id = v_participant.id
    returning last_seen_at into v_last_seen;

  return pg_catalog.jsonb_build_object(
    'participant_id', v_participant.id,
    'last_seen_at', v_last_seen
  );
end;
$$;

create or replace function public.delete_expired_rooms(p_batch_size integer default 100)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
  v_limit integer := greatest(1, least(coalesce(p_batch_size, 100), 1000));
begin
  with expired as (
    select id
    from public.rooms
    where phase = 'closed' and expires_at <= now()
    order by expires_at
    limit v_limit
    for update skip locked
  )
  delete from public.rooms r
  using expired e
  where r.id = e.id;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.finish_contribution(text, uuid, text) from public, anon, authenticated;
revoke all on function public.heartbeat_participant(text, uuid, text) from public, anon, authenticated;
revoke all on function public.delete_expired_rooms(integer) from public, anon, authenticated;

grant execute on function public.finish_contribution(text, uuid, text) to anon, authenticated;
grant execute on function public.heartbeat_participant(text, uuid, text) to anon, authenticated;
grant execute on function public.delete_expired_rooms(integer) to service_role;

comment on function public.finish_contribution(text, uuid, text) is
  'Marks this participant done; unused guest-quota slots are skipped rather than represented as empty cards.';
comment on function public.heartbeat_participant(text, uuid, text) is
  'Refreshes room-scoped presence. A trusted scheduler can use last_seen_at for disconnect handling.';
comment on function public.delete_expired_rooms(integer) is
  'Deletes up to the requested batch of closed rooms whose 24-hour retention has expired; service-role only.';
