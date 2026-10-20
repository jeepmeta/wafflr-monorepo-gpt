-- Ensure pgcrypto functions are available in the schema used by trusted RPCs.
-- Supabase commonly preinstalls this extension in `extensions`; local PostgreSQL
-- installations may initially place it in `public`.
create schema if not exists extensions;

do $migration$
declare
  v_extension_schema text;
begin
  select n.nspname into v_extension_schema
  from pg_catalog.pg_extension e
  join pg_catalog.pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_extension_schema is null then
    execute 'create extension pgcrypto with schema extensions';
  elsif v_extension_schema <> 'extensions' then
    execute 'alter extension pgcrypto set schema extensions';
  end if;
end;
$migration$;

-- Trusted entry points for room creation, joining, and room-scoped reads.
-- All mutations run as the database owner but validate their inputs and identity.
-- Do not add broad table grants: clients interact through these RPCs only.

create or replace function public.create_room(
  p_title text,
  p_category text,
  p_contribution_mode text default 'open',
  p_cards_per_participant smallint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_participant_id uuid;
  v_room_code text;
  v_identity_secret text;
  v_identity_hash text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_attempt integer := 0;
begin
  if p_title is null or pg_catalog.char_length(pg_catalog.btrim(p_title)) not between 1 and 80 then
    raise exception using errcode = '22023', message = 'Title must be 1 to 80 characters';
  end if;
  if p_category is null or p_category not in ('eat', 'watch', 'do', 'custom') then
    raise exception using errcode = '22023', message = 'Invalid category';
  end if;
  if p_contribution_mode is null or p_contribution_mode not in ('open', 'guest-quota') then
    raise exception using errcode = '22023', message = 'Invalid contribution mode';
  end if;
  if (p_contribution_mode = 'open' and p_cards_per_participant is not null)
    or (p_contribution_mode = 'guest-quota' and (p_cards_per_participant is null or p_cards_per_participant not between 1 and 3)) then
    raise exception using errcode = '22023', message = 'Invalid contribution quota';
  end if;

  v_identity_secret := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  v_identity_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(v_identity_secret, 'UTF8'), 'sha256'), 'hex');

  loop
    v_attempt := v_attempt + 1;
    -- Twelve characters from a 32-symbol alphabet provide 60 bits of locator entropy.
    v_room_code := '';
    for i in 1..12 loop
      v_room_code := v_room_code || pg_catalog.substr(v_alphabet, 1 + pg_catalog.get_byte(extensions.gen_random_bytes(1), 0) % pg_catalog.length(v_alphabet), 1);
    end loop;

    begin
      insert into public.rooms (room_code, title, category, contribution_mode, cards_per_participant)
      values (v_room_code, pg_catalog.btrim(p_title), p_category, p_contribution_mode, p_cards_per_participant)
      returning id into v_room_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception using errcode = '54000', message = 'Unable to allocate room code; retry';
      end if;
    end;
  end loop;

  insert into public.participants (room_id, role, identity_secret_hash)
  values (v_room_id, 'host', v_identity_hash)
  returning id into v_participant_id;

  update public.rooms
    set creator_participant_id = v_participant_id
    where id = v_room_id;

  return pg_catalog.jsonb_build_object(
    'room_id', v_room_id,
    'room_code', v_room_code,
    'participant_id', v_participant_id,
    'participant_secret', v_identity_secret,
    'role', 'host',
    'title', pg_catalog.btrim(p_title),
    'category', p_category,
    'phase', 'setup',
    'contribution_mode', p_contribution_mode,
    'cards_per_participant', p_cards_per_participant
  );
end;
$$;

create or replace function public.join_room(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_participant_id uuid;
  v_identity_secret text;
  v_identity_hash text;
begin
  if p_room_code is null or pg_catalog.char_length(pg_catalog.btrim(p_room_code)) not between 1 and 32
    or pg_catalog.upper(pg_catalog.btrim(p_room_code)) !~ '^[A-Z0-9]+$' then
    raise exception using errcode = '22023', message = 'Enter a valid room code';
  end if;

  select * into v_room
    from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code))
      and phase <> 'closed'
      and (expires_at is null or expires_at > now());

  if not found then
    raise exception using errcode = 'P0002', message = 'Room not found or no longer available';
  end if;
  if v_room.phase not in ('setup', 'collecting', 'reviewing') then
    raise exception using errcode = '55000', message = 'Room is no longer accepting participants';
  end if;

  v_identity_secret := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  v_identity_hash := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(v_identity_secret, 'UTF8'), 'sha256'), 'hex');

  insert into public.participants (room_id, role, identity_secret_hash)
  values (v_room.id, 'guest', v_identity_hash)
  returning id into v_participant_id;

  return pg_catalog.jsonb_build_object(
    'room_id', v_room.id,
    'room_code', v_room.room_code,
    'participant_id', v_participant_id,
    'participant_secret', v_identity_secret,
    'role', 'guest',
    'title', v_room.title,
    'category', v_room.category,
    'phase', v_room.phase,
    'contribution_mode', v_room.contribution_mode,
    'cards_per_participant', v_room.cards_per_participant
  );
end;
$$;

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

  select * into v_room
    from public.rooms
    where room_code = pg_catalog.upper(pg_catalog.btrim(p_room_code));

  if not found then
    raise exception using errcode = 'P0002', message = 'Room not found';
  end if;

  select * into v_participant
    from public.participants
    where room_id = v_room.id
      and id = p_participant_id
      and identity_secret_hash = pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_participant_secret, 'UTF8'), 'sha256'), 'hex');

  if not found then
    raise exception using errcode = '28000', message = 'Invalid room-scoped identity';
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', c.id,
        'submitter_participant_id', c.submitter_participant_id,
        'category_data', c.category_data,
        'position', c.position,
        'created_at', c.created_at,
        'updated_at', c.updated_at
      ) order by c.position
    ),
    '[]'::jsonb
  )
  into v_cards
  from public.cards c
  where c.room_id = v_room.id;

  return pg_catalog.jsonb_build_object(
    'room_id', v_room.id,
    'room_code', v_room.room_code,
    'title', v_room.title,
    'category', v_room.category,
    'phase', v_room.phase,
    'contribution_mode', v_room.contribution_mode,
    'cards_per_participant', v_room.cards_per_participant,
    'active_round_id', v_room.active_round_id,
    'active_round_eligible_card_ids', coalesce((
      select pg_catalog.to_jsonb(vr.eligible_card_ids)
      from public.voting_rounds vr
      where vr.id = v_room.active_round_id and vr.room_id = v_room.id
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

revoke all on function public.create_room(text, text, text, smallint) from public, anon, authenticated;
revoke all on function public.join_room(text) from public, anon, authenticated;
revoke all on function public.get_room_snapshot(text, uuid, text) from public, anon, authenticated;

grant execute on function public.create_room(text, text, text, smallint) to anon, authenticated;
grant execute on function public.join_room(text) to anon, authenticated;
grant execute on function public.get_room_snapshot(text, uuid, text) to anon, authenticated;

comment on function public.create_room(text, text, text, smallint) is
  'Creates a room and host identity; returns the random participant secret once. Apply gateway/app-level abuse controls before public launch.';
comment on function public.join_room(text) is
  'Joins a room by code and returns a random room-scoped participant secret once. Apply join-attempt rate limits before public launch.';
comment on function public.get_room_snapshot(text, uuid, text) is
  'Returns room state only after verifying the room-scoped participant secret.';
