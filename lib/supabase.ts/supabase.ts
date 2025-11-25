// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// NextAuth API rotası (sunucu tarafı) için Service Role Key kullanılır.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // GİZLİ ANAHTAR

if (!supabaseUrl || !serviceRoleKey) {
  // Service Role Key ve URL'i bulamazsa hata fırlat.
  // Not: NEXT_PUBLIC_SUPABASE_ANON_KEY artık bu dosyada kullanılmıyor.
  throw new Error('Supabase URL ve Service Role Key çevre değişkenleri tanımlanmalıdır!')
}

// Service Role Key ile yetkili, sunucu tarafı bir istemci oluşturur
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

import { createClient } from '@supabase/supabase-js'

// Next.js/StackBlitz ortam sorununu atlamak için (!) zorunlu tip belirteci kullanılmıştır.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

