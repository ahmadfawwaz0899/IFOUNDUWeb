-- =====================================================================
-- IFoundU database schema
-- Run this ONCE in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- It is safe to re-run: it drops nothing and skips things that already exist.
-- =====================================================================

-- AI matching: pgvector stores each item's "fingerprint" (embedding).
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------
-- Fixed lists of values
-- ---------------------------------------------------------------------
do $$ begin
  create type public.item_status as enum ('found', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.item_category as enum
    ('phone', 'wallet', 'keys', 'bag', 'id-card', 'electronics', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.claim_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles: public info about each user (anyone can see the name)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- profile_contacts: PRIVATE contact details. Only the user themself can see
-- them, plus the other person once a claim between them is approved.
create table if not exists public.profile_contacts (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  phone       text,
  email       text,
  preferred   text,          -- e.g. "WhatsApp after 6pm"
  updated_at  timestamptz not null default now()
);

-- Create a profile automatically whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.profile_contacts (user_id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- items: every found or lost report
-- ---------------------------------------------------------------------
create table if not exists public.items (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status          public.item_status not null,
  category        public.item_category not null default 'other',
  title           text not null check (char_length(title) between 2 and 120),
  description     text,
  location_name   text not null,
  latitude        double precision,
  longitude       double precision,
  happened_at     timestamptz not null,           -- when it was found / lost
  photo_path      text,                           -- path inside the "item-photos" bucket
  is_sensitive    boolean not null default false, -- IDs, bank cards: blur in public lists
  is_resolved     boolean not null default false, -- true once returned to the owner
  ai_description  text,                           -- what the AI saw in the photo
  embedding       extensions.vector(384),         -- AI fingerprint for similarity search
  created_at      timestamptz not null default now()
);

create index if not exists items_status_created_idx on public.items (status, created_at desc);
create index if not exists items_category_idx on public.items (category);
create index if not exists items_embedding_idx
  on public.items using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------
-- verification_questions: set by the finder, e.g. "What is the lock screen photo?"
-- Only the QUESTIONS are stored. The finder judges the claimant's answers,
-- so there is no stored "correct answer" that could leak.
-- ---------------------------------------------------------------------
create table if not exists public.verification_questions (
  id        uuid primary key default gen_random_uuid(),
  item_id   uuid not null references public.items (id) on delete cascade,
  question  text not null check (char_length(question) between 3 and 300),
  position  smallint not null default 0
);

create index if not exists vq_item_idx on public.verification_questions (item_id);

-- ---------------------------------------------------------------------
-- claims: "this item is mine"
-- ---------------------------------------------------------------------
create table if not exists public.claims (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references public.items (id) on delete cascade,
  claimant_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status       public.claim_status not null default 'pending',
  message      text,
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  unique (item_id, claimant_id)
);

create index if not exists claims_item_idx on public.claims (item_id);
create index if not exists claims_claimant_idx on public.claims (claimant_id);

create table if not exists public.claim_answers (
  claim_id     uuid not null references public.claims (id) on delete cascade,
  question_id  uuid not null references public.verification_questions (id) on delete cascade,
  answer       text not null,
  primary key (claim_id, question_id)
);

-- ---------------------------------------------------------------------
-- messages: chat between finder and owner, only after a claim is approved
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  claim_id    uuid not null references public.claims (id) on delete cascade,
  sender_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists messages_claim_idx on public.messages (claim_id, created_at);

-- ---------------------------------------------------------------------
-- Helper checks used by the security rules below
-- (security definer so the rules don't loop back into each other)
-- ---------------------------------------------------------------------
create or replace function public.is_item_reporter(p_item_id uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.items
    where id = p_item_id and reporter_id = (select auth.uid())
  );
$$;

create or replace function public.is_claim_party(p_claim_id uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.claims c
    join public.items i on i.id = c.item_id
    where c.id = p_claim_id
      and (c.claimant_id = (select auth.uid()) or i.reporter_id = (select auth.uid()))
  );
$$;

create or replace function public.is_approved_claim_party(p_claim_id uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.claims c
    join public.items i on i.id = c.item_id
    where c.id = p_claim_id
      and c.status = 'approved'
      and (c.claimant_id = (select auth.uid()) or i.reporter_id = (select auth.uid()))
  );
$$;

-- True when the current user and p_user_id are the two sides of an approved claim.
create or replace function public.shares_approved_claim(p_user_id uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.claims c
    join public.items i on i.id = c.item_id
    where c.status = 'approved'
      and (
        (c.claimant_id = (select auth.uid()) and i.reporter_id = p_user_id)
        or (i.reporter_id = (select auth.uid()) and c.claimant_id = p_user_id)
      )
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security: who may read / write each table
-- ---------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.profile_contacts       enable row level security;
alter table public.items                  enable row level security;
alter table public.verification_questions enable row level security;
alter table public.claims                 enable row level security;
alter table public.claim_answers          enable row level security;
alter table public.messages               enable row level security;

-- profiles
drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles
  for select using (true);
drop policy if exists "Users edit own profile" on public.profiles;
create policy "Users edit own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- profile_contacts
drop policy if exists "See own or approved-claim contacts" on public.profile_contacts;
create policy "See own or approved-claim contacts" on public.profile_contacts
  for select to authenticated
  using (user_id = (select auth.uid()) or public.shares_approved_claim(user_id));
drop policy if exists "Edit own contacts" on public.profile_contacts;
create policy "Edit own contacts" on public.profile_contacts
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- items
drop policy if exists "Items are public" on public.items;
create policy "Items are public" on public.items
  for select using (true);
drop policy if exists "Signed-in users report items" on public.items;
create policy "Signed-in users report items" on public.items
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));
drop policy if exists "Reporters edit own items" on public.items;
create policy "Reporters edit own items" on public.items
  for update to authenticated
  using (reporter_id = (select auth.uid())) with check (reporter_id = (select auth.uid()));
drop policy if exists "Reporters delete own items" on public.items;
create policy "Reporters delete own items" on public.items
  for delete to authenticated
  using (reporter_id = (select auth.uid()));

-- verification_questions
drop policy if exists "Questions are public" on public.verification_questions;
create policy "Questions are public" on public.verification_questions
  for select using (true);
drop policy if exists "Reporters manage questions" on public.verification_questions;
create policy "Reporters manage questions" on public.verification_questions
  for all to authenticated
  using (public.is_item_reporter(item_id)) with check (public.is_item_reporter(item_id));

-- claims
drop policy if exists "Claim parties see claims" on public.claims;
create policy "Claim parties see claims" on public.claims
  for select to authenticated
  using (claimant_id = (select auth.uid()) or public.is_item_reporter(item_id));
drop policy if exists "Users claim others' items" on public.claims;
create policy "Users claim others' items" on public.claims
  for insert to authenticated
  with check (
    claimant_id = (select auth.uid())
    and status = 'pending'
    and not public.is_item_reporter(item_id)
  );
drop policy if exists "Reporters decide claims" on public.claims;
create policy "Reporters decide claims" on public.claims
  for update to authenticated
  using (public.is_item_reporter(item_id)) with check (public.is_item_reporter(item_id));
drop policy if exists "Claimants withdraw pending claims" on public.claims;
create policy "Claimants withdraw pending claims" on public.claims
  for delete to authenticated
  using (claimant_id = (select auth.uid()) and status = 'pending');

-- claim_answers
drop policy if exists "Claim parties see answers" on public.claim_answers;
create policy "Claim parties see answers" on public.claim_answers
  for select to authenticated
  using (public.is_claim_party(claim_id));
drop policy if exists "Claimants add answers" on public.claim_answers;
create policy "Claimants add answers" on public.claim_answers
  for insert to authenticated
  with check (
    exists (
      select 1 from public.claims c
      where c.id = claim_id and c.claimant_id = (select auth.uid()) and c.status = 'pending'
    )
  );

-- messages
drop policy if exists "Approved parties read messages" on public.messages;
create policy "Approved parties read messages" on public.messages
  for select to authenticated
  using (public.is_approved_claim_party(claim_id));
drop policy if exists "Approved parties send messages" on public.messages;
create policy "Approved parties send messages" on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_approved_claim_party(claim_id));

-- ---------------------------------------------------------------------
-- AI photo matching: find the items whose fingerprint is closest
-- ---------------------------------------------------------------------
create or replace function public.match_items(
  query_embedding extensions.vector(384),
  match_status    public.item_status default 'found',
  match_count     int default 10,
  min_similarity  float default 0.5
)
returns table (id uuid, similarity float)
language sql stable
set search_path = ''
as $$
  select i.id, 1 - (i.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.items i
  where i.status = match_status
    and not i.is_resolved
    and i.embedding is not null
    and 1 - (i.embedding operator(extensions.<=>) query_embedding) >= min_similarity
  order by i.embedding operator(extensions.<=>) query_embedding
  limit least(match_count, 50);
$$;

-- ---------------------------------------------------------------------
-- Photo storage: "item-photos" bucket
-- Files go in a folder named after the uploader: <user id>/<file name>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Users upload to own folder" on storage.objects;
create policy "Users upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete own photos" on storage.objects;
create policy "Users delete own photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
