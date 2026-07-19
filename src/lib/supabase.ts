import { createClient } from '@supabase/supabase-js';

// Ces deux valeurs viennent de votre projet Supabase "contacts-app"
// (Dashboard Supabase → Project Settings → API)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
