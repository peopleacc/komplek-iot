'use client'
// app/dashboard/reports/page.tsx
// Daftar laporan dalam tampilan card grid + sirine banner

import { useRealtimeReports } from '@/hooks/useRealtimeReports'
import { SireneBanner, NewReportAlert } from '@/components/SireneBanner'
import { RefreshCw, ShieldCheck, Clock, MapPin, Phone, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// ── Kategori config ───────────────────────────────────────────

const kategoriConfig: Record<string, { emoji: string; label: string; bg: string; border: string; text: string }> = {
    kebakaran: { emoji: '🔥', label: 'Kebakaran', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
    maling:    { emoji: '🚨', label: 'Maling',    bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700' },
    medis:     { emoji: '🚑', label: 'Medis',     bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700' },
    lainnya:   { emoji: '⚠️', label: 'Lainnya',  bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700' },
}

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
    menunggu: { label: 'Menunggu',  dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
    diproses: { label: 'Diproses',  dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700' },
    selesai:  { label: 'Selesai',   dot: 'bg-green-400',  badge: 'bg-green-100 text-green-700' },
}

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff} detik lalu`
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return `${Math.floor(diff / 86400)} hari lalu`
}

// ── Halaman utama ─────────────────────────────────────────────

export default function ReportsPage() {
    const {
        reports,
        isLoading,
        error,
        sirenActive,
        newReportAlert,
        stopSiren,
        refetch,
        dismissAlert,
    } = useRealtimeReports()

    const totalMenunggu  = reports.filter(r => r.status === 'menunggu').length
    const totalDiproses  = reports.filter(r => r.status === 'diproses').length
    const totalKebakaran = reports.filter(r => r.kategori === 'kebakaran' && r.status !== 'selesai').length

    return (
        <>
            <SireneBanner active={sirenActive} onStop={stopSiren} count={totalKebakaran} />
            {newReportAlert && <NewReportAlert report={newReportAlert} onDismiss={dismissAlert} />}

            <div className={sirenActive ? 'pt-16' : ''}>

                {/* ── Header ─────────────────────────────────── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Laporan Masuk</h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                            Real-time — update otomatis
                        </p>
                    </div>
                    <button
                        onClick={refetch}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* ── Stat bar ───────────────────────────────── */}
                <div className="grid grid-cols-4 gap-3 mb-7">
                    {[
                        { label: 'Total Aktif', value: reports.length, color: 'blue', emoji: '📋' },
                        { label: 'Menunggu',    value: totalMenunggu,  color: 'yellow', emoji: '⏳' },
                        { label: 'Diproses',    value: totalDiproses,  color: 'sky',    emoji: '🔄' },
                        { label: 'Kebakaran',   value: totalKebakaran, color: totalKebakaran > 0 ? 'red' : 'gray', emoji: '🔥' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl border p-4 ${{
                            blue: 'bg-blue-50 border-blue-100', yellow: 'bg-yellow-50 border-yellow-100',
                            sky: 'bg-sky-50 border-sky-100', red: 'bg-red-50 border-red-200', gray: 'bg-gray-50 border-gray-100',
                        }[s.color]}`}>
                            <p className="text-lg">{s.emoji}</p>
                            <p className={`text-2xl font-black mt-1 ${{
                                blue: 'text-blue-700', yellow: 'text-yellow-700',
                                sky: 'text-sky-700', red: 'text-red-700', gray: 'text-gray-400',
                            }[s.color]}`}>{s.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Body ───────────────────────────────────── */}
                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-32 bg-gray-100" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <AlertTriangle className="mx-auto text-red-400 mb-3" size={40} />
                        <p className="text-red-500 font-medium">{error}</p>
                        <button onClick={refetch} className="mt-4 text-sm text-blue-600 hover:underline">Coba lagi</button>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-24">
                        <ShieldCheck size={56} className="mx-auto text-green-400 mb-4" />
                        <p className="text-xl font-bold text-gray-700">Semua Aman!</p>
                        <p className="text-sm text-gray-400 mt-2">Tidak ada laporan aktif saat ini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {reports.map(report => {
                            const kat = kategoriConfig[report.kategori] ?? kategoriConfig.lainnya
                            const st  = statusConfig[report.status]    ?? statusConfig.menunggu
                            const isKebakaran = report.kategori === 'kebakaran' && report.status !== 'selesai'

                            return (
                                <Link
                                    key={report.id}
                                    href={`/dashboard/reports/${report.id}`}
                                    className={[
                                        'group block bg-white rounded-2xl border overflow-hidden shadow-sm',
                                        'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
                                        isKebakaran ? 'border-orange-300 ring-2 ring-orange-200' : 'border-gray-200',
                                    ].join(' ')}
                                >
                                    {/* Top: foto preview atau warna kategori */}
                                    <div className={`relative h-28 ${kat.bg} flex items-center justify-center`}>
                                        {report.foto_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={report.foto_url}
                                                alt="Foto laporan"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-4xl">{kat.emoji}</span>
                                        )}

                                        {/* Badge status kanan atas */}
                                        <span className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${st.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${report.status === 'menunggu' ? 'animate-pulse' : ''}`} />
                                            {st.label}
                                        </span>

                                        {/* Emoji kategori kiri atas */}
                                        {report.foto_url && (
                                            <span className={`absolute top-2 left-2 w-7 h-7 rounded-lg ${kat.bg} border ${kat.border} flex items-center justify-center text-sm shadow-sm`}>
                                                {kat.emoji}
                                            </span>
                                        )}
                                    </div>

                                    {/* Card body */}
                                    <div className="p-3.5">
                                        {/* Nama pelapor */}
                                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                                            {report.pelapor_nama}
                                        </p>

                                        {/* Kategori */}
                                        <p className={`text-xs font-semibold mt-0.5 ${kat.text}`}>
                                            {kat.emoji} {kat.label}
                                        </p>

                                        {/* Blok & waktu */}
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                                <MapPin size={10} className="shrink-0 text-gray-400" />
                                                {report.pelapor_blok}
                                            </p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock size={10} className="shrink-0" />
                                                {timeAgo(report.created_at)}
                                            </p>
                                        </div>

                                        {/* Deskripsi singkat */}
                                        {report.deskripsi && (
                                            <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                {report.deskripsi}
                                            </p>
                                        )}
                                    </div>

                                    {/* Bottom bar: klik untuk detail */}
                                    <div className="px-3.5 pb-3">
                                        <div className="w-full text-center py-1.5 bg-gray-50 group-hover:bg-blue-50 rounded-lg text-xs font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                                            Lihat Detail →
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}