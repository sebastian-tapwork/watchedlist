-- Watchedlist RLS policies for the temporary single-user MVP.
-- Run this in the Supabase SQL editor for the project.
--
-- RLS stays enabled, but the public anon app role can read and mutate the
-- single-user data until a login flow exists.
-- TODO: When auth is added back, remove the anon policies below and restore
-- watched_entries ownership checks with user_id = auth.uid().

alter table public.movies enable row level security;
alter table public.watched_entries enable row level security;

alter table public.watched_entries
alter column user_id drop not null;

create unique index if not exists movies_tmdb_id_key
on public.movies (tmdb_id)
where tmdb_id is not null;

drop policy if exists "Authenticated users can read movies" on public.movies;
drop policy if exists "Authenticated users can insert movies" on public.movies;
drop policy if exists "Users can read own watched entries" on public.watched_entries;
drop policy if exists "Users can insert own watched entries" on public.watched_entries;
drop policy if exists "Users can update own watched entries" on public.watched_entries;
drop policy if exists "Users can delete own watched entries" on public.watched_entries;

drop policy if exists "Allow public read watched entries" on public.watched_entries;
drop policy if exists "Allow public insert watched entries" on public.watched_entries;
drop policy if exists "Allow public read movies" on public.movies;
drop policy if exists "Allow public insert movies" on public.movies;
drop policy if exists "Anyone can read movies for single user MVP" on public.movies;
drop policy if exists "Anyone can insert movies for single user MVP" on public.movies;
drop policy if exists "Anyone can read watched entries for single user MVP" on public.watched_entries;
drop policy if exists "Anyone can insert watched entries for single user MVP" on public.watched_entries;

drop policy if exists "Anyone can update watched entries for single user MVP" on public.watched_entries;
create policy "Anyone can update watched entries for single user MVP"
on public.watched_entries
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anyone can delete watched entries for single user MVP" on public.watched_entries;
create policy "Anyone can delete watched entries for single user MVP"
on public.watched_entries
for delete
to anon, authenticated
using (true);

create policy "Allow public read watched entries"
on public.watched_entries
for select
to anon
using (true);

create policy "Allow public insert watched entries"
on public.watched_entries
for insert
to anon
with check (true);

create policy "Allow public read movies"
on public.movies
for select
to anon
using (true);

create policy "Allow public insert movies"
on public.movies
for insert
to anon
with check (true);
