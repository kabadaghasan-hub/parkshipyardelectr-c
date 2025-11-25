// app/api/login/technician/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    const { phone, password } = await request.json()

    if (!phone || !password) {
        return NextResponse.json({ message: 'Telefon ve şifre gerekli.' }, { status: 400 })
    }

    try {
        const { data: technician, error } = await supabase
            .from('technicians')
            .select('id, name, phone, password_hash') // password_hash burada gerçek hash olmalı!
            .eq('phone', phone)
            .single()

        if (error || !technician) {
            return NextResponse.json({ message: 'Kullanıcı bulunamadı.' }, { status: 401 })
        }
        
        // Şifre karşılaştırması (Gerçek uygulamada BCrypt gibi kütüphaneler kullanılır.)
        if (password === technician.password_hash) { 
            return NextResponse.json({ 
                message: 'Giriş başarılı.', 
                technicianId: technician.id, 
                name: technician.name 
            })
        } else {
            return NextResponse.json({ message: 'Şifre yanlış.' }, { status: 401 })
        }

    } catch (error) {
        return NextResponse.json({ message: 'Sunucu hatası.' }, { status: 500 })
    }
}
