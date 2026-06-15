'use client'
// app/login/page.tsx
// Halaman login untuk admin & satpam di dashboard Next.js

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const supabase = getSupabaseBrowserClient()

            // Login ke Supabase Auth
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            })

            if (authError) {
                setError('Email atau password salah.')
                return
            }

            // Cek role — warga tidak boleh masuk dashboard
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (!profile || profile.role === 'warga') {
                await supabase.auth.signOut()
                setError('Akun Anda tidak memiliki akses ke dashboard ini.')
                return
            }

            // Sukses → arahkan ke dashboard laporan
            router.push('/dashboard/reports')
            router.refresh()

        } catch {
            setError('Terjadi kesalahan. Coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">

                {/* Logo & judul */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
                        <Shield size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Komplek Aman</h1>
                    <p className="text-sm text-gray-500 mt-1">Dashboard Admin & Satpam</p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleLogin}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4"
                >
                    {/* Error banner */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@komplekaman.com"
                            required
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading
                            ? <><Loader2 size={16} className="animate-spin" /> Masuk...</>
                            : 'Masuk ke Dashboard'
                        }
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6">
                    Dashboard khusus Admin & Satpam.<br />
                    Warga gunakan aplikasi Flutter.
                </p>
            </div>
        </div>
    )
}