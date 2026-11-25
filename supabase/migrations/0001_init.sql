-- vCard.in.th: multi-user personal bio profiles.
-- Run once in Supabase SQL Editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Profiles: one per auth user, public at https://vcard.in.th/<slug>/
-- ---------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users (id) on delete cascade,
  slug             text not null unique,
  first_name_th    text not null default '',
  last_name_th     text not null default '',
  first_name_en    text not null default '',
  last_name_en     text not null default '',
  nickname         text not null default '',
  title_th         text not null default '',
  title_en         text not null default '',
  company          text not null default '',
  company_en       text not null default '',
  tagline          text not null default '',
  bio              text not null default '',
  bio_en           text not null default '',
  mobile           text not null default '',
  email_1          text not null default '',
  email_2          text not null default '',
  website          text not null default '',
  location         text not null default '',
  avatar_url       text not null default '',
  banner_url       text not null default '',
  tags             text[] not null default '{}',
  published        boolean not null default false,
  show_vcard       boolean not null default true,
  show_lang_toggle boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- lowercase a-z 0-9 and hyphens, 2-32 chars; must not clash with app routes
  constraint profiles_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,31}$'),
  constraint profiles_slug_reserved check (
    slug not in ('login', 'dashboard', 'admin', 'api', 'auth', 'app', 'www',
                 'static', 'assets', 'vcard', 'help', 'about', 'terms', 'privacy',
                 'index', '404', 'settings', 'signup', 'logout')
  )
);

create table public.socials (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  kind        text not null default 'website',
  label       text not null default '',
  handle      text not null default '',
  url         text not null,
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);
create index socials_profile_idx on public.socials (profile_id, sort_order);

create table public.ctas (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  label       text not null,
  url         text not null,
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);
create index ctas_profile_idx on public.ctas (profile_id, sort_order);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public (anon) can read published profiles; owners can read/write their own.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.socials  enable row level security;
alter table public.ctas     enable row level security;

create policy "profiles: read published or own" on public.profiles
  for select using (published or user_id = (select auth.uid()));
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "profiles: delete own" on public.profiles
  for delete to authenticated using (user_id = (select auth.uid()));

-- children: visible when parent is published or owned; writable by owner
create or replace function public.owns_profile(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = pid and p.user_id = (select auth.uid()));
$$;
create or replace function public.profile_is_public(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = pid and p.published);
$$;

create policy "socials: read" on public.socials
  for select using (public.profile_is_public(profile_id) or public.owns_profile(profile_id));
create policy "socials: write own" on public.socials
  for all to authenticated
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

create policy "ctas: read" on public.ctas
  for select using (public.profile_is_public(profile_id) or public.owns_profile(profile_id));
create policy "ctas: write own" on public.ctas
  for all to authenticated
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

-- ---------------------------------------------------------------------------
-- Storage: public avatars bucket, each user writes only under <uid>/...
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
