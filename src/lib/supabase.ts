import { createClient } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from './env'

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
