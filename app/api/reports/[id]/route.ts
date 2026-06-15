// app/api/reports/[id]/route.ts
// PATCH /api/reports/:id
// Satpam/admin update status laporan dan tambah catatan penanganan

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSessionProfile } from '@/lib/supabase-server'

const UpdateStatusSchema = z.object({
    status: z.enum(['diproses', 'selesai']),
    catatan_responden: z.string().max(500).optional(),
})

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verifikasi session
        const profile = await getSessionProfile()
        if (!profile) {
            return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
        }
        if (!['satpam', 'admin'].includes(profile.role)) {
            return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 })
        }

        // Validasi body
        const body = await request.json()
        const parsed = UpdateStatusSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, message: 'Data tidak valid.', errors: parsed.error.errors },
                { status: 422 }
            )
        }

        const { status, catatan_responden } = parsed.data

        // Update di Supabase
        // Menggunakan supabaseAdmin agar bisa update tanpa konflik RLS
        const { error } = await supabaseAdmin
            .from('reports')
            .update({
                status,
                catatan_responden: catatan_responden ?? null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', params.id)

        if (error) {
            return NextResponse.json(
                { success: false, message: `Gagal update: ${error.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `Status laporan diubah ke '${status}'.`,
        })

    } catch (err) {
        console.error('[PATCH /api/reports/:id]', err)
        return NextResponse.json(
            { success: false, message: 'Kesalahan internal server.' },
            { status: 500 }
        )
    }
}