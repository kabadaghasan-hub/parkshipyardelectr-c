// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PARK TERSANE Renk Paleti
        'park-orange': '#FF7A00', // Ana Vurgu Rengi
        'park-blue': '#004C99', // İkincil Vurgu Rengi
        // Dark Mode için temel renkler
        'dark-bg': '#121212',
        'dark-card': '#1e1e1e',
      },
    },
  },
  plugins: [],
}
export default config



module.exports = {
  // ... diğer ayarlarınız
  theme: {
    extend: {
      colors: {
        'park-blue': '#003366', // Kendi istediğiniz bir mavi tonu
        'park-orange': '#FF6600', // Kendi istediğiniz bir turuncu tonu
      },
      // ... diğer extend ayarları
    },
  },
  // ... diğer ayarlarınız
}

