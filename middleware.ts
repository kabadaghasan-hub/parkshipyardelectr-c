import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Middleware ayarları
});

// Kimlik doğrulama kontrolünün çalışacağı yolları tanımlarız.
// Bu ayar, "/" ve "/profile" gibi yolları korur.
// API rotalarının zaten kendi işleyicisi olduğu için buraya eklenmez.
export const config = {
  matcher: [
    /*
     * Tüm yollar:
     * - / ile başlayan
     * - /api/auth hariç (bu NextAuth'un kendisi)
     * - /_next/static, /_next/image, /favicon.ico hariç
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
