alter table public.watched_entries
add column if not exists words text;
