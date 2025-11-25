// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Next.js'te PUBLIC değişkenler her zaman NEXT_PUBLIC_ ile başlar.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY çevre değişkenleri tanımlanmalıdır!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

