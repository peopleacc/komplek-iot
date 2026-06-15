// app/dashboard/page.tsx
// Redirect otomatis ke /dashboard/reports sebagai halaman default

import { redirect } from 'next/navigation'

export default function DashboardIndexPage() {
    redirect('/dashboard/reports')
}