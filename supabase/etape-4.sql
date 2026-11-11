-- Étape 4 : limites anti-abus et signalements uniques. À coller dans Supabase > SQL Editor, puis Run.

-- Limite : 5 discussions et 30 réponses par heure et par membre.
create function public.limit_posts() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; max_n int;
begin
  max_n := case tg_table_name when 'discussions' then 5 else 30 end;
  execute format('select count(*) from public.%I where author_id = $1 and created_at > now() - interval ''1 hour''', tg_table_name)
    into n using new.author_id;
  if n >= max_n then
    raise exception 'Trop de publications en peu de temps. Réessaie dans un moment.';
  end if;
  return new;
end $$;
create trigger discussions_limit before insert on public.discussions for each row execute function public.limit_posts();
create trigger replies_limit before insert on public.replies for each row execute function public.limit_posts();

-- Un membre ne peut signaler un même contenu qu'une seule fois.
create unique index reports_once on public.reports (reporter_id, coalesce(discussion_id, reply_id));
