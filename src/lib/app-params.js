// App params - Supabase edition
// Semua konfigurasi diambil dari environment variables
export const appParams = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};