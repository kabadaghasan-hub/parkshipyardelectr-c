// app/admin/layout.tsx

import React from 'react'
import Link from 'next/link'
import { Ship, Wrench, User, LogOut } from 'lucide-react'

// Menü öğeleri
const navItems = [
  { name: 'Motorlar', href: '/admin/motors', icon: Wrench },
  { name: 'Gemiler', href: '/admin/ships', icon: Ship },
  { name: 'Teknisyenler', href: '/admin/technicians', icon: User },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-dark-bg text-white">
      {/* Sol Menü (Sidebar) */}
      <aside className="w-64 bg-dark-card p-6 border-r border-gray-700 flex flex-col">
        <div className="text-2xl font-bold text-park-orange mb-10">
          ⚙️ PARK TERSANE
          <p className="text-xs font-normal text-gray-400 mt-1">Admin Yönetim</p>
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex items-center p-3 rounded-lg text-lg font-medium text-gray-300 hover:bg-park-blue/30 transition duration-150"
            >
              <item.icon className="w-5 h-5 mr-3 text-park-blue" />
              {item.name}
            </Link>
          ))}
        </nav>

        <button className="flex items-center p-3 rounded-lg text-lg font-medium text-red-400 hover:bg-red-900/30 transition duration-150 mt-4">
          <LogOut className="w-5 h-5 mr-3" />
          Çıkış Yap
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
