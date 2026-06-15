'use client'
// app/dashboard/users/page.tsx
// Halaman Manajemen User — CRUD lengkap dengan modal popup

import { useEffect, useState, useCallback } from 'react'
import {
    Users, UserPlus, Pencil, Trash2, X, Check, Eye, EyeOff,
    Loader2, AlertTriangle, Phone, MapPin, RefreshCw, User, AlertCircle, CheckCircle2, Shield
} from 'lucide-react'

// ── Tipe ──────────────────────────────────────────────────────

interface UserRow {
    id: string
    email: string
    nama_lengkap: string
    nomor_hp: string
    alamat_blok: string
    role: 'warga' | 'satpam' | 'admin'
    created_at: string
}

type CreateForm = {
    email: string
    password: string
    nama_lengkap: string
    nomor_hp: string
    alamat_blok: string
    role: 'warga' | 'satpam' | 'admin'
}

type EditForm = {
    nama_lengkap: string
    nomor_hp: string
    alamat_blok: string
    role: 'warga' | 'satpam' | 'admin'
    password: string
}

// ── Badge helpers ─────────────────────────────────────────────

const roleBadge: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border border-purple-200',
    satpam: 'bg-blue-100 text-blue-700 border border-blue-200',
    warga: 'bg-green-100 text-green-700 border border-green-200',
}
const roleEmoji: Record<string, string> = { admin: '⚙️', satpam: '🛡️', warga: '🏠' }

// ── Input style helper ────────────────────────────────────────

function inp(err = false) {
    return [
        'w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all',
        err
            ? 'border-red-400 bg-red-50 focus:ring-red-400'
            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent',
    ].join(' ')
}

// ── Halaman utama ─────────────────────────────────────────────

export default function UsersPage() {
    const [users, setUsers] = useState<UserRow[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)

    // Modal state
    const [showCreate, setShowCreate] = useState(false)
    const [editUser, setEditUser] = useState<UserRow | null>(null)
    const [deleteUser, setDeleteUser] = useState<UserRow | null>(null)

    // ── Fetch ────────────────────────────────────────────────

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setFetchError(null)
        try {
            const res = await fetch('/api/users')
            const data = await res.json()
            if (!res.ok) setFetchError(data.message ?? 'Gagal memuat data.')
            else setUsers(data.data ?? [])
        } catch {
            setFetchError('Koneksi gagal.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    // ── Delete ───────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (res.ok) {
            setUsers(prev => prev.filter(u => u.id !== id))
            setDeleteUser(null)
        } else {
            alert(data.message ?? 'Gagal menghapus user.')
        }
    }

    // ── Render ───────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Users size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola warga, satpam, dan admin komplek</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchUsers} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                        <RefreshCw size={15} />
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <UserPlus size={16} />
                        Tambah User
                    </button>
                </div>
            </div>

            {/* Tabel */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 size={22} className="animate-spin mr-2" />
                    <span className="text-sm">Memuat data...</span>
                </div>
            ) : fetchError ? (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
                    <p className="text-red-500 text-sm">{fetchError}</p>
                    <button onClick={fetchUsers} className="mt-3 text-sm text-blue-600 hover:underline">Coba lagi</button>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
                    <User size={48} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">Belum ada pengguna</p>
                    <button onClick={() => setShowCreate(true)} className="mt-4 text-sm text-blue-600 hover:underline">Tambah user pertama</button>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                        <p className="text-sm text-gray-500">
                            Total <span className="font-bold text-gray-800">{users.length}</span> pengguna
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3">Nama</th>
                                    <th className="px-5 py-3">Email</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Blok</th>
                                    <th className="px-5 py-3">No. HP</th>
                                    <th className="px-5 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                                    {user.nama_lengkap?.[0]?.toUpperCase() ?? '?'}
                                                </div>
                                                <span className="font-medium text-gray-900 max-w-[130px] truncate">{user.nama_lengkap}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">{user.email || '-'}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge[user.role]}`}>
                                                {roleEmoji[user.role]} {user.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500">
                                            <span className="flex items-center gap-1"><MapPin size={12} className="text-gray-300" />{user.alamat_blok || '-'}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500">
                                            <span className="flex items-center gap-1"><Phone size={12} className="text-gray-300" />{user.nomor_hp || '-'}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditUser(user)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteUser(user)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Modal: Tambah User ──────────────────────────── */}
            {showCreate && (
                <CreateModal
                    onClose={() => setShowCreate(false)}
                    onCreated={(newUser) => {
                        setUsers(prev => [newUser, ...prev])
                        setShowCreate(false)
                    }}
                />
            )}

            {/* ── Modal: Edit User ────────────────────────────── */}
            {editUser && (
                <EditModal
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onSaved={(updated) => {
                        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
                        setEditUser(null)
                    }}
                />
            )}

            {/* ── Modal: Konfirmasi Hapus ─────────────────────── */}
            {deleteUser && (
                <DeleteModal
                    user={deleteUser}
                    onClose={() => setDeleteUser(null)}
                    onDeleted={() => handleDelete(deleteUser.id)}
                />
            )}
        </div>
    )
}

// ── Modal Wrapper ─────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            {/* Panel */}
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md animate-[slideInRight_0.2s_ease-out]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}

// ── Modal: Create ─────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: UserRow) => void }) {
    const [form, setForm] = useState<CreateForm>({
        email: '', password: '', nama_lengkap: '', nomor_hp: '', alamat_blok: '', role: 'warga'
    })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm(p => ({ ...p, [name]: value }))
        setFieldErrors(p => { const n = { ...p }; delete n[name]; return n })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setFieldErrors({})
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.errors) {
                    const map: Record<string, string> = {}
                    data.errors.forEach((e: { field: string; message: string }) => { map[e.field] = e.message })
                    setFieldErrors(map)
                } else {
                    setError(data.message ?? 'Gagal membuat user.')
                }
            } else {
                onCreated({
                    id: data.user_id,
                    email: form.email,
                    nama_lengkap: form.nama_lengkap,
                    nomor_hp: form.nomor_hp,
                    alamat_blok: form.alamat_blok,
                    role: form.role,
                    created_at: new Date().toISOString(),
                })
            }
        } catch {
            setError('Koneksi gagal.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal title="Tambah User Baru" onClose={onClose}>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="user@email.com" required className={inp(!!fieldErrors.email)} />
                    {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                    <div className="relative">
                        <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 karakter" required className={inp(!!fieldErrors.password) + ' pr-10'} />
                        <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                </div>

                {/* Nama Lengkap */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap</label>
                    <input type="text" name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} placeholder="Contoh: Budi Santoso" required className={inp(!!fieldErrors.nama_lengkap)} />
                    {fieldErrors.nama_lengkap && <p className="mt-1 text-xs text-red-500">{fieldErrors.nama_lengkap}</p>}
                </div>

                {/* HP & Blok */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor HP</label>
                        <input type="tel" name="nomor_hp" value={form.nomor_hp} onChange={handleChange} placeholder="08xxxxxxxxxx" required className={inp(!!fieldErrors.nomor_hp)} />
                        {fieldErrors.nomor_hp && <p className="mt-1 text-xs text-red-500">{fieldErrors.nomor_hp}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alamat Blok</label>
                        <input type="text" name="alamat_blok" value={form.alamat_blok} onChange={handleChange} placeholder="Blok A/12" required className={inp(!!fieldErrors.alamat_blok)} />
                        {fieldErrors.alamat_blok && <p className="mt-1 text-xs text-red-500">{fieldErrors.alamat_blok}</p>}
                    </div>
                </div>

                {/* Role */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['warga', 'satpam', 'admin'] as const).map(r => (
                            <label key={r} className={['flex flex-col items-center gap-1 py-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-semibold', form.role === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'].join(' ')}>
                                <input type="radio" name="role" value={r} checked={form.role === r} onChange={handleChange} className="sr-only" />
                                <span className="text-lg">{roleEmoji[r]}</span>
                                {r}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Mendaftarkan...</> : <><UserPlus size={15} /> Daftarkan</>}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

// ── Modal: Edit ───────────────────────────────────────────────

function EditModal({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: (u: UserRow) => void }) {
    const [form, setForm] = useState<EditForm>({
        nama_lengkap: user.nama_lengkap,
        nomor_hp: user.nomor_hp,
        alamat_blok: user.alamat_blok,
        role: user.role,
        password: '',
    })
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm(p => ({ ...p, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const payload: Record<string, string> = {
                nama_lengkap: form.nama_lengkap,
                nomor_hp: form.nomor_hp,
                alamat_blok: form.alamat_blok,
                role: form.role,
            }
            if (form.password) payload.password = form.password

            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.message ?? 'Gagal menyimpan.')
            } else {
                setSuccess(true)
                setTimeout(() => onSaved({ ...user, ...payload, role: form.role }), 800)
            }
        } catch {
            setError('Koneksi gagal.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal title="Edit User" onClose={onClose}>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Email (read-only) */}
                <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2 text-sm text-gray-500">
                    <Shield size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-700">{user.email}</span>
                    <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">read-only</span>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        <CheckCircle2 size={15} /> Berhasil disimpan!
                    </div>
                )}

                {/* Nama */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap</label>
                    <input type="text" name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} required className={inp()} />
                </div>

                {/* HP & Blok */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor HP</label>
                        <input type="tel" name="nomor_hp" value={form.nomor_hp} onChange={handleChange} className={inp()} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alamat Blok</label>
                        <input type="text" name="alamat_blok" value={form.alamat_blok} onChange={handleChange} className={inp()} />
                    </div>
                </div>

                {/* Password baru (opsional) */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Password Baru <span className="text-gray-400 font-normal">(opsional — kosongkan jika tidak ingin mengubah)</span>
                    </label>
                    <div className="relative">
                        <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Biarkan kosong" className={inp() + ' pr-10'} />
                        <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                </div>

                {/* Role */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['warga', 'satpam', 'admin'] as const).map(r => (
                            <label key={r} className={['flex flex-col items-center gap-1 py-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-semibold', form.role === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'].join(' ')}>
                                <input type="radio" name="role" value={r} checked={form.role === r} onChange={handleChange} className="sr-only" />
                                <span className="text-lg">{roleEmoji[r]}</span>
                                {r}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={loading || success} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : success ? <><CheckCircle2 size={15} /> Tersimpan!</> : <><Check size={15} /> Simpan Perubahan</>}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

// ── Modal: Delete ─────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }: { user: UserRow; onClose: () => void; onDeleted: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        await onDeleted()
        setLoading(false)
    }

    return (
        <Modal title="Hapus User" onClose={onClose}>
            <div className="px-6 py-5">
                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100 mb-5">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg font-bold shrink-0">
                        {user.nama_lengkap?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{user.nama_lengkap}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-xs font-semibold ${roleBadge[user.role]}`}>
                            {roleEmoji[user.role]} {user.role}
                        </span>
                    </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>Akun ini akan dihapus permanen dari autentikasi dan database. Tindakan ini <strong>tidak bisa dibatalkan</strong>.</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50">Batal</button>
                    <button onClick={handleConfirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60">
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Menghapus...</> : <><Trash2 size={15} /> Hapus Permanen</>}
                    </button>
                </div>
            </div>
        </Modal>
    )
}