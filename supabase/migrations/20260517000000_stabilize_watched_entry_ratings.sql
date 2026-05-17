alter table public.watched_entries
drop constraint if exists watched_entries_rating_check;

update public.watched_entries
set rating = case rating
  when 'disliked' then 'crap'
  when 'neutral' then 'mediocre'
  when 'okay' then 'mediocre'
  when 'liked' then 'great'
  when 'crap' then 'crap'
  when 'mediocre' then 'mediocre'
  when 'great' then 'great'
  when 'awesome' then 'awesome'
  else 'great'
end;

alter table public.watched_entries
add constraint watched_entries_rating_check
check (rating in ('crap', 'mediocre', 'great', 'awesome'));

alter table public.watched_entries
alter column rating set default 'great';

alter table public.watched_entries
alter column rating set not null;
