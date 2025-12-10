import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
// createClient'ı kaldırdık, NextAuth Adapter bunu kendi içinde yapar.

// Supabase URL ve Service Role Key'i .env.local dosyasından alıyoruz.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("HATA: Supabase URL veya Service Role Key tanımlı değil. NextAuth Adapter çalışmayabilir.");
}

export const authOptions: NextAuthOptions = {
  // 1. Adapter: Kullanıcı verilerini Supabase veritabanında saklayacak
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseSecretKey,
  }),
  
  // 2. Secret: NextAuth'un ana gizli anahtarı
  secret: process.env.NEXTAUTH_SECRET,
  
  // 3. Providers (Sağlayıcılar): GitHub
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],

  // 4. Oturum Yönetimi: 'jwt' stratejisi
  session: {
    strategy: "jwt",
  },
  
  // 5. Geri Çağrımlar: JWT ve Session nesnelerine kullanıcı ID'sini ekleriz.
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Yeni oturum açma (sign-in) sırasında
        token.userId = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token.userId) {
        // Session objesine userId'yi ekler
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
