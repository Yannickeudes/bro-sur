# Bro sûr

Plateforme communautaire d’écoute et d’entraide pour les jeunes. React, Vite, React Router, Tailwind (backend Supabase à l’étape 2).

## Lancer en local
```bash
npm install
npm run dev
```

## Déployer
- **GitHub Pages** : pousser sur la branche `main`, puis Settings > Pages > Source : « GitHub Actions ».
- **Vercel** : importer le dépôt GitHub, sans réglage particulier.

## Avancement
Étape 1 : socle, design, accueil, règles. Les autres pages affichent « à venir » jusqu’à leur construction.

## Étape 2 : Supabase et comptes
1. Dans Supabase, ouvrir SQL Editor, coller le contenu de `supabase/schema.sql`, puis Run.
2. Copier `.env.example` en `.env` et renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé publique uniquement).
3. `npm install` puis `npm run dev`.
