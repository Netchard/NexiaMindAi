import { AuthSplitShell } from '@/components/Auth'

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSplitShell
      heroTitle="Bienvenue sur NexiaMind AI."
      heroSubtitle="Toute la connaissance de l'entreprise, en une recherche."
    >
      {children}
    </AuthSplitShell>
  )
}
