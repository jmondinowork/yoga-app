import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Yoga Flow — Cours de yoga en ligne",
    template: "%s | Yoga Flow",
  },
  description:
    "Découvrez le yoga à votre rythme avec des cours en ligne accessibles à tous les niveaux. Vinyasa, Hatha, Yin, Méditation et plus encore.",
  keywords: ["yoga", "cours en ligne", "vinyasa", "hatha", "méditation", "bien-être"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Yoga Flow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${cormorant.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
