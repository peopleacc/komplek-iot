// app/api/users/route.ts
// POST /api/users
// Membuat user baru — mendaftarkan ke Supabase Auth + insert ke public.users
// Hanya admin yang boleh mengakses endpoint ini

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSessionProfile } from '@/lib/supabase-server'

const CreateUserSchema = z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string()
        .min(8, 'Password minimal 8 karakter')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Harus ada huruf besar, kecil, dan angka'
        ),
    nama_lengkap: z.string().min(3, 'Nama minimal 3 karakter'),
    nomor_hp: z.string().min(10, 'Nomor HP minimal 10 digit'),
    alamat_blok: z.string().min(2, 'Alamat blok tidak boleh kosong'),
    role: z.enum(['warga', 'satpam', 'admin']),
})

export async function POST(request: NextRequest) {
    try {
        // Hanya admin yang boleh membuat user baru
        const profile = await getSessionProfile()
        if (!profile) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized. Silakan login terlebih dahulu.' },
                { status: 401 }
            )
        }
        if (profile.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Forbidden. Hanya admin yang bisa membuat user baru.' },
                { status: 403 }
            )
        }

        // Validasi body request
        const body = await request.json()
        const parsed = CreateUserSchema.safeParse(body)
        if (!parsed.success) {
            const errors = parsed.error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            }))
            return NextResponse.json(
                { success: false, message: 'Data tidak valid.', errors },
                { status: 422 }
            )
        }

        const { email, password, nama_lengkap, nomor_hp, alamat_blok, role } = parsed.data

        // 1. Buat akun di Supabase Auth menggunakan Admin API
        //    email_confirm: true → akun langsung aktif tanpa verifikasi email
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })

        if (authError) {
            // Tangani error email sudah terdaftar
            if (authError.message.includes('already registered')) {
                return NextResponse.json(
                    { success: false, message: 'Email ini sudah terdaftar.' },
                    { status: 409 }
                )
            }
            return NextResponse.json(
                { success: false, message: `Gagal membuat akun: ${authError.message}` },
                { status: 500 }
            )
        }

        const newUserId = authData.user.id

        // 2. Insert data profil ke tabel public.users
        const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
                id: newUserId,      // ID sama dengan auth.users
                email,
                nama_lengkap,
                nomor_hp,
                alamat_blok,
                role,
            })

        if (insertError) {
            // Rollback: hapus akun auth jika insert profil gagal
            await supabaseAdmin.auth.admin.deleteUser(newUserId)
            return NextResponse.json(
                { success: false, message: `Gagal menyimpan profil: ${insertError.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                message: `User ${nama_lengkap} berhasil didaftarkan.`,
                user_id: newUserId,
            },
            { status: 201 }
        )

    } catch (err) {
        console.error('[POST /api/users]', err)
        return NextResponse.json(
            { success: false, message: 'Kesalahan internal server.' },
            { status: 500 }
        )
    }
}

// GET /api/users — ambil semua user + email dari auth (khusus admin)
export async function GET() {
    try {
        const profile = await getSessionProfile()
        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
        }

        // Ambil profil dari public.users (tanpa kolom email)
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id, nama_lengkap, nomor_hp, alamat_blok, role, created_at')
            .order('created_at', { ascending: false })

        if (profileError) {
            return NextResponse.json(
                { success: false, message: profileError.message },
                { status: 500 }
            )
        }

        // Ambil email dari auth.users via Admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000,
        })

        if (authError) {
            // Jika gagal ambil email, tetap kembalikan data tanpa email
            return NextResponse.json({ success: true, data: profiles ?? [] })
        }

        // Merge: pasangkan email dari auth ke profil berdasarkan id
        const emailMap = new Map(authData.users.map(u => [u.id, u.email ?? '']))
        const merged = (profiles ?? []).map(p => ({
            ...p,
            email: emailMap.get(p.id) ?? '',
        }))

        return NextResponse.json({ success: true, data: merged })

    } catch (err) {
        console.error('[GET /api/users]', err)
        return NextResponse.json(
            { success: false, message: 'Kesalahan internal server.' },
            { status: 500 }
        )
    }
}
