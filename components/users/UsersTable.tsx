'use client'
// components/users/UsersTable.tsx
// Tabel daftar user dengan fitur Edit (inline) dan Delete

import { useEffect, useState, useCallback } from 'react'
import {
    Loader2, RefreshCw, User, Phone, MapPin,
    Pencil, Trash2, Check, X, Eye, EyeOff, AlertTriangle
} from 'lucide-react'

interface UserRow {
    id: string
    email: string
    nama_lengkap: string
    nomor_hp: string
    alamat_blok: string
    role: 'warga' | 'satpam' | 'admin'
    created_at: string
}

interface UsersTableProps {
    refreshSignal?: number
}

// ── Tabel utama ───────────────────────────────────────────────

export function UsersTable({ refreshSignal = 0 }: UsersTableProps) {
    const [users, setUsers] = useState<UserRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ID user yang sedang di-edit atau dihapus
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/users')
            const data = await res.json()
            if (!res.ok) {
                setError(data.message ?? 'Gagal memuat data.')
            } else {
                setUsers(data.data ?? [])
            }
        } catch {
            setError('Koneksi gagal. Coba lagi.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [refreshSignal, fetchUsers])

    // ── Hapus user ────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id))
            } else {
                alert(data.message ?? 'Gagal menghapus user.')
            }
        } catch {
            alert('Koneksi gagal.')
        } finally {
            setDeletingId(null)
            setConfirmDeleteId(null)
        }
    }

    // ── Setelah edit selesai ──────────────────────────────────

    const handleEditSaved = (updated: UserRow) => {
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
        setEditingId(null)
    }

    // ── Badges ───────────────────────────────────────────────

    const roleBadge: Record<string, string> = {
        admin: 'bg-purple-100 text-purple-700',
        satpam: 'bg-blue-100 text-blue-700',
        warga: 'bg-green-100 text-green-700',
    }
    const roleEmoji: Record<string, string> = {
        admin: '⚙️', satpam: '🛡️', warga: '🏠',
    }

    // ── States ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 size={22} className="animate-spin mr-2" />
                <span className="text-sm">Memuat data pengguna...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 text-sm">{error}</p>
                <button onClick={fetchUsers} className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1 mx-auto">
                    <RefreshCw size={13} /> Coba lagi
                </button>
            </div>
        )
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <User size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Belum ada pengguna terdaftar</p>
                <p className="text-sm text-gray-400 mt-1">Tambahkan user melalui tombol di atas</p>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* Header tabel */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">
                    Total: <span className="text-blue-600">{users.length}</span> pengguna
                </p>
                <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Blok</th>
                            <th className="px-4 py-3">No. HP</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map(user => (
                            editingId === user.id ? (
                                <EditRow
                                    key={user.id}
                                    user={user}
                                    onSaved={handleEditSaved}
                                    onCancel={() => setEditingId(null)}
                                />
                            ) : (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                    {/* Nama */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                                {user.nama_lengkap?.[0]?.toUpperCase() ?? '?'}
                                            </div>
                                            <span className="font-medium text-gray-900 truncate max-w-[150px]">{user.nama_lengkap}</span>
                                        </div>
                                    </td>
                                    {/* Email */}
                                    <td className="px-4 py-3 text-gray-500 max-w-[170px] truncate">{user.email}</td>
                                    {/* Role */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge[user.role]}`}>
                                            {roleEmoji[user.role]} {user.role}
                                        </span>
                                    </td>
                                    {/* Blok */}
                                    <td className="px-4 py-3 text-gray-500">
                                        <span className="flex items-center gap-1"><MapPin size={12} className="text-gray-400" />{user.alamat_blok || '-'}</span>
                                    </td>
                                    {/* HP */}
                                    <td className="px-4 py-3 text-gray-500">
                                        <span className="flex items-center gap-1"><Phone size={12} className="text-gray-400" />{user.nomor_hp || '-'}</span>
                                    </td>
                                    {/* Aksi */}
                                    <td className="px-4 py-3">
                                        {confirmDeleteId === user.id ? (
                                            // Konfirmasi hapus
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-xs text-red-600 flex items-center gap-1">
                                                    <AlertTriangle size={12} /> Hapus?
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={deletingId === user.id}
                                                    className="p-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                                >
                                                    {deletingId === user.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="p-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingId(user.id)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    title="Edit user"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(user.id)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Hapus user"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ── Row Edit Inline ───────────────────────────────────────────

function EditRow({
    user,
    onSaved,
    onCancel,
}: {
    user: UserRow
    onSaved: (updated: UserRow) => void
    onCancel: () => void
}) {
    const [form, setForm] = useState({
        nama_lengkap: user.nama_lengkap,
        nomor_hp: user.nomor_hp,
        alamat_blok: user.alamat_blok,
        role: user.role,
        password: '',
    })
    const [showPass, setShowPass] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        const payload: Record<string, string> = {
            nama_lengkap: form.nama_lengkap,
            nomor_hp: form.nomor_hp,
            alamat_blok: form.alamat_blok,
            role: form.role,
        }
        if (form.password) payload.password = form.password

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.message ?? 'Gagal menyimpan.')
            } else {
                onSaved({ ...user, ...payload, role: form.role })
            }
        } catch {
            setError('Koneksi gagal.')
        } finally {
            setSaving(false)
        }
    }

    const inp = 'w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400'

    return (
        <tr className="bg-blue-50 border-y-2 border-blue-200">
            {/* Nama */}
            <td className="px-4 py-2">
                <input
                    value={form.nama_lengkap}
                    onChange={e => setForm(p => ({ ...p, nama_lengkap: e.target.value }))}
                    className={inp}
                    placeholder="Nama lengkap"
                />
            </td>
            {/* Email (read-only) */}
            <td className="px-4 py-2 text-xs text-gray-400 italic">{user.email}</td>
            {/* Role */}
            <td className="px-4 py-2">
                <select
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRow['role'] }))}
                    className={inp}
                >
                    <option value="warga">🏠 Warga</option>
                    <option value="satpam">🛡️ Satpam</option>
                    <option value="admin">⚙️ Admin</option>
                </select>
            </td>
            {/* Blok */}
            <td className="px-4 py-2">
                <input
                    value={form.alamat_blok}
                    onChange={e => setForm(p => ({ ...p, alamat_blok: e.target.value }))}
                    className={inp}
                    placeholder="Blok"
                />
            </td>
            {/* HP + Password (dalam satu kolom) */}
            <td className="px-4 py-2 space-y-1">
                <input
                    value={form.nomor_hp}
                    onChange={e => setForm(p => ({ ...p, nomor_hp: e.target.value }))}
                    className={inp}
                    placeholder="No. HP"
                />
                <div className="relative">
                    <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        className={inp + ' pr-7'}
                        placeholder="Password baru (opsional)"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                        {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
            </td>
            {/* Tombol aksi */}
            <td className="px-4 py-2">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Simpan
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-100"
                    >
                        <X size={12} /> Batal
                    </button>
                </div>
            </td>
        </tr>
    )
}