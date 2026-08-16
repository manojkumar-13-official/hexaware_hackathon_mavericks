import { createClient } from '@supabase/supabase-js'

// ──────────────────────────────────────────────────────────────
// Supabase client
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
// ──────────────────────────────────────────────────────────────

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. ' +
    'Supabase queries will fail. Add them to .env.local'
  )
}

export const supabase = createClient(
  SUPABASE_URL  ?? 'https://placeholder.supabase.co',
  SUPABASE_ANON ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession:    true,
      storageKey:        'govconnect_sb_session',
      autoRefreshToken:  true,
      detectSessionInUrl: false,
    },
  }
)

// ──────────────────────────────────────────────────────────────
// Complaint Agent base URL (Python FastAPI on port 5003)
// ──────────────────────────────────────────────────────────────
export const AGENT_BASE =
  (import.meta.env.VITE_AGENT_URL as string | undefined) ?? 'http://localhost:5003'
