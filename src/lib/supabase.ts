import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies (fichier .env.local ou variables Coolify)."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ---- Types partagés pour la table contacts ----

export type ContactStatus = "actif" | "a_verifier" | "ignore";

export interface Contact {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  societe: string | null;
  source: string;
  status: ContactStatus;
  metadata: Record<string, unknown>;
  duplicate_of: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactInsert = Omit<Contact, "id" | "created_at" | "updated_at">;
export type ContactUpdate = Partial<ContactInsert>;
