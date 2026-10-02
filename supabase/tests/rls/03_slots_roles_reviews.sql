\set QUIET on
set client_min_messages = notice;
-- ---------- seed (as superuser) ----------
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000001c3','c3@x','{"role":"client","full_name":"Client Three"}'),
 ('00000000-0000-0000-0000-0000000001c4','c4@x','{"role":"client","full_name":"Client Four"}'),
 ('00000000-0000-0000-0000-0000000001a4','m4@x','{"role":"master","full_name":"Master Four"}');
insert into masters (id, profile_id, bio) values
 ('00000000-0000-0000-0000-0000000001b4','00000000-0000-0000-0000-0000000001a4','m4');
insert into services (id, master_id, name, category, price_kzt, duration_minutes) values
 ('00000000-0000-0000-0000-0000000001d4','00000000-0000-0000-0000-0000000001b4','Брови','brow',5000,60);
insert into slots (id, master_id, starts_at, ends_at, is_booked) values
 ('00000000-0000-0000-0000-0000000001e1','00000000-0000-0000-0000-0000000001b4', now()+interval '48 hours', now()+interval '49 hours', true),
 ('00000000-0000-0000-0000-0000000001e2','00000000-0000-0000-0000-0000000001b4', now()-interval '50 hours', now()-interval '49 hours', true),
 ('00000000-0000-0000-0000-0000000001e3','00000000-0000-0000-0000-0000000001b4', now()-interval '26 hours', now()-interval '25 hours', true);
insert into bookings (id, slot_id, client_id, master_id, service_id, service_name_snapshot, price_kzt_snapshot, duration_minutes_snapshot, status, starts_at, ends_at) values
 ('00000000-0000-0000-0000-0000000001f1','00000000-0000-0000-0000-0000000001e1','00000000-0000-0000-0000-0000000001c3','00000000-0000-0000-0000-0000000001b4','00000000-0000-0000-0000-0000000001d4','Брови',5000,60,'pending',   now()+interval '48 hours', now()+interval '49 hours'),
 ('00000000-0000-0000-0000-0000000001f2','00000000-0000-0000-0000-0000000001e2','00000000-0000-0000-0000-0000000001c3','00000000-0000-0000-0000-0000000001b4','00000000-0000-0000-0000-0000000001d4','Брови',5000,60,'completed', now()-interval '50 hours', now()-interval '49 hours'),
 ('00000000-0000-0000-0000-0000000001f3','00000000-0000-0000-0000-0000000001e3','00000000-0000-0000-0000-0000000001c3','00000000-0000-0000-0000-0000000001b4','00000000-0000-0000-0000-0000000001d4','Брови',5000,60,'completed', now()-interval '26 hours', now()-interval '25 hours');

\echo '--- Slot is freed on cancel and can be booked again'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000001c3',false) \gset
select t.check('client cancels booking (legit)', $q$update bookings set status='cancelled_by_client' where id='00000000-0000-0000-0000-0000000001f1'$q$, true);
reset role;
select t.assert('slot freed after client cancel', (select not is_booked from slots where id='00000000-0000-0000-0000-0000000001e1'));
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000001c4',false) \gset
select t.check('another client books the freed slot (legit)', $q$select create_booking_atomic('00000000-0000-0000-0000-0000000001c4','00000000-0000-0000-0000-0000000001b4','00000000-0000-0000-0000-0000000001d4','00000000-0000-0000-0000-0000000001e1', null)$q$, true);
select t.check('same slot booked twice', $q$select create_booking_atomic('00000000-0000-0000-0000-0000000001c4','00000000-0000-0000-0000-0000000001b4','00000000-0000-0000-0000-0000000001d4','00000000-0000-0000-0000-0000000001e1', null)$q$, false);
reset role;
select t.assert('one active booking on the slot', (select count(*) = 1 from bookings where slot_id='00000000-0000-0000-0000-0000000001e1' and status not in ('cancelled_by_client','cancelled_by_master')));
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000001a4',false) \gset
select t.check('master cancels the new booking (legit)', $q$update bookings set status='cancelled_by_master', master_notes='болею' where slot_id='00000000-0000-0000-0000-0000000001e1' and status='pending'$q$, true);
reset role;
select t.assert('slot freed after master cancel', (select not is_booked from slots where id='00000000-0000-0000-0000-0000000001e1'));

\echo '--- Role is fixed after signup'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000001c3',false) \gset
select t.check('client changes own role to master', $q$update profiles set role='master' where id=auth.uid()$q$, false);
select t.check('client creates a masters row', $q$insert into masters (profile_id, bio) values (auth.uid(), 'fake')$q$, false);
select t.check('client changes own name (legit)', $q$update profiles set full_name='Client 3' where id=auth.uid()$q$, true);
reset role;

\echo '--- One review per client per master'
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000001c3',false) \gset
select t.check('client reviews first visit (legit)', $q$insert into reviews (booking_id, master_id, client_id, rating) values ('00000000-0000-0000-0000-0000000001f2','00000000-0000-0000-0000-0000000001b4',auth.uid(),5)$q$, true);
select t.check('same client reviews same master again', $q$insert into reviews (booking_id, master_id, client_id, rating) values ('00000000-0000-0000-0000-0000000001f3','00000000-0000-0000-0000-0000000001b4',auth.uid(),5)$q$, false);
reset role;
select t.assert('rating 5.00 with 1 review', (select rating = 5 and reviews_count = 1 from masters where id='00000000-0000-0000-0000-0000000001b4'));
set role service_role;
select t.check('admin deletes a fake review', $q$delete from reviews where booking_id='00000000-0000-0000-0000-0000000001f2'$q$, true);
reset role;
select t.assert('rating recalculated after delete', (select rating = 0 and reviews_count = 0 from masters where id='00000000-0000-0000-0000-0000000001b4'));
