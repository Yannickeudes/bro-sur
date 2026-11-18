-- Bro sûr : étape 5. À coller dans Supabase > SQL Editor, puis « Run ».
-- Ce script rassemble tout ce que le frontend utilise déjà : fils de réponses,
-- notifications, vues publiques corrigées et garde-fous anti-abus.
-- Il est idempotent : vous pouvez le relancer sans risque.

-- 1. Fils de réponses (un seul niveau de profondeur) -------------------------
alter table public.replies
  add column if not exists parent_reply_id uuid references public.replies(id) on delete cascade;
create index if not exists replies_parent_idx
  on public.replies (parent_reply_id) where parent_reply_id is not null;

-- Le parent doit appartenir à la même discussion et ne peut pas être lui-même
-- une réponse dans un fil (un seul niveau d'imbrication, comme l'interface).
create or replace function public.guard_reply_parent() returns trigger
language plpgsql security definer set search_path = public as $$
declare parent_discussion uuid; parent_depth int;
begin
  if new.parent_reply_id is null then return new; end if;
  select discussion_id, (parent_reply_id is not null)::int into parent_discussion, parent_depth
    from public.replies where id = new.parent_reply_id;
  if parent_discussion is null or parent_discussion <> new.discussion_id then
    raise exception 'La réponse parente est introuvable ou appartient à une autre discussion.';
  end if;
  if parent_depth > 0 then
    raise exception 'Un fil de réponses ne peut pas dépasser un niveau.';
  end if;
  return new;
end $$;
drop trigger if exists replies_guard_parent on public.replies;
create trigger replies_guard_parent before insert on public.replies
  for each row execute function public.guard_reply_parent();

-- 2. Profil créé même sans pseudonyme fourni (OAuth, import, appel API) -------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare pseudo text := new.raw_user_meta_data->>'pseudonym';
begin
  if pseudo is null or pseudo !~ '^[A-Za-z0-9_-]{3,20}$' then
    pseudo := 'membre_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;
  insert into public.profiles (id, pseudonym) values (new.id, pseudo);
  return new;
end $$;

-- 3. Notifications -------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  kind text not null check (kind in ('reply_to_discussion', 'reply_to_reply')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "notifications : les siennes" on public.notifications;
create policy "notifications : les siennes" on public.notifications
  for select using (user_id = auth.uid());
drop policy if exists "notifications : marquer lu" on public.notifications;
create policy "notifications : marquer lu" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Une réponse notifie l'auteur du fil parent (réponse dans un fil) et/ou
-- l'auteur de la discussion, sans jamais notifier la personne qui écrit
-- ni notifier deux fois la même personne.
create or replace function public.notify_on_reply() returns trigger
language plpgsql security definer set search_path = public as $$
declare d_author uuid; p_author uuid;
begin
  select author_id into d_author from public.discussions where id = new.discussion_id;
  if new.parent_reply_id is not null then
    select author_id into p_author from public.replies where id = new.parent_reply_id;
    if p_author is not null and p_author <> new.author_id then
      insert into public.notifications (user_id, discussion_id, kind)
      values (p_author, new.discussion_id, 'reply_to_reply');
    end if;
  end if;
  if d_author is not null and d_author <> new.author_id
     and d_author is distinct from p_author then
    insert into public.notifications (user_id, discussion_id, kind)
    values (d_author, new.discussion_id, 'reply_to_discussion');
  end if;
  return new;
end $$;
drop trigger if exists replies_notify on public.replies;
create trigger replies_notify after insert on public.replies
  for each row execute function public.notify_on_reply();

-- 4. Garde-fous : pas de soutien sur sa propre discussion, pas
--    d'auto-signalement ------------------------------------------------------
drop policy if exists "soutiens : ajouter" on public.supports;
create policy "soutiens : ajouter" on public.supports for insert
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.discussions d
      where d.id = discussion_id and d.author_id = auth.uid()
    )
  );

create or replace function public.guard_self_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.discussions where id = new.discussion_id and author_id = new.reporter_id)
     or exists (select 1 from public.replies where id = new.reply_id and author_id = new.reporter_id) then
    raise exception 'Tu ne peux pas signaler ton propre contenu.';
  end if;
  return new;
end $$;
drop trigger if exists reports_guard_self on public.reports;
create trigger reports_guard_self before insert on public.reports
  for each row execute function public.guard_self_report();

-- 5. Vues publiques corrigées ---------------------------------------------------
-- reply_count ne compte que les réponses racines ; thread_reply_count compte
-- celles dans les fils. replies_public expose parent_reply_id (pour charger
-- les fils) et is_discussion_author (badge « Auteur »).
drop view if exists public.replies_public;
create view public.replies_public as
select r.id, r.discussion_id, r.parent_reply_id, r.body, r.created_at, r.is_anonymous,
       case when r.is_anonymous then null else p.pseudonym end as author_pseudonym,
       (r.author_id = d.author_id) as is_discussion_author
from public.replies r
join public.profiles p on p.id = r.author_id
join public.discussions d on d.id = r.discussion_id and d.status = 'published'
where r.status = 'published';

drop view if exists public.discussions_public;
create view public.discussions_public as
select d.id, d.category, d.title, d.body, d.created_at, d.is_anonymous,
       case when d.is_anonymous then null else p.pseudonym end as author_pseudonym,
       (select count(*) from public.replies r
         where r.discussion_id = d.id and r.status = 'published'
           and r.parent_reply_id is null) as reply_count,
       (select count(*) from public.replies r
         where r.discussion_id = d.id and r.status = 'published'
           and r.parent_reply_id is not null) as thread_reply_count,
       (select count(*) from public.supports s where s.discussion_id = d.id) as support_count
from public.discussions d
join public.profiles p on p.id = d.author_id
where d.status = 'published';

grant select on public.categories, public.discussions_public, public.replies_public to anon, authenticated;
