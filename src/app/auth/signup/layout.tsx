import { AuthSplitShell } from '@/components/Auth'

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSplitShell
      heroTitle="Rejoignez NexiaMind AI."
      heroSubtitle="Créez votre compte pour accéder à la recherche intelligente."
    >
      {children}
    </AuthSplitShell>
  )
}
