-- =====================================================================
-- IFoundU: table permissions
-- Newer Supabase projects don't give the website access to new tables
-- automatically. These lines open the door; the Row Level Security rules
-- in schema.sql still decide exactly which rows each person can touch.
-- Run in Supabase: SQL Editor → New query → paste → Run. Safe to re-run.
-- =====================================================================

grant usage on schema public to anon, authenticated;

-- Visitors (not signed in) can browse public listings
grant select on public.profiles, public.items, public.verification_questions to anon;

-- Signed-in users
grant select, update                 on public.profiles               to authenticated;
grant select, update                 on public.profile_contacts       to authenticated;
grant select, insert, update, delete on public.items                  to authenticated;
grant select, insert, update, delete on public.verification_questions to authenticated;
grant select, insert, update, delete on public.claims                 to authenticated;
grant select, insert                 on public.claim_answers          to authenticated;
grant select, insert                 on public.messages               to authenticated;

-- Functions used by the website and by the security rules
grant execute on function public.match_items(extensions.vector, public.item_status, int, float)
  to anon, authenticated;
grant execute on function public.is_item_reporter(uuid)        to anon, authenticated;
grant execute on function public.is_claim_party(uuid)          to authenticated;
grant execute on function public.is_approved_claim_party(uuid) to authenticated;
grant execute on function public.shares_approved_claim(uuid)   to authenticated;

-- The sign-up trigger should only ever be run by Supabase itself
revoke execute on function public.handle_new_user() from public, anon, authenticated;
