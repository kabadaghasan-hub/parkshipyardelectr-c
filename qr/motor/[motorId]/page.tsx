// app/qr/motor/[motorId]/page.tsx

'use client'
import { useParams } from 'next/navigation';
import { QrCode } from 'lucide-react';
import QRCode from 'qrcode.react'; 

const QRPage = () => {
    const params = useParams();
    const motorId = params.motorId as string;
    
    if (!motorId) {
        return <div className="p-8 text-center text-red-500">Motor ID bulunamadı.</div>;
    }
    
    // Motor detay sayfasına yönlendirecek URL'yi oluştur
    const motorDetailUrl = `${window.location.origin}/motor/${motorId}`;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800 p-8">
            <h1 className="text-3xl font-bold mb-6 flex items-center text-park-blue">
                <QrCode className="w-8 h-8 mr-3" />
                Motor Servis QR Kodu
            </h1>
            
            <div className="bg-white p-6 border-4 border-gray-200 rounded-xl shadow-2xl">
                {/* QR Kod Bileşeni */}
                <QRCode
                    value={motorDetailUrl}
                    size={256}
                    level="H" 
                    includeMargin={true}
                />
            </div> 

[Image of a black and white QR code symbolizing the link to the motor service detail page]


            <p className="mt-6 text-center text-lg font-medium text-gray-700">
                Bu kodu tarayarak motorun servis adımlarına ulaşabilirsiniz.
            </p>
            <p className="text-sm text-gray-500 break-all max-w-lg mt-2">
                URL: {motorDetailUrl}
            </p>

            <button 
                onClick={() => window.print()}
                className="mt-8 bg-park-orange hover:bg-park-orange/90 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-200 print:hidden"
            >
                Yazdır / PDF Olarak Kaydet
            </button>
        </div>
    );
}



export default QRPage;
