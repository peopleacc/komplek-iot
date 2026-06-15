'use client'
// components/SidebarNav.tsx
// Navigasi sidebar — item berbeda berdasarkan role

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileText, LogOut, Users } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-client'

const navItems = [
    {
        href: '/dashboard/reports',
        icon: <FileText size={18} />,
        label: 'Laporan Masuk',
        roles: ['admin', 'satpam'],
    },
    {
        href: '/dashboard/users',
        icon: <Users size={18} />,
        label: 'Manajemen User',
        roles: ['admin'],
    },
]

export function SidebarNav({ role }: { role: string }) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = getSupabaseBrowserClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const visibleItems = navItems.filter(item => item.roles.includes(role))

    return (
        <ul className="space-y-1">
            {visibleItems.map(item => {
                const isActive = pathname.startsWith(item.href)
                return (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            className={[
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                            ].join(' ')}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    </li>
                )
            })}

            {/* Tombol logout */}
            <li className="pt-4 mt-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
                >
                    <LogOut size={18} />
                    Keluar
                </button>
            </li>
        </ul>
    )
}