// app/dashboard/layout.tsx
// Layout dashboard — semua halaman di /dashboard pakai layout ini
// Termasuk: sidebar navigasi, session guard (redirect ke login jika belum auth)

import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase-server'
import { SidebarNav } from '@/components/SidebarNav'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Guard: cek session di server sebelum render halaman
    const profile = await getSessionProfile()

    // Belum login → redirect ke /login
    if (!profile) {
        redirect('/login')
    }

    // Warga tidak boleh akses dashboard Next.js
    if (profile.role === 'warga') {
        redirect('/login?error=unauthorized')
    }

    return (
        <div className="min-h-screen flex bg-gray-50">

            {/* Sidebar kiri */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                {/* Logo */}
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">KA</span>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Komplek Aman</p>
                            <p className="text-xs text-gray-500">Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Navigasi */}
                <nav className="flex-1 p-4">
                    <SidebarNav role={profile.role} />
                </nav>

                {/* Info user login */}
                <div className="px-4 py-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {profile.nama_lengkap[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {profile.nama_lengkap}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Konten utama */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}