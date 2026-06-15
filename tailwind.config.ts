// tailwind.config.ts
// Tambahkan keyframes custom untuk animasi sirine dan notifikasi

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        // Progress bar sirine menyusut
        sirenProgress: {
          '0%': { width: '100%' },
          '50%': { width: '30%' },
          '100%': { width: '100%' },
        },
        // Timer bar notifikasi laporan baru menyusut dalam 8 detik
        shrinkWidth: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        // Slide in dari kanan untuk notifikasi
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'siren-progress': 'sirenProgress 2s ease-in-out infinite',
        'shrink-width': 'shrinkWidth 8s linear forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config