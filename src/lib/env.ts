export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined

export const hasSupabaseConfig =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl?.includes('your-project') &&
  supabaseAnonKey !== 'your-anon-key'
