import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * session objesini genişletir.
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * user objesini genişletir.
   */
  interface User extends DefaultUser {
    id: string; // Supabase'den gelen ID
  }
}

declare module "next-auth/jwt" {
  /**
   * JWT objesini genişletir.
   */
  interface JWT {
    userId: string; // authOptions'tan eklediğimiz ID
    accessToken?: string;
  }
}4
