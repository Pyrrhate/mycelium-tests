/**
 * Client Supabase pour Mycélium
 * 1. Variables d'environnement au build : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * 2. Ou au chargement : window.__MYCELIUM_SUPABASE__ = { url, anonKey } (script avant l'app)
 */
import { createClient } from '@supabase/supabase-js';

const fromEnv = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};
const fromWindow = typeof window !== 'undefined' && window.__MYCELIUM_SUPABASE__;
const url = fromWindow?.url || fromEnv.url;
const anonKey = fromWindow?.anonKey || fromEnv.anonKey;

export const supabase = url && anonKey
  ? createClient(url, anonKey)
  : null;

export default supabase;
