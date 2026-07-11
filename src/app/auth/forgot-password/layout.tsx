import { AuthSplitShell } from '@/components/Auth'

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSplitShell
      heroTitle="Retrouvez l'accès."
      heroSubtitle="Nous vous aidons à récupérer l'accès à votre espace en un instant."
    >
      {children}
    </AuthSplitShell>
  )
}
