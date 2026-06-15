// lib/supabase-admin.ts
// Supabase Admin Client — menggunakan SERVICE ROLE KEY
//
// ⚠️  PENTING — KEAMANAN:
// • File ini HANYA boleh diimport di server-side (API Routes / Server Actions)
// • JANGAN pernah import di Client Components atau expose ke browser
// • Service Role Key melewati semua RLS — gunakan dengan hati-hati
// • Pastikan SUPABASE_SERVICE_ROLE_KEY ada di .env.local (tanpa prefix NEXT_PUBLIC_)

import { createClient } from '@supabase/supabase-js'

/**
 * Admin client yang melewati RLS.
 * Dipakai untuk: supabase.auth.admin.createUser()
 * Hanya diinstansiasi sekali (singleton pattern).
 */
function createSupabaseAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !svcKey) {
        throw new Error(
            'Environment variable NEXT_PUBLIC_SUPABASE_URL atau ' +
            'SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. ' +
            'Periksa file .env.local Anda.'
        )
    }

    return createClient(url, svcKey, {
        auth: {
            // Nonaktifkan auto-refresh token — tidak dibutuhkan di server
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    })
}

// Singleton — dibuat sekali, dipakai berkali-kali
export const supabaseAdmin = createSupabaseAdminClient()