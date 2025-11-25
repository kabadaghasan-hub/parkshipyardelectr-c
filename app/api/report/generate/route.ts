// app/api/report/generate/route.ts

import { Document, Page, Text, View, StyleSheet, Image as PDFImage, Font } from '@react-pdf/renderer'
import { PDFDownloadLink } from '@react-pdf/renderer'; // Sadece istemci tarafı için gerekli
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// --- 1. FONTLAR (Opsiyonel, Türkçe karakterler için) ---
// Fontları yüklemek PDF çıktısının düzenli görünmesi için önemlidir.
Font.register({ 
  family: 'Inter', 
  src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FpYtZOBLS3Xk-y3hA.ttf',
})

// --- 2. STİLLER (PDF Dark Mode değil, temiz ve sade olmalı) ---
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#004C99', // Park Tersane Mavi
  },
  logoPlaceholder: {
    width: 100,
    height: 30,
    backgroundColor: '#FF7A00', // Turuncu Placeholder
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004C99',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    color: '#333',
  },
  motorInfo: {
    marginBottom: 10,
    lineHeight: 1.5,
  },
  stepRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 5,
    alignItems: 'center',
  },
  stepName: {
    width: '45%',
  },
  stepDate: {
    width: '30%',
    color: '#FF7A00', // Turuncu
    fontSize: 9,
  },
  stepTech: {
    width: '25%',
    fontSize: 9,
    color: '#004C99', // Mavi
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 20,
    gap: 10, // gap desteği için React PDF'in flexbox modeline dikkat
  },
  photoContainer: {
    width: '30%', // Sayfada 3 fotoğraf yan yana
    height: 200,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  photoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  }
});

// --- 3. RAPOR BİLEŞENİ (React PDF Document) ---
const MaintenanceReport = ({ reportData }: any) => {
    // Sadece tamamlanmış adımları ve fotoğrafları filtrele
    const completedSteps = reportData.steps.filter((s: any) => s.completed)

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* 1. Başlık ve Logo */}
                <View style={styles.header} fixed>
                    <View>
                        <Text style={styles.title}>ELECTRIC MOTOR MAINTENANCE REPORT</Text>
                        <Text style={{ fontSize: 9, color: '#999', marginTop: 3 }}>
                            Park Tersane - İş Emri No: {reportData.motor_id.substring(0, 8)}
                        </Text>
                    </View>
                    {/* Park Tersane logosu buraya yerleştirilecek */}
                    <View style={styles.logoPlaceholder}>
                        <Text>LOGO</Text>
                    </View>
                </View>

                {/* 2. Motor ve Gemi Bilgileri */}
                <Text style={styles.sectionTitle}>MOTOR AND SHIP DETAILS</Text>
                <View style={styles.motorInfo}>
                    <Text>Ship Name: {reportData.ship_name}</Text>
                    <Text>Motor Name: {reportData.motor_name}</Text>
                    <Text>Power (kW): {reportData.kw}</Text>
                    <Text>RPM: {reportData.rpm}</Text>
                    {reportData.notes && <Text>Notes: {reportData.notes}</Text>}
                </View>

                {/* 3. Adım ve Zaman Çizelgesi */}
                <Text style={styles.sectionTitle}>MAINTENANCE STEP TIMELINE</Text>
                {completedSteps.map((step: any, index: number) => (
                    <View key={index} style={styles.stepRow} wrap={false}>
                        <Text style={styles.stepName}>{step.step_order}. {step.step_name}</Text>
                        <Text style={styles.stepDate}>
                            {new Date(step.completed_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.stepTech}>
                           Teknisyen: {step.technician_name}
                        </Text>
                    </View>
                ))}
                
                {/* 4. Yüklenen Fotoğraflar */}
                <Text style={styles.sectionTitle}>UPLOADED PHOTOS</Text>
                
                {completedSteps.filter((s:any) => s.photos && s.photos.length > 0).map((step: any) => (
                    <View key={step.id}>
                        <Text style={styles.photoTitle} break>
                            Adım {step.step_order}: {step.step_name}
                        </Text>
                        <View style={styles.photoGrid}>
                            {step.photos.map((photo: any, pIndex: number) => (
                                // PDF Image, uzaktan URL'den çekilecektir.
                                <View key={pIndex} style={styles.photoContainer}>
                                    <PDFImage src={photo.image_url} />
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Dipnot/Sayfa Numarası */}
                <Text 
                    style={{ position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'right', color: '#999' }} 
                    render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} 
                    fixed
                />
            </Page>
        </Document>
    );
}

// --- 4. API ROUTE FONKSİYONU ---
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const motorId = searchParams.get('id')

    if (!motorId) {
        return NextResponse.json({ message: 'Motor ID gerekli.' }, { status: 400 })
    }

    try {
        // 1. Gerekli tüm veriyi Supabase'den çek
        const { data, error } = await supabase
            .from('motors')
            .select(`
                id, motor_name, kw, rpm, notes, 
                ships(name),
                motor_steps (
                    completed_at, 
                    technicians(name),
                    maintenance_steps(id, step_name, step_order),
                    step_photos(image_url)
                )
            `)
            .eq('id', motorId)
            .single()

        if (error || !data) {
            return NextResponse.json({ message: 'Motor veya ilişkili veriler bulunamadı.' }, { status: 404 })
        }
        
        // 2. Veri Yapısını Rapor için düzenle
        const reportData = {
            motor_id: data.id,
            motor_name: data.motor_name,
            ship_name: data.ships?.name,
            kw: data.kw,
            rpm: data.rpm,
            notes: data.notes,
            steps: data.motor_steps.map((ms: any) => ({
                ...ms.maintenance_steps,
                completed_at: ms.completed_at,
                technician_name: ms.technicians?.name || 'Bilinmiyor',
                photos: ms.step_photos || [],
                completed: !!ms.completed_at
            })).sort((a: any, b: any) => a.step_order - b.step_order)
        }

        // 3. PDF'i Oluştur ve Buffer'a yaz
        const { renderToStream } = await import('@react-pdf/renderer');
        const pdfStream = await renderToStream(<MaintenanceReport reportData={reportData} />);
        
        // 4. Yanıtı PDF olarak geri gönder
        const pdfBuffer = await new Response(pdfStream).arrayBuffer();
        
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ParkTersane_Report_${data.motor_name}.pdf"`,
            },
        })

    } catch (error) {
        console.error('PDF Oluşturma Hatası:', error)
        return NextResponse.json({ message: 'Rapor oluşturulurken sunucu hatası oluştu.' }, { status: 500 })
    }
}