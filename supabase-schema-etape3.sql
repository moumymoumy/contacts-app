-- ============================================================
-- CONCERT MANAGER PRO — Étape 3 : tables du noyau (V1 Core)
-- À copier-coller intégralement dans Supabase → SQL Editor → New query
-- Projet concerné : contacts-app (les tables sont préfixées "cmp_"
-- pour ne jamais entrer en conflit avec vos tables existantes)
-- ============================================================

-- Table des salles
create table if not exists cmp_salles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse text,
  capacite integer not null default 0,
  created_at timestamptz default now()
);

-- Table des artistes
create table if not exists cmp_artistes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  genre_musical text,
  contact text,
  created_at timestamptz default now()
);

-- Table des saisons
create table if not exists cmp_saisons (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  date_debut date,
  date_fin date,
  created_at timestamptz default now()
);

-- Table centrale des concerts
create table if not exists cmp_concerts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  salle_id uuid references cmp_salles(id) on delete set null,
  artiste_id uuid references cmp_artistes(id) on delete set null,
  saison_id uuid references cmp_saisons(id) on delete set null,
  genre_musical text,
  prix_billet numeric(10,2) not null default 0,
  billets_vendus integer not null default 0,
  invitations integer not null default 0,
  places_vip integer not null default 0,
  commission_billetterie_pct numeric(5,2) not null default 0,
  statut text not null default 'planifie', -- planifie | realise | annule
  created_at timestamptz default now()
);

-- Recettes liées à un concert (Billetterie gérée séparément via prix_billet x billets_vendus,
-- ici on stocke les AUTRES recettes : Bar, Sponsors, Subventions, Merchandising, Autres)
create table if not exists cmp_revenus (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid references cmp_concerts(id) on delete cascade,
  type text not null, -- Bar | Sponsor | Subvention | Merchandising | Autre
  montant numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- Dépenses opérationnelles liées à un concert
create table if not exists cmp_depenses_operationnelles (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid references cmp_concerts(id) on delete cascade,
  categorie text not null, -- Cachet artiste | Assurance | Techniciens | Sécurité | ...
  montant numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- Sécurité (RLS) : accès ouvert pour l'instant (pas encore de login).
-- On resserrera ça quand on ajoutera l'authentification.
-- ============================================================
alter table cmp_salles enable row level security;
alter table cmp_artistes enable row level security;
alter table cmp_saisons enable row level security;
alter table cmp_concerts enable row level security;
alter table cmp_revenus enable row level security;
alter table cmp_depenses_operationnelles enable row level security;

create policy "Accès ouvert temporaire - salles" on cmp_salles for all using (true) with check (true);
create policy "Accès ouvert temporaire - artistes" on cmp_artistes for all using (true) with check (true);
create policy "Accès ouvert temporaire - saisons" on cmp_saisons for all using (true) with check (true);
create policy "Accès ouvert temporaire - concerts" on cmp_concerts for all using (true) with check (true);
create policy "Accès ouvert temporaire - revenus" on cmp_revenus for all using (true) with check (true);
create policy "Accès ouvert temporaire - depenses" on cmp_depenses_operationnelles for all using (true) with check (true);
