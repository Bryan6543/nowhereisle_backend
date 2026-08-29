import { createClient } from '@supabase/supabase-js'

// Uses the public "anon" key – safe to expose
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)