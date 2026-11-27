import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://mpxxwpdiondjtsjbfwxc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_em43XaSemG9NYj2e6ZxYLw_HuXxQNcI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export function appUrl(file) {
  return new URL(file, window.location.href).href;
}
