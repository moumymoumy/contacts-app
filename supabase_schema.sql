-- =========================================================
-- Script SQL Supabase — Application Contacts
-- A exécuter dans l'éditeur SQL de Supabase (SQL Editor)
-- =========================================================

-- 1. Extension nécessaire pour la génération d'UUID
create extension if not exists "pgcrypto";

-- 2. Type ENUM pour le statut des contacts
do $$
begin
  if not exists (select 1 from pg_type where typname = 'contact_status') then
    create type contact_status as enum ('actif', 'a_verifier', 'ignore');
  end if;
end$$;

-- 3. Table principale des contacts
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text,
  email text,
  telephone text,
  societe text,
  source text default 'Manuel',
  status contact_status not null default 'actif',
  metadata jsonb default '{}'::jsonb,
  duplicate_of uuid references public.contacts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contacts is 'Table centrale des contacts, alimentée par import CSV/Excel ou saisie manuelle';
comment on column public.contacts.duplicate_of is 'Référence vers la fiche existante si ce contact est un doublon suspecté (statut a_verifier)';
comment on column public.contacts.metadata is 'Données brutes d''import ou historique (JSON libre)';

-- 4. Index pour la performance des recherches et filtres
create index if not exists idx_contacts_email on public.contacts (lower(email));
create index if not exists idx_contacts_nom on public.contacts (lower(nom));
create index if not exists idx_contacts_prenom on public.contacts (lower(prenom));
create index if not exists idx_contacts_status on public.contacts (status);
create index if not exists idx_contacts_source on public.contacts (source);
create index if not exists idx_contacts_duplicate_of on public.contacts (duplicate_of);

-- Index de recherche texte globale (nom, prénom, société, email, téléphone)
create index if not exists idx_contacts_search on public.contacts
  using gin (
    to_tsvector('french',
      coalesce(nom, '') || ' ' ||
      coalesce(prenom, '') || ' ' ||
      coalesce(societe, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(telephone, '')
    )
  );

-- 5. Trigger pour mettre à jour updated_at automatiquement
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row
  execute function public.set_updated_at();

-- 6. Row Level Security (RLS)
alter table public.contacts enable row level security;

-- Lecture : tout utilisateur authentifié peut lire tous les contacts
drop policy if exists "contacts_select_authenticated" on public.contacts;
create policy "contacts_select_authenticated"
  on public.contacts
  for select
  to authenticated
  using (true);

-- Insertion : tout utilisateur authentifié peut créer des contacts
drop policy if exists "contacts_insert_authenticated" on public.contacts;
create policy "contacts_insert_authenticated"
  on public.contacts
  for insert
  to authenticated
  with check (true);

-- Mise à jour : tout utilisateur authentifié peut modifier (résolution de doublons, etc.)
drop policy if exists "contacts_update_authenticated" on public.contacts;
create policy "contacts_update_authenticated"
  on public.contacts
  for update
  to authenticated
  using (true)
  with check (true);

-- Suppression : tout utilisateur authentifié peut supprimer (ex: suppression de doublon)
drop policy if exists "contacts_delete_authenticated" on public.contacts;
create policy "contacts_delete_authenticated"
  on public.contacts
  for delete
  to authenticated
  using (true);

-- =========================================================
-- Fin du script. La table est prête à l'emploi.
-- =========================================================
