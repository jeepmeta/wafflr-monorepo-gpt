begin;

select plan(12);

select has_table('public', 'rooms', 'rooms table exists');
select has_table('public', 'participants', 'participants table exists');
select has_table('public', 'cards', 'cards table exists');
select has_table('public', 'voting_rounds', 'voting rounds table exists');
select has_table('public', 'ballots', 'ballots table exists');
select has_table('public', 'ballot_responses', 'ballot responses table exists');

select ok(
  has_function_privilege('anon', 'public.create_room(text,text,text,smallint)', 'EXECUTE')
  and has_function_privilege('anon', 'public.join_room(text)', 'EXECUTE')
  and has_function_privilege('anon', 'public.get_room_snapshot(text,uuid,text)', 'EXECUTE'),
  'anonymous clients can only enter through trusted room RPCs'
);

select ok(
  not has_table_privilege('anon', 'public.rooms', 'SELECT')
  and not has_table_privilege('anon', 'public.cards', 'INSERT')
  and not has_table_privilege('anon', 'public.ballots', 'INSERT'),
  'anonymous clients have no direct table access'
);

create temporary table test_host as
select public.create_room('Wafflr SQL Test', 'eat', 'open', null) as payload;

create temporary table test_guest as
select public.join_room((select payload->>'room_code' from test_host)) as payload;

select ok(
  public.get_room_snapshot(
    (select payload->>'room_code' from test_host),
    ((select payload->>'participant_id' from test_host)::uuid),
    (select payload->>'participant_secret' from test_host)
  )->>'title' = 'Wafflr SQL Test',
  'a valid room-scoped secret can read its room snapshot'
);

create temporary table test_cards (payload jsonb);

insert into test_cards
select public.add_card(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host),
  '{"name":"Pasta place"}'::jsonb
);

insert into test_cards
select public.add_card(
  (select payload->>'room_code' from test_guest),
  ((select payload->>'participant_id' from test_guest)::uuid),
  (select payload->>'participant_secret' from test_guest),
  '{"name":"Taco place"}'::jsonb
);

create temporary table test_round as
select public.start_voting(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host)
) as payload;

select ok(
  (select payload->>'phase' from test_round) = 'voting'
  and jsonb_array_length((select payload->'eligible_card_ids' from test_round)) = 2,
  'host start locks a two-card deck into a voting round'
);

select lives_ok(
  format(
    'select public.submit_ballot(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    (select payload->>'participant_secret' from test_host),
    (select payload->>'round_id' from test_round),
    (select jsonb_agg(jsonb_build_object('card_id', payload->>'id', 'approved', true))::text from test_cards)
  ),
  'a complete ballot can be submitted once'
);

select throws_ok(
  format(
    'select public.submit_ballot(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    (select payload->>'participant_secret' from test_host),
    (select payload->>'round_id' from test_round),
    (select jsonb_agg(jsonb_build_object('card_id', payload->>'id', 'approved', false))::text from test_cards)
  ),
  '23505',
  'duplicate key value violates unique constraint "ballots_voting_round_id_participant_id_key"',
  'duplicate ballot submission is rejected'
);

select * from finish();
rollback;
