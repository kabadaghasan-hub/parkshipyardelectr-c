// app/api/motor/complete-step/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    const { motorId, stepId, technicianId } = await request.json()

    if (!motorId || !stepId || !technicianId) {
        return NextResponse.json({ message: 'Eksik bilgi: motorId, stepId ve technicianId gerekli.' }, { status: 400 })
    }

    try {
        const { data, error } = await supabase
            .from('motor_steps')
            .upsert({
                motor_id: motorId,
                step_id: stepId,
                completed: true,
                completed_at: new Date().toISOString(),
                technician_id: technicianId
            }, { onConflict: 'motor_id, step_id' }) 

        if (error) {
            return NextResponse.json({ message: 'Adım tamamlama veritabanı hatası.' }, { status: 500 })
        }
        
        // Log kaydını oluştur
        const logAction = `Adım Tamamlandı: step_id=${stepId}`
        await supabase.from('logs').insert({
            motor_id: motorId,
            action: logAction,
            technician_id: technicianId,
        })
        
        return NextResponse.json({ message: 'Adım başarıyla tamamlandı.', data }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ message: 'Sunucu hatası.' }, { status: 500 })
    }
}
