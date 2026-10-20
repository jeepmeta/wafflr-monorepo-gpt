begin;

select plan(3);

create temporary table test_host as
select public.create_room('Disconnected host test', 'do', 'open', null) as payload;

insert into public.cards (room_id, submitter_participant_id, category_data, position)
select
  (select id from public.rooms where room_code = (select payload->>'room_code' from test_host)),
  ((select payload->>'participant_id' from test_host)::uuid),
  '{"name":"Option A"}'::jsonb,
  0;

insert into public.cards (room_id, submitter_participant_id, category_data, position)
select
  (select id from public.rooms where room_code = (select payload->>'room_code' from test_host)),
  ((select payload->>'participant_id' from test_host)::uuid),
  '{"name":"Option B"}'::jsonb,
  1;

create temporary table test_round as
select public.start_voting(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host)
) as payload;

update public.participants
set last_seen_at = now() - interval '11 minutes'
where id = ((select payload->>'participant_id' from test_host)::uuid);

select is(public.resolve_stale_host_rooms(10), 1, 'stale host round is resolved');

select is(
  (public.get_round_results(
    (select payload->>'room_code' from test_host),
    ((select payload->>'participant_id' from test_host)::uuid),
    (select payload->>'participant_secret' from test_host),
    ((select payload->>'round_id' from test_round)::uuid)
  )->>'resolution'),
  'no-ballots-random',
  'zero-ballot disconnect fallback selects a random eligible card'
);

select is(
  public.get_room_snapshot(
    (select payload->>'room_code' from test_host),
    ((select payload->>'participant_id' from test_host)::uuid),
    (select payload->>'participant_secret' from test_host)
  )->>'phase',
  'winner',
  'room is moved to winner phase after fallback'
);

select * from finish();
rollback;
