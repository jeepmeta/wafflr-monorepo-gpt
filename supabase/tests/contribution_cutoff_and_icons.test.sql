begin;

select plan(8);

select has_column('public', 'rooms', 'room_icon', 'rooms persist a selected icon');
select has_column('public', 'rooms', 'contribution_deadline', 'rooms persist the contribution cutoff');
select ok(
  has_function_privilege('anon', 'public.begin_contribution_cutoff(text,uuid,text)', 'EXECUTE')
  and has_function_privilege('anon', 'public.set_room_icon(text,uuid,text,text)', 'EXECUTE'),
  'anonymous participants use scoped RPCs for cutoff and icon updates'
);

create temporary table cutoff_host as
select public.create_room('Cutoff Test', 'eat', 'open', null) as payload;

select lives_ok(
  format('select public.set_room_icon(%L, %L::uuid, %L, %L)',
    (select payload->>'room_code' from cutoff_host),
    (select payload->>'participant_id' from cutoff_host),
    (select payload->>'participant_secret' from cutoff_host),
    '🦄'),
  'the host can persist a custom room icon during setup'
);

select is(
  public.get_room_snapshot(
    (select payload->>'room_code' from cutoff_host),
    ((select payload->>'participant_id' from cutoff_host)::uuid),
    (select payload->>'participant_secret' from cutoff_host)
  )->>'room_icon',
  '🦄',
  'the selected icon is returned in the room snapshot'
);

select public.add_card(
  (select payload->>'room_code' from cutoff_host),
  ((select payload->>'participant_id' from cutoff_host)::uuid),
  (select payload->>'participant_secret' from cutoff_host),
  '{"title":"Option one"}'::jsonb
);
select public.add_card(
  (select payload->>'room_code' from cutoff_host),
  ((select payload->>'participant_id' from cutoff_host)::uuid),
  (select payload->>'participant_secret' from cutoff_host),
  '{"title":"Option two"}'::jsonb
);

select is(
  public.begin_contribution_cutoff(
    (select payload->>'room_code' from cutoff_host),
    ((select payload->>'participant_id' from cutoff_host)::uuid),
    (select payload->>'participant_secret' from cutoff_host)
  )->>'phase',
  'reviewing',
  'starting cutoff moves the room into host review'
);

select throws_ok(
  format('select public.start_voting(%L, %L::uuid, %L)',
    (select payload->>'room_code' from cutoff_host),
    (select payload->>'participant_id' from cutoff_host),
    (select payload->>'participant_secret' from cutoff_host)),
  '55000',
  'Contribution grace period is still open',
  'the host cannot start voting before the one-minute grace period ends'
);

update public.rooms
set contribution_deadline = now() - interval '1 second'
where room_code = (select payload->>'room_code' from cutoff_host);

select throws_ok(
  format('select public.add_card(%L, %L::uuid, %L, %L::jsonb)',
    (select payload->>'room_code' from cutoff_host),
    (select payload->>'participant_id' from cutoff_host),
    (select payload->>'participant_secret' from cutoff_host),
    '{"title":"Too late"}'),
  '55000',
  'The contribution window has ended; the host can start voting',
  'the server rejects cards after the cutoff deadline'
);

select * from finish();
rollback;
