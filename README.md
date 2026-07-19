# Concert Manager Pro — Étape 2 : squelette de l'interface

Ce paquet contient uniquement la structure de l'application : le menu latéral (sidebar)
et les 8 pages du cahier des charges, sans contenu ni calcul pour l'instant.
L'objectif de cette étape est juste de vérifier que la navigation fonctionne.

## Déploiement (GitHub → Coolify), comme vos autres applications

### 1. Créer le dépôt GitHub
1. Allez sur github.com → bouton **"+"** → **"New repository"**
2. Nom du dépôt : `concert-manager-pro`
3. Visibilité : **Public** (comme vos autres apps)
4. **Create repository**

### 2. Envoyer les fichiers sur GitHub
Ce projet contient plusieurs dossiers et fichiers (pas un seul fichier comme vos apps
statiques), donc utilisez **GitHub Desktop** :
1. Ouvrez GitHub Desktop → **File → Clone repository** → sélectionnez `concert-manager-pro`
2. Décompressez le zip que je vous ai fourni, et copiez tout son contenu dans le dossier
   du dépôt cloné sur votre ordinateur
3. Dans GitHub Desktop, vous verrez tous les fichiers apparaître → écrivez un message
   (ex. "Étape 2 : squelette de l'interface") → **Commit to main** → **Push origin**

### 3. Créer le sous-domaine (DNS chez OVH)
1. Manager OVH → votre domaine → **Zone DNS** → **Ajouter une entrée**
2. Type **A**, sous-domaine proposé : `concerts-pro` (donnera `concerts-pro.mundoartpourtous.com`
   — dites-moi si vous préférez un autre nom)
3. Valeur : l'adresse IPv4 de votre VPS
4. Valider

### 4. Déployer dans Coolify
1. **+ Add Resource → Applications → Public Repository**
2. Collez l'adresse de votre dépôt : `moumymoumy/concert-manager-pro`
3. **Build Pack : Dockerfile** (important — pas "Static", car cette app a besoin de calculs
   côté serveur, contrairement à vos apps HTML simples)
4. Onglet **Domains** → collez `https://concerts-pro.mundoartpourtous.com` → **Save**
5. Cliquez sur **Deploy**

### 5. Comment tester que ça fonctionne
Une fois le déploiement terminé (quelques minutes), ouvrez votre sous-domaine dans le
navigateur. Vous devriez voir :
- Un menu bleu foncé à gauche avec 8 liens (Tableau de bord, Concerts, Simulateur...)
- En cliquant sur chaque lien, une page s'affiche avec un message
  **"🚧 Ce module sera construit à l'étape suivante"**

Si tout ça s'affiche correctement, la structure de l'application est validée et on peut
passer à l'étape 3 (construction du noyau : gestion des concerts et calculs réels).

## Pas encore utilisé à cette étape
Le fichier `.env.example` et `src/lib/supabase.ts` sont déjà en place pour préparer la
connexion à votre projet Supabase `contacts-app`, mais rien n'est branché pour l'instant
— ça viendra à l'étape 3.
