// app/motor/[motorId]/page.tsx

'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase' // Daha önce oluşturduğumuz Supabase client'ı
import Image from 'next/image'

// Tip Tanımlamaları
interface Step {
  id: number
  step_name: string
  step_order: number
  required_photo: boolean
  is_mandatory: boolean
  completed: boolean
  completed_at: string | null
  motor_step_id: string | null
  photos: { image_url: string }[]
}

interface MotorDetails {
  motor_name: string
  ship_name: string
  steps: Step[]
}

// Renk kodları: Gri → yapılmadı, Mavi → mevcut, Turuncu → tamamlandı
const STEP_COLORS = {
  PENDING: 'bg-dark-card border-gray-600 hover:bg-[#282828]',
  CURRENT: 'bg-park-blue border-park-blue/70 hover:bg-park-blue/90',
  COMPLETED: 'bg-park-orange border-park-orange/70',
}

const MotorDetailPage = () => {
  const params = useParams()
  const motorId = params.motorId as string
  const [motorData, setMotorData] = useState<MotorDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [uploading, setUploading] = useState(false)

  // Motor ve adımlarını çekme fonksiyonu
  const fetchMotorDetails = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    // API Route çağrılacak: /api/motor/get
    const response = await fetch(`/api/motor/get?id=${motorId}`)
    const data = await response.json()

    if (response.ok) {
        setMotorData(data)
        
        // Mevcut adımı bul: Tamamlanmamış ilk adım
        const completedCount = data.steps.filter((s: Step) => s.completed).length
        setCurrentStepIndex(completedCount)
    } else {
        setError(data.message || 'Motor detayları çekilemedi.')
    }
    setLoading(false)
  }, [motorId])

  useEffect(() => {
    if (motorId) {
      fetchMotorDetails()
    }
  }, [motorId, fetchMotorDetails])
  
  
  // Step Tamamlama Fonksiyonu
  const completeStep = async (step: Step) => {
    if (step.completed) return // Zaten tamamlanmışsa bir şey yapma

    // Zorunlu fotoğraf kontrolü:
    // 1. Adım zorunlu olmalı VEYA zorunlu fotoğrafı olmalı
    // 2. Fakat henüz fotoğraf yüklenmemiş olmalı
    if (step.is_mandatory || step.required_photo) {
        // Eğer motor_step_id var ve fotoğraf yoksa veya direkt required_photo ise
        const hasPhotos = step.photos && step.photos.length > 0;

        if (step.required_photo && !hasPhotos) {
            alert('Bu adımı tamamlamak için önce zorunlu fotoğrafı yüklemelisiniz!')
            return
        }
    }
    
    // Technician ID'sini burada session'dan almalısın! (Örn: 'TECH_UUID_FROM_SESSION')
    const technicianId = 'TECH_UUID_FOR_DEMO' 

    const response = await fetch('/api/motor/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        motorId, 
        stepId: step.id, 
        technicianId: technicianId 
      }),
    })

    if (response.ok) {
        await fetchMotorDetails() // Verileri yeniden çek
    } else {
        alert('Adım tamamlama başarısız oldu: ' + (await response.json()).message)
    }
  }

  // Fotoğraf Yükleme Fonksiyonu
  const handlePhotoUpload = async (step: Step, file: File) => {
    setUploading(true)
    try {
        // 1. Supabase Storage'a yükle (Klasör yapısı: motorId/stepId/timestamp.jpg)
        const fileExt = file.name.split('.').pop()
        const filePath = `${motorId}/${step.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError, data: uploadData } = await supabase.storage
            .from('motor_photos') // Supabase Storage'da bu bucket'ı oluşturmalısın
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/motor_photos/${filePath}`

        // 2. API'ye kaydet (motor_step_id ve image_url)
        const response = await fetch('/api/motor/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                motorId,
                stepId: step.id, 
                imageUrl: publicUrl 
            }),
        })

        if (response.ok) {
            await fetchMotorDetails() // Güncel fotoğraf listesini çek
        } else {
            alert('Fotoğraf veritabanına kaydedilemedi.')
        }

    } catch (error: any) {
        alert('Yükleme hatası: ' + error.message)
    } finally {
        setUploading(false)
    }
  }


  if (loading) return <div className="min-h-screen bg-dark-bg text-white p-6 text-center">Yükleniyor...</div>
  if (error) return <div className="min-h-screen bg-dark-bg text-red-500 p-6 text-center">Hata: {error}</div>
  if (!motorData) return <div className="min-h-screen bg-dark-bg text-gray-400 p-6 text-center">Motor bulunamadı.</div>

  const currentStep = motorData.steps[currentStepIndex]

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4">
      
      {/* BAŞLIK VE BİLGİ */}
      <header className="mb-8 border-b-2 border-park-orange pb-4">
        <h1 className="text-3xl font-extrabold text-park-orange break-words">
            {motorData.motor_name}
        </h1>
        <p className="text-xl font-medium text-park-blue mt-1">
            Gemi: {motorData.ship_name}
        </p>
        <p className="text-sm text-gray-400 mt-2">
            ID: {motorId.substring(0, 8)}...
        </p>
      </header>

      {/* ADIM KARTLARI LİSTESİ */}
      <div className="space-y-4">
        {motorData.steps.map((step, index) => {
            
            // Renk ve durum belirleme
            let status = STEP_COLORS.PENDING;
            if (step.completed) {
                status = STEP_COLORS.COMPLETED;
            } else if (index === currentStepIndex) {
                status = STEP_COLORS.CURRENT;
            }

            const isCurrent = index === currentStepIndex;

            return (
                <div 
                    key={step.id} 
                    className={`p-4 rounded-xl shadow-lg border-2 transition-all duration-300 ${status}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h2 className={`text-xl font-bold ${step.completed ? 'text-white/80 line-through' : 'text-white'}`}>
                            {step.step_order}. {step.step_name}
                        </h2>
                        {step.completed && (
                            <span className="text-park-orange font-bold text-sm">
                                ✔ TAMAMLANDI
                            </span>
                        )}
                    </div>
                    
                    {/* FOTOĞRAF YÜKLEME ALANI */}
                    {(isCurrent && (step.required_photo || step.is_mandatory)) && (
                        <div className="mt-3 p-3 bg-dark-bg/50 rounded-lg border border-park-blue/50">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {step.required_photo ? 'ZORUNLU FOTOĞRAF YÜKLE' : 'Fotoğraf Yükle (İsteğe Bağlı)'}
                            </label>
                            
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`file-upload-${step.id}`}
                                disabled={uploading}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handlePhotoUpload(step, e.target.files[0])
                                    }
                                }}
                            />
                            <div className="flex items-center space-x-3">
                                <label htmlFor={`file-upload-${step.id}`} 
                                    className={`flex items-center justify-center p-3 text-sm font-semibold rounded-lg ${uploading ? 'bg-gray-700' : 'bg-park-blue hover:bg-park-blue/80'} cursor-pointer transition`}
                                >
                                    <Upload className="w-5 h-5 mr-2" />
                                    {uploading ? 'YÜKLENİYOR...' : 'FOTOĞRAF SEÇ'}
                                </label>
                                {step.photos && step.photos.length > 0 && (
                                    <span className="text-green-400 text-sm">
                                        {step.photos.length} Fotoğraf Yüklendi
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* TAMAMLAMA BUTONU */}
                    {(isCurrent || step.completed) && (
                        <button
                            onClick={() => completeStep(step)}
                            disabled={step.completed}
                            className={`w-full mt-4 py-3 font-bold rounded-lg text-lg transition-all ${
                                step.completed 
                                    ? 'bg-park-orange/30 text-white/60 cursor-default' 
                                    : 'bg-park-orange hover:bg-park-orange/80'
                            }`}
                        >
                            {step.completed ? `TAMAMLANDI (${new Date(step.completed_at!).toLocaleDateString('tr-TR')})` : 'BU ADIMI TAMAMLA'}
                        </button>
                    )}

                    {/* YÜKLENEN FOTOĞRAFLARIN ÖNİZLEMESİ (Sadece Örnek) */}
                    {step.photos && step.photos.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {step.photos.map((photo, pIndex) => (
                                <div key={pIndex} className="relative aspect-square overflow-hidden rounded-md">
                                    <Image 
                                        src={photo.image_url} 
                                        alt={`Step Photo ${pIndex + 1}`} 
                                        fill 
                                        sizes="(max-width: 640px) 100vw, 33vw"
                                        style={{objectFit: "cover"}}
                                        className="hover:scale-105 transition duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
        })}
      </div>
    </div>
  )
}

export default MotorDetailPage
// app/motor/[motorId]/page.tsx

'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase' // Daha önce oluşturduğumuz Supabase client'ı
import Image from 'next/image'

// Tip Tanımlamaları
interface Step {
  id: number
  step_name: string
  step_order: number
  required_photo: boolean
  is_mandatory: boolean
  completed: boolean
  completed_at: string | null
  motor_step_id: string | null
  photos: { image_url: string }[]
}

interface MotorDetails {
  motor_name: string
  ship_name: string
  steps: Step[]
}

// Renk kodları: Gri → yapılmadı, Mavi → mevcut, Turuncu → tamamlandı
const STEP_COLORS = {
  PENDING: 'bg-dark-card border-gray-600 hover:bg-[#282828]',
  CURRENT: 'bg-park-blue border-park-blue/70 hover:bg-park-blue/90',
  COMPLETED: 'bg-park-orange border-park-orange/70',
}

const MotorDetailPage = () => {
  const params = useParams()
  const motorId = params.motorId as string
  const [motorData, setMotorData] = useState<MotorDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [uploading, setUploading] = useState(false)

  // Motor ve adımlarını çekme fonksiyonu
  const fetchMotorDetails = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    // API Route çağrılacak: /api/motor/get
    const response = await fetch(`/api/motor/get?id=${motorId}`)
    const data = await response.json()

    if (response.ok) {
        setMotorData(data)
        
        // Mevcut adımı bul: Tamamlanmamış ilk adım
        const completedCount = data.steps.filter((s: Step) => s.completed).length
        setCurrentStepIndex(completedCount)
    } else {
        setError(data.message || 'Motor detayları çekilemedi.')
    }
    setLoading(false)
  }, [motorId])

  useEffect(() => {
    if (motorId) {
      fetchMotorDetails()
    }
  }, [motorId, fetchMotorDetails])
  
  
  // Step Tamamlama Fonksiyonu
  const completeStep = async (step: Step) => {
    if (step.completed) return // Zaten tamamlanmışsa bir şey yapma

    // Zorunlu fotoğraf kontrolü:
    // 1. Adım zorunlu olmalı VEYA zorunlu fotoğrafı olmalı
    // 2. Fakat henüz fotoğraf yüklenmemiş olmalı
    if (step.is_mandatory || step.required_photo) {
        // Eğer motor_step_id var ve fotoğraf yoksa veya direkt required_photo ise
        const hasPhotos = step.photos && step.photos.length > 0;

        if (step.required_photo && !hasPhotos) {
            alert('Bu adımı tamamlamak için önce zorunlu fotoğrafı yüklemelisiniz!')
            return
        }
    }
    
    // Technician ID'sini burada session'dan almalısın! (Örn: 'TECH_UUID_FROM_SESSION')
    const technicianId = 'TECH_UUID_FOR_DEMO' 

    const response = await fetch('/api/motor/complete-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        motorId, 
        stepId: step.id, 
        technicianId: technicianId 
      }),
    })

    if (response.ok) {
        await fetchMotorDetails() // Verileri yeniden çek
    } else {
        alert('Adım tamamlama başarısız oldu: ' + (await response.json()).message)
    }
  }

  // Fotoğraf Yükleme Fonksiyonu
  const handlePhotoUpload = async (step: Step, file: File) => {
    setUploading(true)
    try {
        // 1. Supabase Storage'a yükle (Klasör yapısı: motorId/stepId/timestamp.jpg)
        const fileExt = file.name.split('.').pop()
        const filePath = `${motorId}/${step.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError, data: uploadData } = await supabase.storage
            .from('motor_photos') // Supabase Storage'da bu bucket'ı oluşturmalısın
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/motor_photos/${filePath}`

        // 2. API'ye kaydet (motor_step_id ve image_url)
        const response = await fetch('/api/motor/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                motorId,
                stepId: step.id, 
                imageUrl: publicUrl 
            }),
        })

        if (response.ok) {
            await fetchMotorDetails() // Güncel fotoğraf listesini çek
        } else {
            alert('Fotoğraf veritabanına kaydedilemedi.')
        }

    } catch (error: any) {
        alert('Yükleme hatası: ' + error.message)
    } finally {
        setUploading(false)
    }
  }


  if (loading) return <div className="min-h-screen bg-dark-bg text-white p-6 text-center">Yükleniyor...</div>
  if (error) return <div className="min-h-screen bg-dark-bg text-red-500 p-6 text-center">Hata: {error}</div>
  if (!motorData) return <div className="min-h-screen bg-dark-bg text-gray-400 p-6 text-center">Motor bulunamadı.</div>

  const currentStep = motorData.steps[currentStepIndex]

  return (
    <div className="min-h-screen bg-dark-bg text-white p-4">
      
      {/* BAŞLIK VE BİLGİ */}
      <header className="mb-8 border-b-2 border-park-orange pb-4">
        <h1 className="text-3xl font-extrabold text-park-orange break-words">
            {motorData.motor_name}
        </h1>
        <p className="text-xl font-medium text-park-blue mt-1">
            Gemi: {motorData.ship_name}
        </p>
        <p className="text-sm text-gray-400 mt-2">
            ID: {motorId.substring(0, 8)}...
        </p>
      </header>

      {/* ADIM KARTLARI LİSTESİ */}
      <div className="space-y-4">
        {motorData.steps.map((step, index) => {
            
            // Renk ve durum belirleme
            let status = STEP_COLORS.PENDING;
            if (step.completed) {
                status = STEP_COLORS.COMPLETED;
            } else if (index === currentStepIndex) {
                status = STEP_COLORS.CURRENT;
            }

            const isCurrent = index === currentStepIndex;

            return (
                <div 
                    key={step.id} 
                    className={`p-4 rounded-xl shadow-lg border-2 transition-all duration-300 ${status}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h2 className={`text-xl font-bold ${step.completed ? 'text-white/80 line-through' : 'text-white'}`}>
                            {step.step_order}. {step.step_name}
                        </h2>
                        {step.completed && (
                            <span className="text-park-orange font-bold text-sm">
                                ✔ TAMAMLANDI
                            </span>
                        )}
                    </div>
                    
                    {/* FOTOĞRAF YÜKLEME ALANI */}
                    {(isCurrent && (step.required_photo || step.is_mandatory)) && (
                        <div className="mt-3 p-3 bg-dark-bg/50 rounded-lg border border-park-blue/50">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {step.required_photo ? 'ZORUNLU FOTOĞRAF YÜKLE' : 'Fotoğraf Yükle (İsteğe Bağlı)'}
                            </label>
                            
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`file-upload-${step.id}`}
                                disabled={uploading}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handlePhotoUpload(step, e.target.files[0])
                                    }
                                }}
                            />
                            <div className="flex items-center space-x-3">
                                <label htmlFor={`file-upload-${step.id}`} 
                                    className={`flex items-center justify-center p-3 text-sm font-semibold rounded-lg ${uploading ? 'bg-gray-700' : 'bg-park-blue hover:bg-park-blue/80'} cursor-pointer transition`}
                                >
                                    <Upload className="w-5 h-5 mr-2" />
                                    {uploading ? 'YÜKLENİYOR...' : 'FOTOĞRAF SEÇ'}
                                </label>
                                {step.photos && step.photos.length > 0 && (
                                    <span className="text-green-400 text-sm">
                                        {step.photos.length} Fotoğraf Yüklendi
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* TAMAMLAMA BUTONU */}
                    {(isCurrent || step.completed) && (
                        <button
                            onClick={() => completeStep(step)}
                            disabled={step.completed}
                            className={`w-full mt-4 py-3 font-bold rounded-lg text-lg transition-all ${
                                step.completed 
                                    ? 'bg-park-orange/30 text-white/60 cursor-default' 
                                    : 'bg-park-orange hover:bg-park-orange/80'
                            }`}
                        >
                            {step.completed ? `TAMAMLANDI (${new Date(step.completed_at!).toLocaleDateString('tr-TR')})` : 'BU ADIMI TAMAMLA'}
                        </button>
                    )}

                    {/* YÜKLENEN FOTOĞRAFLARIN ÖNİZLEMESİ (Sadece Örnek) */}
                    {step.photos && step.photos.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {step.photos.map((photo, pIndex) => (
                                <div key={pIndex} className="relative aspect-square overflow-hidden rounded-md">
                                    <Image 
                                        src={photo.image_url} 
                                        alt={`Step Photo ${pIndex + 1}`} 
                                        fill 
                                        sizes="(max-width: 640px) 100vw, 33vw"
                                        style={{objectFit: "cover"}}
                                        className="hover:scale-105 transition duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
        })}
      </div>
    </div>
  )
}

export default MotorDetailPage
// app/admin/motors/page.tsx
import { notFound } from 'next/navigation'
import { PlusCircle, FileText, Trash2, QrCode } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Tip Tanımlamaları
interface MotorDetail {
  id: string
  motor_name: string
  kw: number | null
  rpm: number | null
  notes: string | null
  ships: { name: string } | null
}

async function fetchMotors(): Promise<MotorDetail[]> {
  const { data, error } = await supabase
    .from('motors')
    .select(`id, motor_name, kw, rpm, notes, ships(name)`)
    .order('motor_name', { ascending: true })

  if (error) {
    console.error('Motor verileri çekilemedi:', error)
    return []
  }
  return data || []
}

// *** CLIENT İŞLEVLERİ ***
// NOT: Admin sayfasında CRUD işlemlerini yapmak için client component kullanılması gerekir. 
// Basitlik için server component bırakıp, JS fonksiyonlarını burada tanımlıyoruz.

// Final PDF Raporu İndirme Fonksiyonu
const handleDownloadPDF = (motorId: string, motorName: string) => {
  // /api/report/generate API rotasını çağırarak indirmeyi tetikler
  window.open(`/api/report/generate?id=${motorId}`, '_blank');
}

// QR Kod İndirme Fonksiyonu
const handleDownloadQR = (motorId: string) => {
  // /qr/motor/[motorId] sayfasını açar, buradan çıktı alınabilir.
  window.open(`/qr/motor/${motorId}`, '_blank');
}

export default async function AdminMotorsPage() {
  const motors = await fetchMotors()

  return (
    <div className="text-white">
      <header className="flex justify-between items-center mb-6 border-b border-park-blue pb-4">
        <h1 className="text-3xl font-bold">Motor Yönetimi</h1>
        <button className="flex items-center bg-park-orange hover:bg-park-orange/80 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
          <PlusCircle className="w-5 h-5 mr-2" />
          Yeni Motor Ekle
        </button>
      </header>

      {/* MOTOR LİSTESİ TABLOSU */}
      <div className="bg-dark-card rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gemi / Motor Adı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">kW / RPM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notlar</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {motors.map((motor) => (
              <tr key={motor.id} className="hover:bg-gray-800 transition duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{motor.motor_name}</div>
                  <div className="text-xs text-park-blue">{motor.ships?.name || 'Gemi Yok'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {motor.kw} kW / {motor.rpm} RPM
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {motor.notes || '---'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {/* PDF Raporu İndir */}
                  <button 
                    onClick={() => handleDownloadPDF(motor.id, motor.motor_name)} 
                    className="text-red-500 hover:text-red-400 p-2 rounded-full transition"
                    title="Final PDF Raporu İndir"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  {/* QR Kodu İndir */}
                  <button 
                    onClick={() => handleDownloadQR(motor.id)} 
                    className="text-park-orange hover:text-park-orange/80 p-2 rounded-full transition"
                    title="Motor QR Kodu İndir"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  {/* Sil Butonu (Admin için) */}
                  <button 
                    // onClick={handleDelete(motor.id)} 
                    className="text-gray-500 hover:text-red-600 p-2 rounded-full transition"
                    title="Motoru Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}