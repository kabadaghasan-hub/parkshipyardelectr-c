// app/technician/login/page.tsx

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench } from 'lucide-react'

const TechnicianLoginPage = () => {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/login/technician', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        })

        if (response.ok) {
            const data = await response.json()
            // Gerçek uygulamada Session/Cookie oluşturulmalı. 
            // Şimdilik QR okuma sayfasına yönlendiriyoruz.
            alert(`Giriş Başarılı: ${data.name}. Şimdi QR kodu okutmalısınız.`)
            // Başarılı girişten sonra Admin/QR okuma sayfasına yönlendirebiliriz.
            router.push('/admin/motors') // Örnek olarak Admin paneline yönlendirme
        } else {
            const data = await response.json()
            setError(data.message || 'Giriş başarısız.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="bg-dark-card p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="text-center mb-8">
                    <Wrench className="w-12 h-12 text-park-orange mx-auto mb-3" />
                    <h1 className="text-3xl font-bold text-white">TEKNİSYEN GİRİŞİ</h1>
                    <p className="text-sm text-gray-400 mt-1">PARK TERSANE Motor Bakım Sistemi</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Telefon Numarası</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-park-blue focus:ring-1 focus:ring-park-blue"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-park-blue focus:ring-1 focus:ring-park-blue"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-park-orange hover:bg-park-orange/80 text-white font-bold rounded-lg transition duration-200 disabled:bg-gray-600"
                    >
                        {loading ? 'YÜKLENİYOR...' : 'GİRİŞ YAP'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default TechnicianLoginPage
