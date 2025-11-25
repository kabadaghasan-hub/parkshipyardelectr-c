"use client"; // Bu dosyanın Client Component olması ZORUNLUDUR.

import { SessionProvider } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

// SessionProvider, NextAuth oturumunun durumunu tüm alt bileşenlere sağlar.
export default function NextAuthSessionProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
