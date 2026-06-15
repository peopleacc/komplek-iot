'use client'
// app/dashboard/reports/[id]/page.tsx
// Halaman detail laporan — sesuai mockup:
// [Lokasi peta] [Foto laporan]
// [Deskripsi & info]
// [Tombol: Proses Laporan | Lakukan Sirine]

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import {
    ArrowLeft, MapPin, Phone, Clock, User,
    PlayCircle, CheckCircle2, Volume2, Loader2,
    AlertTriangle, ExternalLink, Camera
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ── Tipe ──────────────────────────────────────────────────────

interface ReportDetail {
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

// ── Config ────────────────────────────────────────────────────

const kategoriConfig = {
    kebakaran: { emoji: '🔥', label: 'Kebakaran', gradient: 'from-orange-500 to-red-600', light: 'bg-orange-50 text-orange-700 border-orange-200' },
    maling:    { emoji: '🚨', label: 'Maling',    gradient: 'from-indigo-500 to-purple-600', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    medis:     { emoji: '🚑', label: 'Medis',     gradient: 'from-red-500 to-pink-600', light: 'bg-red-50 text-red-700 border-red-200' },
    lainnya:   { emoji: '⚠️', label: 'Lainnya',  gradient: 'from-amber-500 to-orange-600', light: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const statusConfig = {
    menunggu: { label: 'Menunggu Penanganan', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-400' },
    diproses: { label: 'Sedang Diproses',     badge: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400' },
    selesai:  { label: 'Selesai Ditangani',   badge: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-400' },
}

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff} detik lalu`
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Halaman Detail ────────────────────────────────────────────

export default function ReportDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const supabase = getSupabaseBrowserClient()

    const [report, setReport] = useState<ReportDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Aksi
    const [catatan, setCatatan] = useState('')
    const [updating, setUpdating] = useState(false)
    const [sirenPlaying, setSirenPlaying] = useState(false)

    // ── Fetch laporan ──────────────────────────────────────────

    const fetchReport = useCallback(async () => {
        setLoading(true)
        setError(null)
        const { data, error: fetchErr } = await supabase
            .from('reports_with_user_info')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchErr || !data) {
            setError('Laporan tidak ditemukan.')
        } else {
            setReport(data as ReportDetail)
            setCatatan(data.catatan_responden ?? '')
        }
        setLoading(false)
    }, [id, supabase])

    useEffect(() => { fetchReport() }, [fetchReport])

    // ── Update status ──────────────────────────────────────────

    const handleUpdateStatus = async (status: 'diproses' | 'selesai') => {
        if (!report) return
        setUpdating(true)
        const res = await fetch(`/api/reports/${report.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, catatan_responden: catatan || undefined }),
        })
        if (res.ok) {
            setReport(prev => prev ? { ...prev, status, catatan_responden: catatan } : prev)
        }
        setUpdating(false)
    }

    // ── Sirine manual ──────────────────────────────────────────

    const handleSiren = () => {
        setSirenPlaying(true)
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain); gain.connect(ctx.destination)
            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(440, ctx.currentTime)
            osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5)
            osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.0)
            gain.gain.setValueAtTime(0.5, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0)
            osc.start(); osc.stop(ctx.currentTime + 1.0)
            osc.onended = () => { ctx.close(); setSirenPlaying(false) }
        } catch {
            setSirenPlaying(false)
        }
    }

    // ── Google Static Maps URL ─────────────────────────────────

    const getMapUrl = (lat: number, lng: number) =>
        `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x300&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`

    const getMapsLink = (lat: number, lng: number) =>
        `https://www.google.com/maps?q=${lat},${lng}`

    // ── Render ─────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32 text-gray-400">
                <Loader2 size={28} className="animate-spin mr-3" />
                <span>Memuat laporan...</span>
            </div>
        )
    }

    if (error || !report) {
        return (
            <div className="text-center py-24">
                <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
                <p className="text-red-500 font-semibold">{error ?? 'Laporan tidak ditemukan.'}</p>
                <Link href="/dashboard/reports" className="mt-4 inline-block text-blue-600 hover:underline text-sm">← Kembali ke daftar</Link>
            </div>
        )
    }

    const kat = kategoriConfig[report.kategori] ?? kategoriConfig.lainnya
    const st  = statusConfig[report.status]    ?? statusConfig.menunggu

    return (
        <div className="max-w-5xl mx-auto space-y-5">

            {/* ── Breadcrumb & back ──────────────────────────── */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Kembali
                </button>

                {/* Status badge */}
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${st.badge}`}>
                    <span className={`w-2 h-2 rounded-full ${st.dot} ${report.status === 'menunggu' ? 'animate-pulse' : ''}`} />
                    {st.label}
                </span>
            </div>

            {/* ── Header laporan ─────────────────────────────── */}
            <div className={`rounded-2xl bg-gradient-to-r ${kat.gradient} p-5 text-white shadow-lg`}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
                        {kat.emoji}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-black">{kat.label}</h1>
                        <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1.5">
                            <Clock size={13} />
                            {timeAgo(report.created_at)}
                        </p>
                    </div>
                    <div className="text-right text-xs text-white/70">
                        <p>ID Laporan</p>
                        <p className="font-mono text-white font-bold">{report.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            {/* ── Grid utama: Lokasi | Foto ──────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Lokasi */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                            <MapPin size={15} className="text-blue-500" /> Lokasi Laporan
                        </p>
                        {report.latitude && report.longitude && (
                            <a
                                href={getMapsLink(report.latitude, report.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                                Buka Maps <ExternalLink size={11} />
                            </a>
                        )}
                    </div>

                    {report.latitude && report.longitude ? (
                        <div className="relative">
                            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                                /* Static Map via Google Maps API */
                                <div className="relative h-52 w-full">
                                    <Image
                                        src={getMapUrl(report.latitude, report.longitude)}
                                        alt="Peta lokasi laporan"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                            ) : (
                                /* Fallback: OpenStreetMap iframe */
                                <iframe
                                    className="w-full h-52 border-0"
                                    loading="lazy"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.longitude - 0.005},${report.latitude - 0.005},${report.longitude + 0.005},${report.latitude + 0.005}&layer=mapnik&marker=${report.latitude},${report.longitude}`}
                                />
                            )}

                            {/* Koordinat overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                <p className="text-white text-xs font-mono">
                                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-52 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                            <MapPin size={32} className="mb-2 opacity-30" />
                            <p className="text-sm">Koordinat tidak tersedia</p>
                        </div>
                    )}
                </div>

                {/* Foto laporan */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                            <Camera size={15} className="text-blue-500" /> Foto Laporan
                        </p>
                    </div>

                    {report.foto_url ? (
                        <div className="relative h-52 w-full">
                            <Image
                                src={report.foto_url}
                                alt="Foto bukti laporan"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    ) : (
                        <div className="h-52 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                            <Camera size={32} className="mb-2 opacity-30" />
                            <p className="text-sm">Tidak ada foto</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Info pelapor ───────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4">Data Pelapor</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                            <User size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Nama</p>
                            <p className="font-semibold text-gray-800 text-sm">{report.pelapor_nama}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Blok</p>
                            <p className="font-semibold text-gray-800 text-sm">{report.pelapor_blok}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                            <Phone size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">No. HP</p>
                            <p className="font-semibold text-gray-800 text-sm">{report.pelapor_hp}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Deskripsi & catatan ────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-3">
                    Jenis Laporan & Deskripsi
                </h2>

                {/* Kategori pill */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold mb-3 ${kat.light}`}>
                    {kat.emoji} {kat.label}
                </span>

                {/* Deskripsi */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {report.deskripsi ?? <span className="italic text-gray-400">Tidak ada deskripsi tambahan.</span>}
                    </p>
                </div>

                {/* Catatan penanganan */}
                {report.status !== 'selesai' && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Catatan Penanganan
                        </label>
                        <textarea
                            value={catatan}
                            onChange={e => setCatatan(e.target.value)}
                            placeholder="Tulis catatan penanganan di sini..."
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {report.catatan_responden && report.status === 'selesai' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-green-700 mb-1">Catatan Penanganan:</p>
                        <p className="text-sm text-green-800">{report.catatan_responden}</p>
                    </div>
                )}
            </div>

            {/* ── Tombol aksi ────────────────────────────────── */}
            {report.status !== 'selesai' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4">Tindakan</h2>
                    <div className="flex gap-3 flex-wrap">

                        {/* Proses Laporan */}
                        {report.status === 'menunggu' && (
                            <button
                                onClick={() => handleUpdateStatus('diproses')}
                                disabled={updating}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
                            >
                                {updating ? <Loader2 size={17} className="animate-spin" /> : <PlayCircle size={17} />}
                                Proses Laporan
                            </button>
                        )}

                        {/* Selesai */}
                        {report.status !== 'selesai' && (
                            <button
                                onClick={() => handleUpdateStatus('selesai')}
                                disabled={updating}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors shadow-sm"
                            >
                                {updating ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                                Tandai Selesai
                            </button>
                        )}

                        {/* Lakukan Sirine */}
                        <button
                            onClick={handleSiren}
                            disabled={sirenPlaying}
                            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors shadow-sm"
                        >
                            {sirenPlaying ? <Loader2 size={17} className="animate-spin" /> : <Volume2 size={17} />}
                            {sirenPlaying ? 'Sirine Berbunyi...' : 'Lakukan Sirine'}
                        </button>
                    </div>
                </div>
            )}

            {/* Laporan selesai */}
            {report.status === 'selesai' && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-green-600" />
                    </div>
                    <div>
                        <p className="font-bold text-green-800">Laporan Selesai Ditangani</p>
                        <p className="text-sm text-green-600 mt-0.5">
                            Diupdate: {timeAgo(report.updated_at)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
