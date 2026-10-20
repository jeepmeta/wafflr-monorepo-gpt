begin;

select plan(19);

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

select throws_ok(
  format(
    'select public.get_room_snapshot(%L, %L::uuid, %L)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    repeat('0', 64)
  ),
  '28000',
  'Invalid room-scoped identity',
  'an incorrect participant secret cannot read the room snapshot'
);

select throws_ok(
  format(
    'select public.add_card(%L, %L::uuid, %L, %L::jsonb)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    (select payload->>'participant_secret' from test_host),
    '{"title":" "}'
  ),
  '22023',
  'Invalid card input',
  'a card must have a non-empty title'
);

create temporary table test_cards (payload jsonb);

insert into test_cards
select public.add_card(
  (select payload->>'room_code' from test_host),
  ((select payload->>'participant_id' from test_host)::uuid),
  (select payload->>'participant_secret' from test_host),
  '{"title":"Pasta place"}'::jsonb
);

insert into test_cards
select public.add_card(
  (select payload->>'room_code' from test_guest),
  ((select payload->>'participant_id' from test_guest)::uuid),
  (select payload->>'participant_secret' from test_guest),
  '{"title":"Taco place"}'::jsonb
);

select lives_ok(
  format(
    'select public.edit_card(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    (select payload->>'participant_secret' from test_host),
    (select payload->>'id' from test_cards where payload->>'submitter_participant_id' = (select payload->>'participant_id' from test_host) limit 1),
    '{"title":"Host reviewed option"}'
  ),
  'the host can edit a card during final deck review'
);

select throws_ok(
  format(
    'select public.edit_card(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_guest),
    (select payload->>'participant_secret' from test_guest),
    (select payload->>'id' from test_cards where payload->>'submitter_participant_id' = (select payload->>'participant_id' from test_host) limit 1),
    '{"title":"Unauthorized edit"}'
  ),
  '42501',
  'You can only edit your own cards unless you are the host',
  'a guest cannot edit another participant’s card'
);

select throws_ok(
  format(
    'select public.edit_card(%L, %L::uuid, %L, %L::uuid, %L::jsonb)',
    (select payload->>'room_code' from test_host),
    (select payload->>'participant_id' from test_host),
    (select payload->>'participant_secret' from test_host),
    (select payload->>'id' from test_cards where payload->>'submitter_participant_id' = (select payload->>'participant_id' from test_host) limit 1),
    '{"title":""}'
  ),
  '22023',
  'Invalid card input',
  'card edits must keep a non-empty title'
);

select throws_ok(
  format(
    'select public.start_voting(%L, %L::uuid, %L)',
    (select payload->>'room_code' from test_guest),
    (select payload->>'participant_id' from test_guest),
    (select payload->>'participant_secret' from test_guest)
  ),
  '42501',
  'Only the host can start voting',
  'a guest cannot start the voting round'
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

select throws_ok(
  format('select public.join_room(%L)', (select payload->>'room_code' from test_host)),
  '55000',
  'Room is no longer accepting participants',
  'new participants cannot join after voting starts'
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
