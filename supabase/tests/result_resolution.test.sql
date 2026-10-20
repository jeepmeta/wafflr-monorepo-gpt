begin;

select plan(11);

create temporary table test_host as
select public.create_room('Tie-break test', 'watch', 'open', null) as payload;

create temporary table test_guest as
select public.join_room((select payload->>'room_code' from test_host)) as payload;

create temporary table test_cards (payload jsonb);

insert into test_cards
select public.add_card(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host),
  '{"name":"Movie A"}'::jsonb
);

insert into test_cards
select public.add_card(
  (select payload->>'room_code' from test_guest),
  ((select payload->>'participant_id' from test_guest)::uuid),
  (select payload->>'participant_secret' from test_guest),
  '{"name":"Movie B"}'::jsonb
);

create temporary table round_one as
select public.start_voting(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host)
) as payload;

select is((select payload->>'phase' from round_one), 'voting', 'first round starts');

select lives_ok(
  format(
    'select public.submit_ballot(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    (select payload->>'participant_secret' from test_host),
    (select payload->>'round_id' from round_one),
    (select jsonb_agg(jsonb_build_object('card_id', payload->>'id', 'approved', true))::text from test_cards)
  ),
  'host submits first-round ballot'
);

select lives_ok(
  format(
    'select public.submit_ballot(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_guest),
    (select payload->>'participant_id' from test_guest),
    (select payload->>'participant_secret' from test_guest),
    (select payload->>'round_id' from round_one),
    (select jsonb_agg(jsonb_build_object('card_id', payload->>'id', 'approved', true))::text from test_cards)
  ),
  'guest submits first-round ballot'
);

create temporary table first_result as
select public.resolve_voting_round(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host),
  ((select payload->>'round_id' from round_one)::uuid)
) as payload;

select is((select payload->>'resolution' from first_result), 'tie', 'equal Yep counts resolve to a tie');

create temporary table round_two as
select public.start_tie_breaker(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host)
) as payload;

select is((select payload->>'round_number' from round_two), '2', 'host can start the single tie-breaker round');

select lives_ok(
  format(
    'select public.submit_ballot(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    (select payload->>'participant_secret' from test_host),
    (select payload->>'round_id' from round_two),
    (select jsonb_agg(jsonb_build_object('card_id', payload->>'id', 'approved', payload->>'id' = (select payload->>'id' from test_cards order by payload->>'id' limit 1)))::text from test_cards)
  ),
  'host submits tie-breaker ballot'
);

select lives_ok(
  format(
    'select public.submit_ballot(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_guest),
    (select payload->>'participant_id' from test_guest),
    (select payload->>'participant_secret' from test_guest),
    (select payload->>'round_id' from round_two),
    (select jsonb_agg(jsonb_build_object('card_id', payload->>'id', 'approved', payload->>'id' = (select payload->>'id' from test_cards order by payload->>'id' limit 1)))::text from test_cards)
  ),
  'guest submits tie-breaker ballot'
);

create temporary table second_result as
select public.resolve_voting_round(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host),
  ((select payload->>'round_id' from round_two)::uuid)
) as payload;

select is((select payload->>'resolution' from second_result), 'winner', 'unique top Yep count wins tie-breaker');

select is(
  public.get_round_results(
    (select payload->>'room_code' from test_host),
    ((select payload->>'participant_id' from test_host)::uuid),
    (select payload->>'participant_secret' from test_host),
    ((select payload->>'round_id' from round_two)::uuid)
  )->>'winner_card_id',
  (select payload->>'id' from test_cards order by payload->>'id' limit 1),
  'authorized participant can read the resolved winner'
);

select lives_ok(
  format(
    'select public.close_room(%L, %L::uuid, %L)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    (select payload->>'participant_secret' from test_host)
  ),
  'host closes the winner room for 24-hour retention'
);

select is(
  public.get_room_snapshot(
    (select payload->>'room_code' from test_host),
    ((select payload->>'participant_id' from test_host)::uuid),
    (select payload->>'participant_secret' from test_host)
  )->>'phase',
  'closed',
  'closed room remains readable to its existing participant'
);

select * from finish();
rollback;
