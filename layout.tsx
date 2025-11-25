import './globals.css'
import { Inter } from 'next/font/google'
import NextAuthSessionProvider from './providers' // Provider'ı içe aktardık

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NextAuth Supabase Uygulaması',
  description: 'Next.js 13 App Router, NextAuth ve Supabase ile kimlik doğrulama',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Tüm uygulamayı SessionProvider ile sarıyoruz */}
        <NextAuthSessionProvider>
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}
