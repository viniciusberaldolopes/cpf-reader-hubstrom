import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Permite que a tela carregue mesmo antes de o ambiente estar configurado.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// A chave utilizada aqui é a chave pública; service_role nunca deve ir para o frontend.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
