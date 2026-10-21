-- Close the last documented shared-room gaps: host-controlled contribution cutoff and persisted room icons.
alter table public.rooms
  add column if not exists contribution_deadline timestamptz,
  add column if not exists room_icon text not null default '🧇'
    check (char_length(room_icon) between 1 and 12);

create or replace function public.begin_contribution_cutoff(
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
  if not found or v_room.phase not in ('setup', 'collecting', 'reviewing') then
    raise exception using errcode = '55000', message = 'Contribution cutoff is unavailable in this phase';
  end if;
  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can start the contribution cutoff';
  end if;
  if v_room.contribution_deadline is null then
    update public.rooms
      set phase = 'reviewing', contribution_deadline = now() + interval '1 minute'
      where id = v_room.id
      returning * into v_room;
  end if;
  return pg_catalog.jsonb_build_object(
    'phase', v_room.phase,
    'contribution_deadline', v_room.contribution_deadline,
    'seconds_remaining', greatest(0, pg_catalog.ceil(extract(epoch from (v_room.contribution_deadline - now())))::integer)
  );
end;
$$;

create or replace function public.set_room_icon(
  p_room_code text,
  p_participant_id uuid,
  p_participant_secret text,
  p_room_icon text
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
  if p_room_icon is null or pg_catalog.char_length(p_room_icon) not between 1 and 12 then
    raise exception using errcode = '22023', message = 'Choose a valid room icon';
  end if;
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
    for update;
  if not found or v_room.phase <> 'setup' then
    raise exception using errcode = '55000', message = 'Room icon can only be changed during setup';
  end if;
  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;
  if v_participant.role <> 'host' or v_room.creator_participant_id <> v_participant.id then
    raise exception using errcode = '42501', message = 'Only the host can change the room icon';
  end if;
  update public.rooms set room_icon = p_room_icon where id = v_room.id;
  return pg_catalog.jsonb_build_object('room_icon', p_room_icon);
end;
$$;

create or replace function public.guard_contribution_deadline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_deadline timestamptz;
  v_phase text;
begin
  v_room_id := coalesce(new.room_id, old.room_id);
  select contribution_deadline, phase into v_deadline, v_phase
    from public.rooms where id = v_room_id for update;
  if v_phase not in ('setup', 'collecting', 'reviewing') then
    raise exception using errcode = '55000', message = 'The shared deck is locked';
  end if;
  if v_deadline is not null and now() >= v_deadline then
    raise exception using errcode = '55000', message = 'The contribution window has ended; the host can start voting';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists cards_contribution_deadline_guard on public.cards;
create trigger cards_contribution_deadline_guard
  before insert or update or delete on public.cards
  for each row execute function public.guard_contribution_deadline();

create or replace function public.guard_contribution_cutoff_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
begin
  if new.phase = 'voting'
    and old.phase in ('setup', 'collecting', 'reviewing')
    and old.contribution_deadline is not null
    and now() < old.contribution_deadline then
    raise exception using errcode = '55000', message = 'Contribution grace period is still open';
  end if;
  return new;
end;
$;

drop trigger if exists rooms_contribution_cutoff_transition on public.rooms;
create trigger rooms_contribution_cutoff_transition
  before update of phase on public.rooms
  for each row execute function public.guard_contribution_cutoff_transition();

create or replace function public.get_room_snapshot(
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
  v_cards jsonb;
begin
  if p_room_code is null or p_participant_id is null or p_participant_secret is null
    or pg_catalog.length(p_participant_secret) <> 64 then
    raise exception using errcode = '28000', message = 'Valid room-scoped identity required';
  end if;
  select * into v_room from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code));
  if not found then raise exception using errcode = 'P0002', message = 'Room not found'; end if;
  v_participant := public._participant_for_secret(v_room.id, p_participant_id, p_participant_secret);
  if v_participant.id is null then raise exception using errcode = '28000', message = 'Invalid room-scoped identity'; end if;

  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'id', c.id,
    'submitter_participant_id', c.submitter_participant_id,
    'category_data', c.category_data,
    'position', c.position,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) order by c.position), '[]'::jsonb)
  into v_cards from public.cards c where c.room_id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'room_id', v_room.id,
    'room_code', v_room.room_code,
    'title', v_room.title,
    'category', v_room.category,
    'room_icon', v_room.room_icon,
    'phase', v_room.phase,
    'contribution_mode', v_room.contribution_mode,
    'cards_per_participant', v_room.cards_per_participant,
    'contribution_deadline', v_room.contribution_deadline,
    'active_round_id', v_room.active_round_id,
    'active_round_eligible_card_ids', coalesce((
      select pg_catalog.to_jsonb(vr.eligible_card_ids)
      from public.voting_rounds vr where vr.id = v_room.active_round_id and vr.room_id = v_room.id
    ), '[]'::jsonb),
    'closed_at', v_room.closed_at,
    'expires_at', v_room.expires_at,
    'participant_id', v_participant.id,
    'role', v_participant.role,
    'contribution_done', v_participant.contribution_done_at is not null,
    'cards', v_cards
  );
end;
$$;

revoke all on function public.begin_contribution_cutoff(text, uuid, text) from public, anon, authenticated;
revoke all on function public.set_room_icon(text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.guard_contribution_deadline() from public, anon, authenticated;
revoke all on function public.guard_contribution_cutoff_transition() from public, anon, authenticated;
revoke all on function public.get_room_snapshot(text, uuid, text) from public, anon, authenticated;
grant execute on function public.begin_contribution_cutoff(text, uuid, text) to anon, authenticated;
grant execute on function public.set_room_icon(text, uuid, text, text) to anon, authenticated;
grant execute on function public.get_room_snapshot(text, uuid, text) to anon, authenticated;

comment on function public.begin_contribution_cutoff(text, uuid, text) is
  'Host-controlled, server-enforced one-minute grace window for contributions. Card writes are rejected after the deadline.';
comment on function public.set_room_icon(text, uuid, text, text) is
  'Persists a host-selected emoji room icon while the room is in setup.';
