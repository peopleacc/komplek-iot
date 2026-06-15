'use client'
// components/reports/SireneBanner.tsx
// Banner sirine yang muncul di atas dashboard saat ada laporan kebakaran aktif
// Berkedip merah + animasi + tombol matikan sirine

import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Flame } from 'lucide-react'

interface SireneBannerProps {
    active: boolean
    onStop: () => void
    count: number   // jumlah laporan kebakaran aktif
}

export function SireneBanner({ active, onStop, count }: SireneBannerProps) {
    const [visible, setVisible] = useState(false)

    // Animasi fade-in saat sirine aktif
    useEffect(() => {
        if (active) {
            setVisible(true)
        } else {
            // Delay hide untuk animasi fade-out
            const t = setTimeout(() => setVisible(false), 300)
            return () => clearTimeout(t)
        }
    }, [active])

    if (!visible) return null

    return (
        <div
            className={[
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                active ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
            ].join(' ')}
        >
            {/* Banner utama berkedip */}
            <div className="bg-red-600 animate-pulse px-4 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    {/* Ikon api berkedip */}
                    <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-full">
                        <Flame size={20} className="text-white" />
                    </div>

                    <div>
                        <p className="text-white font-black text-sm tracking-wide">
                            🚨 SIRINE AKTIF — KEBAKARAN TERDETEKSI
                        </p>
                        <p className="text-red-100 text-xs">
                            {count} laporan kebakaran belum ditangani
                        </p>
                    </div>
                </div>

                {/* Tombol matikan sirine */}
                <button
                    onClick={onStop}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors shadow-sm"
                >
                    <VolumeX size={16} />
                    Matikan Sirine
                </button>
            </div>

            {/* Progress bar merah tipis di bawah banner */}
            <div className="h-1 bg-red-800">
                <div className="h-full bg-red-300 animate-[sirenProgress_2s_ease-in-out_infinite]" />
            </div>
        </div>
    )
}

// ── Banner notifikasi laporan baru ───────────────────────────

import type { ReportWithUser } from '@/hooks/useRealtimeReports'

interface NewReportAlertProps {
    report: ReportWithUser
    onDismiss: () => void
}

export function NewReportAlert({ report, onDismiss }: NewReportAlertProps) {
    const bgColor: Record<string, string> = {
        kebakaran: 'bg-orange-500',
        maling: 'bg-indigo-600',
        medis: 'bg-red-500',
        lainnya: 'bg-amber-500',
    }

    const emoji: Record<string, string> = {
        kebakaran: '🔥',
        maling: '🚨',
        medis: '🚑',
        lainnya: '⚠️',
    }

    return (
        <div
            className={[
                'fixed bottom-6 right-6 z-50 max-w-sm w-full',
                'rounded-xl shadow-2xl overflow-hidden',
                'animate-[slideInRight_0.3s_ease-out]',
                bgColor[report.kategori] ?? 'bg-gray-700',
            ].join(' ')}
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">{emoji[report.kategori]}</span>
                        <div>
                            <p className="text-white font-bold text-sm">
                                Laporan Baru Masuk!
                            </p>
                            <p className="text-white/90 text-xs mt-0.5">
                                {report.pelapor_nama} — {report.pelapor_blok}
                            </p>
                            <p className="text-white/80 text-xs capitalize mt-0.5">
                                Kategori: {report.kategori}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-white/70 hover:text-white text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            </div>
            {/* Timer bar — menyusut dalam 8 detik */}
            <div className="h-1 bg-black/20">
                <div className="h-full bg-white/40 animate-[shrinkWidth_8s_linear_forwards]" />
            </div>
        </div>
    )
}