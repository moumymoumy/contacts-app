# Application Contacts

Application web (Next.js 14 + Supabase) de centralisation et gestion de
contacts, avec import CSV/Excel, détection de doublons et résolution
manuelle côte à côte. PWA installable sur mobile, tablette et bureau.

## 1. Mise en place de Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Ouvrez l'éditeur SQL (`SQL Editor`) et exécutez le contenu du fichier
   `supabase_schema.sql` fourni à la racine du projet.
3. Dans **Project Settings > API**, récupérez :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Activez l'authentification par email (ou votre méthode préférée) dans
   **Authentication > Providers** : les politiques RLS du script exigent un
   utilisateur `authenticated` pour lire/écrire les contacts.

## 2. Installation locale

```bash
npm install
cp .env.example .env.local
# renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local
npm run dev
```

L'application est disponible sur http://localhost:3000.

## 3. Icônes PWA

Le `manifest.json` référence des icônes dans `public/icons/` :
- `icon-192.png`, `icon-512.png` (icônes standard)
- `icon-maskable-192.png`, `icon-maskable-512.png` (icônes adaptatives Android)

Générez-les à partir de votre logo (ex. via https://realfavicongenerator.net
ou https://maskable.app) et placez-les dans `public/icons/` avant le build.

## 4. Déploiement via GitHub + Coolify

1. Poussez ce projet sur un dépôt GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit — Application Contacts"
   git branch -M main
   git remote add origin https://github.com/votre-compte/application-contacts.git
   git push -u origin main
   ```
2. Dans Coolify, créez une nouvelle **Application** de type **Dockerfile**
   (ou "Git Repository" avec build pack Dockerfile) pointant vers votre dépôt.
3. Renseignez les variables d'environnement (Build & Runtime) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   > Ces variables doivent être disponibles **au moment du build** (elles sont
   > injectées comme Build Args dans le Dockerfile) car Next.js les intègre au
   > bundle client.
4. Port exposé : `3000` (déjà configuré dans le Dockerfile, `EXPOSE 3000`).
5. Coolify détecte le `HEALTHCHECK` du Dockerfile pour surveiller l'état du
   conteneur.
6. Configurez votre domaine et activez le HTTPS automatique (Let's Encrypt)
   depuis Coolify.

## 5. Fonctionnement de la détection de doublons

- **Importation** (`/import`) : chaque ligne importée est comparée par email
  (puis par nom + prénom) aux contacts déjà présents. En cas de
  correspondance, la fiche importée est enregistrée avec le statut
  `a_verifier` et référence la fiche existante via `duplicate_of`. Sinon, elle
  est enregistrée directement en `actif`.
- **Résolution** (`/doublons`) : affiche chaque paire (fiche existante / fiche
  importée) côte à côte (empilée sur mobile), met en évidence les champs
  différents, et propose :
  - **Garder les deux** : la fiche importée passe en `actif`, les deux fiches
    restent distinctes.
  - **Supprimer le nouveau** : supprime uniquement la fiche importée.
  - **Fusionner** : applique les valeurs sélectionnées champ par champ à la
    fiche existante, puis supprime la fiche importée.

Aucune fusion ou suppression n'est automatique : tout passe par une validation
humaine explicite, conformément à la règle d'or du cahier des charges.

## 6. Structure du projet

```
src/
  app/
    layout.tsx        Layout global + PWA
    page.tsx           Dashboard (liste, recherche, filtres, ajout manuel)
    import/page.tsx     Import CSV + mapping
    doublons/page.tsx    Résolution des doublons
  components/
    ui/                 Boutons, inputs, dialogs, badges, cards
    csv-mapper.tsx       Assistant de mapping des colonnes CSV
    duplicate-card.tsx   Carte de comparaison côte à côte
    pwa-installer.tsx    Bouton d'installation PWA
  lib/
    supabase.ts          Client Supabase + types
    csv.ts                Parseur CSV
    utils.ts              Utilitaire cn()
public/
  manifest.json           Manifest PWA
  sw.js                    Service worker (cache réseau-d'abord)
supabase_schema.sql         Script SQL à exécuter dans Supabase
Dockerfile                  Build multi-étapes pour Coolify
```
