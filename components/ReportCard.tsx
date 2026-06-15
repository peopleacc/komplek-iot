'use client'
// components/reports/ReportCard.tsx
// Kartu satu laporan — menampilkan:
// - Data pelapor (nama + blok) hasil JOIN dari VIEW
// - Kategori + badge status
// - Koordinat GPS + link Google Maps
// - Foto bukti (jika ada)
// - Tombol "Tangani" / "Selesai"

import { useState } from 'react'
import Image from 'next/image'
import {
    MapPin, Phone, Clock, CheckCircle2,
    PlayCircle, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'
import type { ReportWithUser } from '@/hooks/useRealtimeReports'

interface ReportCardProps {
    report: ReportWithUser
    onUpdateStatus: (
        id: string,
        status: 'diproses' | 'selesai',
        catatan?: string
    ) => Promise<boolean>
}

export function ReportCard({ report, onUpdateStatus }: ReportCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [catatan, setCatatan] = useState(report.catatan_responden ?? '')
    const [isUpdating, setIsUpdating] = useState(false)
    const [fotoError, setFotoError] = useState(false)

    // ── Update status ────────────────────────────────────────

    const handleUpdate = async (newStatus: 'diproses' | 'selesai') => {
        setIsUpdating(true)
        await onUpdateStatus(report.id, newStatus, catatan || undefined)
        setIsUpdating(false)
    }

    // ── Waktu relatif ─────────────────────────────────────────

    const timeAgo = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
        if (diff < 60) return `${diff} detik lalu`
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
        return `${Math.floor(diff / 3600)} jam lalu`
    }

    // ── Warna & label ─────────────────────────────────────────

    const kategoriStyle: Record<string, { bg: string; text: string; emoji: string }> = {
        kebakaran: { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '🔥' },
        maling: { bg: 'bg-indigo-100', text: 'text-indigo-700', emoji: '🚨' },
        medis: { bg: 'bg-red-100', text: 'text-red-700', emoji: '🚑' },
        lainnya: { bg: 'bg-amber-100', text: 'text-amber-700', emoji: '⚠️' },
    }

    const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
        menunggu: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Menunggu' },
        diproses: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Diproses' },
        selesai: { bg: 'bg-green-100', text: 'text-green-700', label: 'Selesai' },
    }

    const ks = kategoriStyle[report.kategori] ?? kategoriStyle.lainnya
    const ss = statusStyle[report.status] ?? statusStyle.menunggu

    const mapsUrl = report.latitude && report.longitude
        ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
        : null

    return (
        <div
            className={[
                'bg-white rounded-xl border shadow-sm overflow-hidden transition-all',
                report.kategori === 'kebakaran' && report.status !== 'selesai'
                    ? 'border-orange-300 shadow-orange-100'
                    : 'border-gray-200',
            ].join(' ')}
        >
            {/* ── Header kartu ───────────────────────────────────── */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">

                    {/* Kategori + info pelapor */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Badge kategori */}
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${ks.bg}`}>
                            {ks.emoji}
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Nama & blok pelapor — data dari JOIN public.users */}
                            <p className="font-bold text-gray-900 text-sm">
                                {report.pelapor_nama}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={11} />
                                {report.pelapor_blok}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Phone size={11} />
                                {report.pelapor_hp}
                            </p>
                        </div>
                    </div>

                    {/* Badge status + waktu */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ss.bg} ${ss.text}`}>
                            {ss.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            {timeAgo(report.created_at)}
                        </span>
                    </div>
                </div>

                {/* Deskripsi singkat */}
                {report.deskripsi && (
                    <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
                        "{report.deskripsi}"
                    </p>
                )}

                {/* GPS + foto preview mini */}
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                    {/* Link koordinat GPS */}
                    {mapsUrl && (
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-blue-50 px-2.5 py-1.5 rounded-lg"
                        >
                            <MapPin size={12} />
                            {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                            <ExternalLink size={10} />
                        </a>
                    )}

                    {/* Indikator ada foto */}
                    {report.foto_url && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                            📷 Ada foto bukti
                        </span>
                    )}
                </div>

                {/* Tombol expand detail */}
                <button
                    onClick={() => setExpanded(p => !p)}
                    className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 py-1"
                >
                    {expanded ? (
                        <><ChevronUp size={14} /> Sembunyikan detail</>
                    ) : (
                        <><ChevronDown size={14} /> Lihat detail & tangani</>
                    )}
                </button>
            </div>

            {/* ── Panel detail (expand) ───────────────────────────── */}
            {expanded && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">

                    {/* Foto bukti */}
                    {report.foto_url && !fotoError && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Foto Bukti
                            </p>
                            <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100">
                                <Image
                                    src={report.foto_url}
                                    alt="Foto bukti laporan"
                                    fill
                                    className="object-cover"
                                    onError={() => setFotoError(true)}
                                    sizes="(max-width: 768px) 100vw, 500px"
                                />
                            </div>
                        </div>
                    )}

                    {/* Waktu lengkap */}
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>
                            <span className="font-medium">Dilaporkan:</span>{' '}
                            {new Date(report.created_at).toLocaleString('id-ID', {
                                day: '2-digit', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </p>
                        {report.updated_at !== report.created_at && (
                            <p>
                                <span className="font-medium">Terakhir diupdate:</span>{' '}
                                {new Date(report.updated_at).toLocaleString('id-ID', {
                                    day: '2-digit', month: 'long', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </p>
                        )}
                    </div>

                    {/* Input catatan responden */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Catatan Penanganan
                        </label>
                        <textarea
                            value={catatan}
                            onChange={e => setCatatan(e.target.value)}
                            placeholder="Contoh: Satpam sudah menuju lokasi, situasi terkendali..."
                            rows={2}
                            className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Tombol aksi status */}
                    <div className="flex gap-2">
                        {report.status === 'menunggu' && (
                            <button
                                onClick={() => handleUpdate('diproses')}
                                disabled={isUpdating}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                            >
                                <PlayCircle size={16} />
                                {isUpdating ? 'Memproses...' : 'Tandai Diproses'}
                            </button>
                        )}

                        {report.status !== 'selesai' && (
                            <button
                                onClick={() => handleUpdate('selesai')}
                                disabled={isUpdating}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                            >
                                <CheckCircle2 size={16} />
                                {isUpdating ? 'Menyimpan...' : 'Tandai Selesai'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}