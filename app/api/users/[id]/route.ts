// app/api/users/[id]/route.ts
// PATCH /api/users/:id  — update profil + opsional ganti password
// DELETE /api/users/:id — hapus user dari Auth + public.users
// Hanya admin yang boleh mengakses

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSessionProfile } from '@/lib/supabase-server'

const UpdateUserSchema = z.object({
    nama_lengkap: z.string().min(3, 'Nama minimal 3 karakter').optional(),
    nomor_hp: z.string().min(10, 'Nomor HP minimal 10 digit').optional(),
    alamat_blok: z.string().min(2, 'Alamat blok tidak boleh kosong').optional(),
    role: z.enum(['warga', 'satpam', 'admin']).optional(),
    password: z.string()
        .min(8, 'Password minimal 8 karakter')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Harus ada huruf besar, kecil, dan angka'
        )
        .optional()
        .or(z.literal('')),
})

// ── PATCH /api/users/:id ──────────────────────────────────────
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const profile = await getSessionProfile()
        if (!profile) {
            return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
        }
        if (profile.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
        }

        const body = await request.json()
        const parsed = UpdateUserSchema.safeParse(body)
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

        const { password, ...profileData } = parsed.data

        // Update password di Supabase Auth (jika diisi)
        if (password && password.length > 0) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                params.id,
                { password }
            )
            if (authError) {
                return NextResponse.json(
                    { success: false, message: `Gagal update password: ${authError.message}` },
                    { status: 500 }
                )
            }
        }

        // Update data profil di public.users (hanya field yang dikirim)
        const updatePayload = Object.fromEntries(
            Object.entries(profileData).filter(([, v]) => v !== undefined && v !== '')
        )

        if (Object.keys(updatePayload).length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update(updatePayload)
                .eq('id', params.id)

            if (updateError) {
                return NextResponse.json(
                    { success: false, message: `Gagal update profil: ${updateError.message}` },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({ success: true, message: 'Data user berhasil diperbarui.' })

    } catch (err) {
        console.error('[PATCH /api/users/:id]', err)
        return NextResponse.json({ success: false, message: 'Kesalahan internal server.' }, { status: 500 })
    }
}

// ── DELETE /api/users/:id ─────────────────────────────────────
export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const profile = await getSessionProfile()
        if (!profile) {
            return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
        }
        if (profile.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
        }

        // Cegah admin menghapus dirinya sendiri
        if (params.id === profile.id) {
            return NextResponse.json(
                { success: false, message: 'Tidak bisa menghapus akun sendiri.' },
                { status: 400 }
            )
        }

        // Hapus dari public.users terlebih dahulu (karena ada foreign key ke auth.users)
        const { error: deleteProfileError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', params.id)

        if (deleteProfileError) {
            return NextResponse.json(
                { success: false, message: `Gagal hapus profil: ${deleteProfileError.message}` },
                { status: 500 }
            )
        }

        // Hapus dari Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(params.id)
        if (authError) {
            return NextResponse.json(
                { success: false, message: `Gagal hapus akun auth: ${authError.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, message: 'User berhasil dihapus.' })

    } catch (err) {
        console.error('[DELETE /api/users/:id]', err)
        return NextResponse.json({ success: false, message: 'Kesalahan internal server.' }, { status: 500 })
    }
}
