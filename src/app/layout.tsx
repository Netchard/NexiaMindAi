import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/components/Auth/AuthProvider';
import { MainContent } from './MainContent';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Newsreader (serif) — réservé aux titres `hero`/`display` des surfaces Auth/Chat
// (voir DESIGN.md > Typography), jamais au corps de texte.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NexiaMind AI - Recherche Intelligente",
  description: "Système RAG pour la recherche et l'analyse de documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#0a1524] text-[#eef2f8]">
        <AuthProvider>
          <Navbar />
          <MainContent>{children}</MainContent>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
