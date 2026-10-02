\set QUIET on
set client_min_messages = notice;
-- ---------- seed (as superuser) ----------
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000c1','c1@x','{"role":"client","full_name":"Client One"}'),
 ('00000000-0000-0000-0000-0000000000c2','c2@x','{"role":"client","full_name":"Client Two"}'),
 ('00000000-0000-0000-0000-0000000000a1','m1@x','{"role":"master","full_name":"Master One"}'),
 ('00000000-0000-0000-0000-0000000000a2','m2@x','{"role":"master","full_name":"Master Two"}'),
 ('00000000-0000-0000-0000-0000000000a3','m3@x','{"role":"master","full_name":"Master New"}');
insert into masters (id, profile_id, bio) values
 ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1','m1'),
 ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000a2','m2');
insert into services (id, master_id, name, category, price_kzt, duration_minutes) values
 ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000b1','Маникюр','nail',8000,60);
insert into slots (id, master_id, starts_at, ends_at) values
 ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000b1', now()-interval '3 hours', now()-interval '2 hours'),
 ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000b1', now()+interval '48 hours', now()+interval '49 hours'),
 ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000b1', now()+interval '72 hours', now()+interval '73 hours'),
 ('00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-0000000000b1', now()+interval '96 hours', now()+interval '97 hours'),
 ('00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-0000000000b1', now()-interval '30 hours', now()-interval '29 hours'),
 ('00000000-0000-0000-0000-0000000000e6','00000000-0000-0000-0000-0000000000b1', now()+interval '120 hours', now()+interval '121 hours');
update slots set is_booked = true where id in ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-0000000000e6');
insert into bookings (id, slot_id, client_id, master_id, service_id, service_name_snapshot, price_kzt_snapshot, duration_minutes_snapshot, status, starts_at, ends_at) values
 ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000d1','Маникюр',8000,60,'confirmed', now()-interval '3 hours', now()-interval '2 hours'),
 ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000d1','Маникюр',8000,60,'pending', now()+interval '48 hours', now()+interval '49 hours'),
 ('00000000-0000-0000-0000-0000000000f5','00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000d1','Маникюр',8000,60,'confirmed', now()-interval '30 hours', now()-interval '29 hours'),
 ('00000000-0000-0000-0000-0000000000f6','00000000-0000-0000-0000-0000000000e6','00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000d1','Маникюр',8000,60,'pending', now()+interval '120 hours', now()+interval '121 hours');

\echo '--- Client One (attacker paths + legit flows)'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000c1',false) \gset
select t.check('client marks own past booking completed', $q$update bookings set status='completed' where id='00000000-0000-0000-0000-0000000000f1'$q$, false);
select t.check('client reviews a visit that did not happen', $q$insert into reviews (booking_id, master_id, client_id, rating) values ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000c1',5)$q$, false);
select t.check('client lowers price snapshot', $q$update bookings set price_kzt_snapshot=1 where id='00000000-0000-0000-0000-0000000000f2'$q$, false);
select t.check('client inserts booking directly, bypassing create_booking_atomic', $q$insert into bookings (slot_id, client_id, master_id, service_id, service_name_snapshot, price_kzt_snapshot, duration_minutes_snapshot, starts_at, ends_at) values ('00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000d1','x',1,60, now()+interval '96 hours', now()+interval '97 hours')$q$, false);
select t.check('client books via create_booking_atomic (legit)', $q$select create_booking_atomic('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000e3', 'hi')$q$, true);
select t.check('client cancels with backdated status_changed_at (legit cancel)', $q$update bookings set status='cancelled_by_client', status_changed_at='2000-01-01' where id='00000000-0000-0000-0000-0000000000f2'$q$, true);
reset role;
select t.assert('status_changed_at set by DB, not by client', (select status_changed_at > now()-interval '1 minute' from bookings where id='00000000-0000-0000-0000-0000000000f2'));

\echo '--- Master One'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false) \gset
select t.check('master sets is_verified', $q$update masters set is_verified=true where profile_id=auth.uid()$q$, false);
select t.check('master sets rating 5', $q$update masters set rating=5, reviews_count=100 where profile_id=auth.uid()$q$, false);
select t.check('master gives self boost', $q$update masters set boost_until=now()+interval '30 days' where profile_id=auth.uid()$q$, false);
select t.check('master edits bio/address (legit)', $q$update masters set bio='new bio', address='Astana', lat=51.1, lng=71.4 where profile_id=auth.uid()$q$, true);
select t.check('master confirms new booking (legit)', $q$update bookings set status='confirmed', status_changed_at=now() where slot_id='00000000-0000-0000-0000-0000000000e3'$q$, true);
select t.check('master completes a future booking', $q$update bookings set status='completed' where slot_id='00000000-0000-0000-0000-0000000000e3'$q$, false);
select t.check('master changes price of a booking', $q$update bookings set price_kzt_snapshot=99999 where id='00000000-0000-0000-0000-0000000000f1'$q$, false);
select t.check('master completes past booking (legit)', $q$update bookings set status='completed', status_changed_at=now() where id='00000000-0000-0000-0000-0000000000f1'$q$, true);
select t.check('master marks no-show on past booking (legit)', $q$update bookings set status='no_show', status_changed_at=now() where id='00000000-0000-0000-0000-0000000000f5'$q$, true);
select t.check('master flips completed -> no_show', $q$update bookings set status='no_show' where id='00000000-0000-0000-0000-0000000000f1'$q$, false);
select t.check('master cancels with reason (legit)', $q$update bookings set status='cancelled_by_master', status_changed_at=now(), master_notes='заболела' where id='00000000-0000-0000-0000-0000000000f6'$q$, true);
select t.check('master reviews own visit', $q$insert into reviews (booking_id, master_id, client_id, rating) values ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b1',auth.uid(),5)$q$, false);
reset role;

\echo '--- Client One reviews the completed visit'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000c1',false) \gset
select t.check('client puts review on a different master', $q$insert into reviews (booking_id, master_id, client_id, rating) values ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000c1',1)$q$, false);
select t.check('client reviews completed visit (legit)', $q$insert into reviews (booking_id, master_id, client_id, rating, text) values ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000c1',4,'ok')$q$, true);
reset role;
select t.assert('rating recalculated by trigger to 4.00', (select rating = 4 and reviews_count = 1 from masters where id='00000000-0000-0000-0000-0000000000b1'));
select t.assert('beauty score: c1 completed=1', (select completed_bookings = 1 from client_scores where client_id='00000000-0000-0000-0000-0000000000c1'));
select t.assert('beauty score: c2 no_shows=1', (select no_shows = 1 from client_scores where client_id='00000000-0000-0000-0000-0000000000c2'));

\echo '--- New master onboarding'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a3',false) \gset
select t.check('new master inserts pre-verified row', $q$insert into masters (profile_id, is_verified, rating) values (auth.uid(), true, 5)$q$, false);
select t.check('signup upsert (legit)', $q$insert into masters (profile_id, city, categories) values (auth.uid(), 'Astana', '{}') on conflict (profile_id) do update set city=excluded.city, categories=excluded.categories$q$, true);
select t.check('onboarding basics upsert (legit)', $q$insert into masters (profile_id, bio, categories, instagram_handle) values (auth.uid(), 'bio', '{nail}', 'insta') on conflict (profile_id) do update set bio=excluded.bio, categories=excluded.categories, instagram_handle=excluded.instagram_handle$q$, true);
select t.check('onboarding finish sets is_active=true (legit)', $q$update masters set is_active=true where profile_id=auth.uid()$q$, true);
reset role;

\echo '--- Admin via service_role'
set role service_role;
select t.check('admin verifies master', $q$update masters set is_verified=true where id='00000000-0000-0000-0000-0000000000b2'$q$, true);
select t.check('admin sets boost', $q$update masters set boost_until=now()+interval '7 days' where id='00000000-0000-0000-0000-0000000000b2'$q$, true);
select t.check('admin deactivates master', $q$update masters set is_active=false where id='00000000-0000-0000-0000-0000000000b2'$q$, true);
reset role;

\echo '--- Deactivated Master Two'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2',false) \gset
select t.check('deactivated master re-activates self', $q$update masters set is_active=true where profile_id=auth.uid()$q$, false);
select t.check('deactivated master edits bio (legit)', $q$update masters set bio='still me' where profile_id=auth.uid()$q$, true);
reset role;
