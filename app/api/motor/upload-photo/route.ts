// app/api/motor/upload-photo/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    // NOT: Fotoğrafın kendisi CLIENT tarafında Supabase Storage'a yüklenir.
    // Bu API sadece URL'yi DB'ye kaydeder.
    const { motorId, stepId, imageUrl } = await request.json()

    if (!motorId || !stepId || !imageUrl) {
        return NextResponse.json({ message: 'Eksik bilgi: motorId, stepId ve imageUrl gerekli.' }, { status: 400 })
    }

    try {
        // motor_step kaydını bul veya oluştur
        const { data: motorStepData, error: fetchError } = await supabase
            .from('motor_steps')
            .upsert({ motor_id: motorId, step_id: stepId }, { onConflict: 'motor_id, step_id' })
            .select('id')
            .single()
            
        if (fetchError || !motorStepData) {
            return NextResponse.json({ message: 'İlgili adım kaydı bulunamadı/oluşturulamadı.' }, { status: 500 })
        }
        
        const motorStepId = motorStepData.id;

        // step_photos tablosuna fotoğraf kaydını ekle
        const { error: photoError } = await supabase
            .from('step_photos')
            .insert({
                motor_step_id: motorStepId,
                image_url: imageUrl
            })

        if (photoError) {
            return NextResponse.json({ message: 'Fotoğraf veritabanına kaydedilemedi.' }, { status: 500 })
        }
        
        return NextResponse.json({ message: 'Fotoğraf başarıyla yüklendi ve kaydedildi.' }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ message: 'Sunucu hatası.' }, { status: 500 })
    }
}
