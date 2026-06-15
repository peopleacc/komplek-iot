'use client'
// components/users/AddUserForm.tsx
// Form input: tambah warga atau satpam baru oleh admin

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

// ── Schema (sama dengan yang di API route) ───────────────────
const formSchema = z.object({
    nama_lengkap: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string()
        .min(8, 'Password minimal 8 karakter')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Harus ada huruf besar, kecil, dan angka'
        ),
    alamat_blok: z.string().min(3, 'Alamat blok tidak boleh kosong'),
    nomor_hp: z.string().min(10, 'Nomor HP minimal 10 digit'),
    role: z.enum(['warga', 'satpam']),
})

type FormValues = z.infer<typeof formSchema>

interface AddUserFormProps {
    onSuccess: () => void  // callback untuk refresh tabel setelah berhasil
}

export function AddUserForm({ onSuccess }: AddUserFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { role: 'warga' },
    })

    // ── Submit ─────────────────────────────────────────────────

    const onSubmit = async (values: FormValues) => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })

            const data = await res.json()

            if (!res.ok) {
                // Tampilkan error validasi field per field
                if (data.errors) {
                    data.errors.forEach((e: { field: string; message: string }) => {
                        toast.error(`${e.field}: ${e.message}`)
                    })
                } else {
                    toast.error(data.message ?? 'Gagal mendaftarkan user.')
                }
                return
            }

            toast.success(`✅ ${data.message}`)
            reset()
            setIsOpen(false)
            onSuccess()  // refresh tabel

        } catch {
            toast.error('Terjadi kesalahan jaringan. Coba lagi.')
        }
    }

    // ── UI ─────────────────────────────────────────────────────

    return (
        <div>
            {/* Tombol buka form */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
                <UserPlus size={16} />
                Tambah Anggota Komplek
            </button>

            {/* Panel form — toggle show/hide */}
            {isOpen && (
                <div className="mt-4 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                        Daftarkan Anggota Baru
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Akun yang dibuat langsung aktif dan bisa digunakan untuk login di
                        aplikasi Flutter.
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Baris 1: Nama & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field
                                label="Nama Lengkap"
                                error={errors.nama_lengkap?.message}
                            >
                                <input
                                    {...register('nama_lengkap')}
                                    placeholder="Contoh: Siti Rahayu"
                                    className={inputClass(!!errors.nama_lengkap)}
                                />
                            </Field>

                            <Field label="Email" error={errors.email?.message}>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="warga@email.com"
                                    className={inputClass(!!errors.email)}
                                />
                            </Field>
                        </div>

                        {/* Baris 2: Password */}
                        <Field label="Password" error={errors.password?.message}>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 8 karakter, huruf besar+kecil+angka"
                                    className={inputClass(!!errors.password) + ' pr-10'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </Field>

                        {/* Baris 3: Blok & Nomor HP */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Alamat Blok" error={errors.alamat_blok?.message}>
                                <input
                                    {...register('alamat_blok')}
                                    placeholder="Contoh: Blok A/12"
                                    className={inputClass(!!errors.alamat_blok)}
                                />
                            </Field>

                            <Field label="Nomor HP (WhatsApp)" error={errors.nomor_hp?.message}>
                                <input
                                    {...register('nomor_hp')}
                                    type="tel"
                                    placeholder="08xxxxxxxxxx"
                                    className={inputClass(!!errors.nomor_hp)}
                                />
                            </Field>
                        </div>

                        {/* Baris 4: Role */}
                        <Field label="Role / Jabatan" error={errors.role?.message}>
                            <div className="flex gap-4">
                                {(['warga', 'satpam'] as const).map(r => (
                                    <label
                                        key={r}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <input
                                            {...register('role')}
                                            type="radio"
                                            value={r}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-sm font-medium capitalize">
                                            {r === 'warga' ? '🏠 Warga' : '🛡️ Satpam'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </Field>

                        {/* Tombol aksi */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                            >
                                {isSubmitting ? (
                                    <><Loader2 size={16} className="animate-spin" /> Mendaftarkan...</>
                                ) : (
                                    <><UserPlus size={16} /> Daftarkan Sekarang</>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setIsOpen(false); reset() }}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

// ── Helper Components ────────────────────────────────────────

function Field({
    label,
    error,
    children,
}: {
    label: string
    error?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

function inputClass(hasError: boolean) {
    return [
        'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors',
        'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        hasError
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-white hover:border-gray-400',
    ].join(' ')
}