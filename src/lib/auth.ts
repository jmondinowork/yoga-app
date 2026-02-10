import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60, // Rafraîchir le token toutes les 24h
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "noreply@example.com",
    }),
  ],
  pages: {
    signIn: "/connexion",
    verifyRequest: "/verification",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Si l'URL est relative, la préfixer avec baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Si l'URL est du même domaine, la garder
      if (new URL(url).origin === baseUrl) return url;
      // Par défaut, rediriger vers /mon-espace
      return `${baseUrl}/mon-espace`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: 'USER' | 'ADMIN' }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'USER' | 'ADMIN';
      }
      return session;
    },
  },
});
