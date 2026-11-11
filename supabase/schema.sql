-- Bro sûr : schéma Supabase. À coller dans Supabase > SQL Editor, puis « Run ».

-- 1. Tables ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudonym text not null check (pseudonym ~ '^[A-Za-z0-9_-]{3,20}$'),
  role text not null default 'member' check (role in ('member', 'moderator')),
  created_at timestamptz not null default now()
);
create unique index profiles_pseudonym_key on public.profiles (lower(pseudonym));

create table public.categories (
  slug text primary key,
  name text not null,
  description text not null,
  position int not null
);

create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null references public.categories(slug),
  title text not null check (char_length(title) between 5 and 120),
  body text not null check (char_length(body) between 10 and 5000),
  is_anonymous boolean not null default false,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  is_anonymous boolean not null default false,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);

create table public.supports (
  user_id uuid not null references public.profiles(id) on delete cascade,
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, discussion_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  discussion_id uuid references public.discussions(id) on delete cascade,
  reply_id uuid references public.replies(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'handled')),
  created_at timestamptz not null default now(),
  check (num_nonnulls(discussion_id, reply_id) = 1)
);

-- 2. Fonctions et création automatique du profil ------------------------------
create function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'moderator')
$$;

create function public.pseudonym_available(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(pseudonym) = lower(p))
$$;
grant execute on function public.pseudonym_available(text) to anon, authenticated;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, pseudonym) values (new.id, new.raw_user_meta_data->>'pseudonym');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Sécurité par ligne (RLS) ---------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.discussions enable row level security;
alter table public.replies enable row level security;
alter table public.supports enable row level security;
alter table public.reports enable row level security;

create policy "profil : le sien ou modérateur" on public.profiles for select using (id = auth.uid() or public.is_moderator());
create policy "profil : modifier le sien" on public.profiles for update using (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (pseudonym) on public.profiles to authenticated; -- le rôle ne peut pas être modifié par un membre

create policy "catégories : lecture publique" on public.categories for select using (true);

-- Les tables brutes révèlent l'auteur : seuls l'auteur et les modérateurs les lisent.
-- Tout le monde lit les discussions via les vues publiques plus bas (auteur masqué si anonyme).
create policy "discussions : lecture auteur ou modérateur" on public.discussions for select using (author_id = auth.uid() or public.is_moderator());
create policy "discussions : publier en son nom" on public.discussions for insert with check (author_id = auth.uid());
create policy "discussions : supprimer la sienne ou modérer" on public.discussions for delete using (author_id = auth.uid() or public.is_moderator());
create policy "discussions : modérer" on public.discussions for update using (public.is_moderator()) with check (public.is_moderator());

create policy "réponses : lecture auteur ou modérateur" on public.replies for select using (author_id = auth.uid() or public.is_moderator());
create policy "réponses : publier en son nom" on public.replies for insert with check (author_id = auth.uid());
create policy "réponses : supprimer la sienne ou modérer" on public.replies for delete using (author_id = auth.uid() or public.is_moderator());
create policy "réponses : modérer" on public.replies for update using (public.is_moderator()) with check (public.is_moderator());

create policy "soutiens : les siens" on public.supports for select using (user_id = auth.uid());
create policy "soutiens : ajouter" on public.supports for insert with check (user_id = auth.uid());
create policy "soutiens : retirer" on public.supports for delete using (user_id = auth.uid());

create policy "signalements : créer" on public.reports for insert with check (reporter_id = auth.uid());
create policy "signalements : lire" on public.reports for select using (reporter_id = auth.uid() or public.is_moderator());
create policy "signalements : traiter" on public.reports for update using (public.is_moderator()) with check (public.is_moderator());

-- 4. Vues publiques (l'identité des auteurs anonymes n'en sort jamais) -------------
create view public.discussions_public as
select d.id, d.category, d.title, d.body, d.created_at, d.is_anonymous,
       case when d.is_anonymous then null else p.pseudonym end as author_pseudonym,
       (select count(*) from public.replies r where r.discussion_id = d.id and r.status = 'published') as reply_count,
       (select count(*) from public.supports s where s.discussion_id = d.id) as support_count
from public.discussions d
join public.profiles p on p.id = d.author_id
where d.status = 'published';

create view public.replies_public as
select r.id, r.discussion_id, r.body, r.created_at, r.is_anonymous,
       case when r.is_anonymous then null else p.pseudonym end as author_pseudonym
from public.replies r
join public.profiles p on p.id = r.author_id
join public.discussions d on d.id = r.discussion_id and d.status = 'published'
where r.status = 'published';

grant select on public.categories, public.discussions_public, public.replies_public to anon, authenticated;

-- 5. Les sept catégories ------------------------------------------------------
insert into public.categories (slug, name, description, position) values
 ('relations', 'Relations et amour', 'Couple, amitié naissante, ruptures, premiers sentiments.', 1),
 ('famille', 'Famille et amitié', 'Disputes à la maison, incompréhensions, liens qui comptent.', 2),
 ('etudes', 'Études et orientation', 'Choix de filière, examens, pression scolaire, avenir proche.', 3),
 ('travail', 'Vie professionnelle', 'Premier emploi, stages, relations avec les collègues.', 4),
 ('confiance', 'Confiance en soi', 'Se sentir légitime, oser parler, s’accepter comme on est.', 5),
 ('bien-etre', 'Bien-être et développement personnel', 'Rythme, habitudes, gestion des émotions, petits progrès.', 6),
 ('quotidien', 'Difficultés du quotidien', 'Argent, logement, solitude, tout ce qui pèse au jour le jour.', 7);

-- Pour vous nommer modérateur, après avoir créé votre compte (remplacez le pseudonyme) :
-- update public.profiles set role = 'moderator' where lower(pseudonym) = lower('VotrePseudo');
