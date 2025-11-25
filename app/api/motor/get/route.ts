// app/api/motor/get/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const motorId = searchParams.get('id')

    if (!motorId) {
        return NextResponse.json({ message: 'Motor ID gerekli.' }, { status: 400 })
    }

    try {
        const { data: motor, error: motorError } = await supabase
            .from('motors')
            .select('motor_name, kw, rpm, notes, ships(name)')
            .eq('id', motorId)
            .single()

        if (motorError || !motor) {
            return NextResponse.json({ message: 'Motor bulunamadı.' }, { status: 404 })
        }
        
        const { data: stepsData, error: stepsError } = await supabase
            .from('maintenance_steps')
            .select(`
                *,
                motor_steps!inner (
                    id, 
                    completed, 
                    completed_at, 
                    step_photos(image_url)
                )
            `)
            .order('step_order', { ascending: true })

        if (stepsError || !stepsData) {
            return NextResponse.json({ message: 'Bakım adımları yüklenemedi.' }, { status: 500 })
        }

        const steps = stepsData.map(step => {
            const motorStep = step.motor_steps.length > 0 ? step.motor_steps[0] : {};
            return {
                ...step,
                completed: motorStep.completed || false,
                completed_at: motorStep.completed_at || null,
                motor_step_id: motorStep.id || null,
                photos: motorStep.step_photos || [],
                motor_steps: undefined 
            };
        });

        const result = {
            motor_name: motor.motor_name,
            ship_name: motor.ships?.name,
            kw: motor.kw,
            rpm: motor.rpm,
            notes: motor.notes,
            steps: steps,
        }

        return NextResponse.json(result)

    } catch (error) {
        return NextResponse.json({ message: 'Sunucu hatası.' }, { status: 500 })
    }
}

