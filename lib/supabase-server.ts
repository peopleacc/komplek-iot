// lib/supabase-server.ts
// Supabase client untuk Server Components & Route Handlers
// Menggunakan @supabase/ssr agar cookie session bisa dibaca di server

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Buat Supabase client yang membaca cookie session dari request.
 * Dipakai di:
 * - Server Components (app/dashboard/...)
 * - Route Handlers yang perlu tahu siapa user yang sedang login
 *
 * Menggunakan ANON KEY — RLS tetap berlaku.
 */
export function createSupabaseServerClient() {
    const cookieStore = cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: any[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch {
                        // setAll dipanggil dari Server Component — cookie update
                        // hanya bisa dilakukan dari middleware atau Route Handler
                    }
                },
            },
        }
    )
}

/**
 * Helper: ambil data user yang sedang login dari session cookie.
 * Return null jika tidak ada session.
 */
export async function getSessionUser() {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

/**
 * Helper: ambil profil + role dari tabel public.users.
 * Return null jika tidak ada session atau profil tidak ditemukan.
 */
export async function getSessionProfile() {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('users')
        .select('id, nama_lengkap, alamat_blok, nomor_hp, role')
        .eq('id', user.id)
        .single()

    return profile
}