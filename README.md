# Bro sûr

Un espace pour parler, écouter et avancer ensemble.

Bro sûr est une plateforme communautaire d’écoute et d’entraide pour les jeunes. Chacun peut y partager une préoccupation, demander un conseil et répondre aux autres, sous pseudonyme ou de façon anonyme. Trois valeurs : l’écoute, l’entraide et la bienveillance.

Site en ligne : https://yannickeudes.github.io/bro-sur/

## Fonctionnalités

- Discussions réparties en sept catégories, avec filtre et recherche
- Réponses, fils de réponses sous un conseil et soutiens
- Pseudonyme unique, ou publication anonyme au choix
- Notifications lorsque quelqu’un répond
- Signalement des contenus et page de modération réservée aux modérateurs
- Limites anti-abus : 5 discussions et 30 réponses par heure et par membre
- Règles de la communauté et page « Besoin d’aide ? »

## Technologies

| Couche | Technologie |
|---|---|
| Interface | React 18, Vite, React Router, Tailwind CSS |
| Backend | Supabase : PostgreSQL, authentification, règles d’accès par ligne (RLS) |
| Hébergement | GitHub Pages, publié par GitHub Actions (compatible Vercel) |

Le site est statique : le navigateur parle directement à Supabase avec la clé publique. La sécurité repose sur les règles d’accès de la base de données.

## Anonymat et sécurité

- Le public lit les discussions à travers des vues qui masquent l’auteur d’une publication anonyme.
- L’adresse e-mail n’est jamais exposée : seul le pseudonyme est public.
- Un membre ne peut modifier que son pseudonyme, jamais son rôle.
- Les modérateurs peuvent retrouver l’auteur d’un contenu signalé en cas d’abus.
- La clé publique (anon ou publishable) peut figurer dans le navigateur. La clé `service_role` ne doit jamais apparaître dans le code ni dans le dépôt. Le fichier `.env` est exclu par `.gitignore`.

## Installation en local

Prérequis : Node.js 20 ou plus récent, Git et un projet Supabase.

```bash
git clone https://github.com/Yannickeudes/bro-sur.git
cd bro-sur
npm install
cp .env.example .env
```

Renseigner dans `.env` :

```
VITE_SUPABASE_URL=adresse-du-projet
VITE_SUPABASE_ANON_KEY=cle-publique
```

Puis lancer `npm run dev` et ouvrir http://localhost:5173. Le fichier `.env` n’est lu qu’au démarrage : relancer la commande après toute modification.

## Base de données

Dans Supabase, ouvrir SQL Editor et exécuter les scripts du dossier `supabase/` dans cet ordre : `schema.sql`, `etape-4.sql`, puis les migrations numérotées.

Pour nommer un modérateur, après avoir créé le compte (remplacer `VotrePseudo`) :

```sql
update public.profiles set role = 'moderator' where lower(pseudonym) = lower('VotrePseudo');
```

## Déploiement

**GitHub Pages**

1. Dans le dépôt, Settings, Secrets and variables, Actions : créer `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
2. Dans Settings, Pages : choisir « GitHub Actions » comme source.
3. Pousser sur la branche `main` : le workflow construit et publie le site.
4. Dans Supabase, Authentication, URL Configuration : renseigner l’adresse publiée.

**Vercel** : importer le dépôt, ajouter les deux variables d’environnement et déployer. Aucun autre réglage n’est nécessaire.

## Structure

```
.github/workflows/   Déploiement GitHub Pages
supabase/            Scripts SQL (schéma et migrations)
src/components/      Composants partagés
src/pages/           Pages du site
src/lib/             Client Supabase, authentification, données
```

## Auteur

Yannick-Eudes Cédric Koffi APETOH
