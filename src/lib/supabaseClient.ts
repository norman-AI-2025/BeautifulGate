/**
 * Supabase Client Configuration & Hybrid Local Mock Store
 * Automatically adapts between real Supabase Backend and reactive Local Storage.
 */

export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isConfigured = Boolean(url && anonKey);

  return {
    url,
    anonKey,
    isConfigured,
  };
};

export const hasLiveSupabase = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

