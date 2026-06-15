// hooks/useRealtimeReports.ts
// Hook utama yang menangani:
// 1. Fetch awal semua laporan aktif (JOIN dengan data user)
// 2. Subscribe Supabase Realtime untuk laporan baru / update status
// 3. Logika sirine otomatis berulang jika ada kebakaran aktif

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Tipe data laporan lengkap (sudah di-JOIN dengan users) ───

export interface ReportWithUser {
    id: string
    kategori: 'kebakaran' | 'maling' | 'medis' | 'lainnya'
    deskripsi: string | null
    latitude: number | null
    longitude: number | null
    foto_url: string | null
    status: 'menunggu' | 'diproses' | 'selesai'
    catatan_responden: string | null
    created_at: string
    updated_at: string
    user_id: string
    pelapor_nama: string
    pelapor_blok: string
    pelapor_hp: string
}

// ── Hook ─────────────────────────────────────────────────────

export function useRealtimeReports() {
    const supabase = getSupabaseBrowserClient()

    const [reports, setReports] = useState<ReportWithUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sirenActive, setSirenActive] = useState(false)
    const [newReportAlert, setNewReportAlert] = useState<ReportWithUser | null>(null)

    // Refs untuk audio sirine (agar tidak re-create saat re-render)
    const sirenIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const channelRef = useRef<RealtimeChannel | null>(null)

    // ── Fetch laporan dari VIEW reports_with_user_info ──────────

    const fetchReports = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
            .from('reports_with_user_info')   // VIEW dari Modul 1
            .select('*')
            .in('status', ['menunggu', 'diproses'])  // hanya laporan aktif
            .order('created_at', { ascending: false })

        if (fetchError) {
            setError(`Gagal memuat laporan: ${fetchError.message}`)
        } else {
            setReports((data as ReportWithUser[]) ?? [])
        }

        setIsLoading(false)
    }, [supabase])

    // ── Sirine: Web Audio API ────────────────────────────────────
    // Buat suara sirine dari scratch menggunakan OscillatorNode
    // Tidak butuh file audio eksternal

    const playSirenSound = useCallback(() => {
        try {
            // Buat AudioContext baru setiap kali (browser policy)
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioContextRef.current = ctx

            const oscillator = ctx.createOscillator()
            const gainNode = ctx.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(ctx.destination)

            // Bentuk gelombang sirine: frekuensi naik turun
            oscillator.type = 'sawtooth'
            oscillator.frequency.setValueAtTime(440, ctx.currentTime)
            oscillator.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5)
            oscillator.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.0)

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
            gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0)

            oscillator.start(ctx.currentTime)
            oscillator.stop(ctx.currentTime + 1.0)

            // Bersihkan context setelah selesai
            oscillator.onended = () => ctx.close()
        } catch {
            // Beberapa browser block AudioContext tanpa interaksi user
            // Tidak perlu crash — sirine visual (banner merah) tetap muncul
        }
    }, [])

    const startSiren = useCallback(() => {
        if (sirenIntervalRef.current) return // Sudah aktif

        setSirenActive(true)
        playSirenSound()

        // Ulangi setiap 2 detik
        sirenIntervalRef.current = setInterval(() => {
            playSirenSound()
        }, 2000)
    }, [playSirenSound])

    const stopSiren = useCallback(() => {
        if (sirenIntervalRef.current) {
            clearInterval(sirenIntervalRef.current)
            sirenIntervalRef.current = null
        }
        audioContextRef.current?.close()
        setSirenActive(false)
    }, [])

    // ── Cek apakah perlu sirine aktif ───────────────────────────

    const checkAndUpdateSiren = useCallback(
        (currentReports: ReportWithUser[]) => {
            const hasActiveKebakaran = currentReports.some(
                r => r.kategori === 'kebakaran' && r.status !== 'selesai'
            )

            if (hasActiveKebakaran) {
                startSiren()
            } else {
                stopSiren()
            }
        },
        [startSiren, stopSiren]
    )

    // ── Supabase Realtime Subscription ──────────────────────────

    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    useEffect(() => {
        // Subscribe ke tabel reports untuk event INSERT dan UPDATE
        const channel = supabase
            .channel('reports-dashboard-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',        // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'reports',
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Laporan baru masuk — fetch ulang untuk dapat data JOIN (nama, blok)
                        // Tidak bisa pakai payload.new langsung karena VIEW tidak di-stream
                        const { data } = await supabase
                            .from('reports_with_user_info')
                            .select('*')
                            .eq('id', payload.new.id)
                            .single()

                        if (data) {
                            const newReport = data as ReportWithUser

                            setReports(prev => {
                                const updated = [newReport, ...prev]
                                checkAndUpdateSiren(updated)
                                return updated
                            })

                            // Tampilkan alert laporan baru (untuk notifikasi visual)
                            setNewReportAlert(newReport)
                            // Auto-hide setelah 8 detik
                            setTimeout(() => setNewReportAlert(null), 8000)
                        }
                    }

                    if (payload.eventType === 'UPDATE') {
                        // Status laporan diupdate — update state lokal
                        setReports(prev => {
                            const updated = prev.map(r =>
                                r.id === payload.new.id
                                    ? { ...r, ...payload.new } as ReportWithUser
                                    : r
                            )
                            // Filter keluar laporan yang sudah 'selesai'
                            const active = updated.filter(r => r.status !== 'selesai')
                            checkAndUpdateSiren(active)
                            return active
                        })
                    }
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            // Cleanup saat komponen unmount
            supabase.removeChannel(channel)
            stopSiren()
        }
    }, [supabase, checkAndUpdateSiren, stopSiren])

    // Cek sirine saat reports pertama kali di-load
    useEffect(() => {
        if (!isLoading) {
            checkAndUpdateSiren(reports)
        }
    }, [isLoading, reports, checkAndUpdateSiren])

    // ── Update status laporan (dipanggil dari UI) ────────────────

    const updateStatus = useCallback(
        async (
            reportId: string,
            status: 'diproses' | 'selesai',
            catatan?: string
        ) => {
            const res = await fetch(`/api/reports/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, catatan_responden: catatan }),
            })
            return res.ok
        },
        []
    )

    return {
        reports,
        isLoading,
        error,
        sirenActive,
        newReportAlert,
        stopSiren,
        updateStatus,
        refetch: fetchReports,
        dismissAlert: () => setNewReportAlert(null),
    }
}