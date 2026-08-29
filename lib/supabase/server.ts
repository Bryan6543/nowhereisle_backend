import { createClient } from '@supabase/supabase-js'

// Uses the secret service role key – never send this to the browser
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}