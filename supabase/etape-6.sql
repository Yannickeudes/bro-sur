-- Bro sûr : étape 6. À coller dans Supabase > SQL Editor, puis « Run ».
-- Permet aux membres de modifier leurs propres contenus et expose is_mine
-- dans les vues publiques pour afficher le bouton « Modifier ».
-- Idempotent : peut être relancé sans risque.

-- 1. Vues publiques : ajout de is_mine (auth.uid() = auteur) -------------------
-- create or replace view peut ajouter une colonne en fin de liste.
create or replace view public.replies_public as
select r.id, r.discussion_id, r.parent_reply_id, r.body, r.created_at, r.is_anonymous,
       case when r.is_anonymous then null else p.pseudonym end as author_pseudonym,
       (r.author_id = d.author_id) as is_discussion_author,
       (r.author_id = auth.uid()) as is_mine
from public.replies r
join public.profiles p on p.id = r.author_id
join public.discussions d on d.id = r.discussion_id and d.status = 'published'
where r.status = 'published';

create or replace view public.discussions_public as
select d.id, d.category, d.title, d.body, d.created_at, d.is_anonymous,
       case when d.is_anonymous then null else p.pseudonym end as author_pseudonym,
       (select count(*) from public.replies r
         where r.discussion_id = d.id and r.status = 'published'
           and r.parent_reply_id is null) as reply_count,
       (select count(*) from public.replies r
         where r.discussion_id = d.id and r.status = 'published'
           and r.parent_reply_id is not null) as thread_reply_count,
       (select count(*) from public.supports s where s.discussion_id = d.id) as support_count,
       (d.author_id = auth.uid()) as is_mine
from public.discussions d
join public.profiles p on p.id = d.author_id
where d.status = 'published';

grant select on public.discussions_public, public.replies_public to anon, authenticated;

-- 2. Modification de ses propres contenus --------------------------------------
-- Passage par des fonctions security definer : l'auteur ne peut changer que
-- title/body (discussion) ou body (réponse), jamais le statut ni l'auteur.
-- Un modérateur qui masque un contenu ne peut donc pas être dé-masqué par
-- l'auteur, et l'auteur ne peut pas se promouvoir.

create or replace function public.edit_own_discussion(p_id uuid, p_title text, p_body text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_title is null or char_length(btrim(p_title)) not between 5 and 120
     or p_body is null or char_length(btrim(p_body)) not between 10 and 5000 then
    raise exception 'Le titre doit faire de 5 à 120 caractères et le texte de 10 à 5 000.';
  end if;
  update public.discussions
    set title = btrim(p_title), body = btrim(p_body)
    where id = p_id and author_id = auth.uid() and status = 'published';
  if not found then
    raise exception 'Discussion introuvable ou non modifiable.';
  end if;
end $$;

create or replace function public.edit_own_reply(p_id uuid, p_body text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_body is null or char_length(btrim(p_body)) not between 1 and 2000 then
    raise exception 'La réponse doit faire de 1 à 2 000 caractères.';
  end if;
  update public.replies
    set body = btrim(p_body)
    where id = p_id and author_id = auth.uid() and status = 'published';
  if not found then
    raise exception 'Réponse introuvable ou non modifiable.';
  end if;
end $$;

revoke all on function public.edit_own_discussion(uuid, text, text) from public, anon;
revoke all on function public.edit_own_reply(uuid, text) from public, anon;
grant execute on function public.edit_own_discussion(uuid, text, text) to authenticated;
grant execute on function public.edit_own_reply(uuid, text) to authenticated;

-- 3. Suppression de ses propres réponses (l'UI ne l'exposait pas) ---------------
-- La policy de suppression existe déjà ; rien à ajouter ici.
-- (delete sur replies est déjà autorisé à l'auteur dans schema.sql)

-- 4. Historique de modération : lecture des signalements traités ----------------
-- La policy « signalements : lire » autorise déjà les modérateurs à tout lire.
-- Aucune modification nécessaire : le frontend interroge status = 'handled'.
-- Ajout d'un index pour la file de modération.
create index if not exists reports_status_idx on public.reports (status, created_at);
create index if not exists notifications_user_idx on public.notifications (user_id, read_at);
create index if not exists replies_discussion_idx on public.replies (discussion_id, status);
create index if not exists discussions_created_idx on public.discussions (created_at desc);
create index if not exists discussions_category_idx on public.discussions (category, created_at desc);
create index if not exists notifications_kind_idx on public.notifications (kind);

-- 5. Tableau de bord modération : compteurs globaux via RPC --------------------
-- Réservé aux modérateurs (vérifié dans la fonction). Les compteurs ne sont
-- pas exposés dans une vue pour éviter toute lecture par un membre.
drop view if exists public.moderation_stats;
create or replace function public.moderation_dashboard()
returns table (
  reports_open bigint, reports_handled bigint,
  discussions_hidden bigint, replies_hidden bigint,
  members bigint, discussions_published bigint, replies_published bigint
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_moderator() then
    raise exception 'Réservé aux modérateurs.';
  end if;
  return query select
    (select count(*) from public.reports where status = 'open'),
    (select count(*) from public.reports where status = 'handled'),
    (select count(*) from public.discussions where status = 'hidden'),
    (select count(*) from public.replies where status = 'hidden'),
    (select count(*) from public.profiles),
    (select count(*) from public.discussions where status = 'published'),
    (select count(*) from public.replies where status = 'published');
end $$;
revoke all on function public.moderation_dashboard() from public, anon;
grant execute on function public.moderation_dashboard() to authenticated;

-- 6. Suppression de son propre compte (RGPD / droit à l'effacement) -------------
-- L'utilisateur peut supprimer son compte : cascade sur profils -> contenus.
-- On passe par une fonction car auth.users n'est pas accessible en REST.
create or replace function public.delete_own_account()
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- 7. Export de ses propres données (portabilité) --------------------------------
create or replace function public.export_my_data()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'profile', (select to_jsonb(p) - 'id' from public.profiles p where p.id = auth.uid()),
    'discussions', coalesce((select jsonb_agg(to_jsonb(d) - 'author_id') from public.discussions d where d.author_id = auth.uid()), '[]'::jsonb),
    'replies', coalesce((select jsonb_agg(to_jsonb(r) - 'author_id') from public.replies r where r.author_id = auth.uid()), '[]'::jsonb),
    'reports_made', coalesce((select jsonb_agg(to_jsonb(r) - 'reporter_id') from public.reports r where r.reporter_id = auth.uid()), '[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- 8. Notification par e-mail (optionnel, nécessite SMTP configuré) --------------
-- Pour l'instant les notifications sont in-app uniquement (cloche).
-- Une extension possible : trigger + Supabase Auth hook ou edge function.
-- Laissé en commentaire pour plus tard.
-- create trigger ... execute function public.notify_by_email() ...

-- 7. Vue admin : emails + pseudonymes (jamais exposée à l'API publique) ---------
create or replace view public.membres_admin as
select
  u.id,
  u.email,
  u.created_at as insrit_le,
  (u.email_confirmed_at is not null) as email_confirme,
  p.pseudonym,
  p.role
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;

revoke all on public.membres_admin from anon, authenticated;

-- Fin de l'étape 6.
select 'Étape 6 appliquée' as status;
