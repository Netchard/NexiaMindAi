import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/components/Auth/AuthProvider';
import { MainContent } from './MainContent';
import { QueryClientProvider } from '@/providers/QueryClientProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

// Newsreader (serif) — réservé aux titres `hero`/`display` des surfaces Auth/Chat
// (voir DESIGN.md > Typography), jamais au corps de texte.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
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
      <head>
        {/* Preconnect to Google Fonts for better performance - reduces LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload critical Google Fonts files */}
        <link
          rel="preload"
          href="/_next/static/media/geist-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      {/* h-full (pas min-h-screen) : borne le body à la hauteur du viewport
          (comme html ci-dessus) plutôt qu'un plancher sans plafond — sans ça,
          le flex-1/overflow-hidden de MainContent (voir MainContent.tsx) n'a
          aucune hauteur définie contre laquelle se résoudre, et /chat défile
          au niveau de la page entière au lieu de gérer son scroll interne.
          Les autres routes gardent leur scroll de page normal : body reste
          overflow visible (pas hidden), seul /chat clippe explicitement. */}
      <body className="h-full flex flex-col bg-[#0a1524] text-[#eef2f8]">
        <QueryClientProvider>
          <AuthProvider>
            <Navbar />
            <MainContent>{children}</MainContent>
            <Footer />
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
