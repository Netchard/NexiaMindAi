import { AuthSplitShell } from '@/components/Auth'

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSplitShell
      heroTitle="Nouveau départ."
      heroSubtitle="Choisissez un mot de passe robuste pour continuer sereinement."
    >
      {children}
    </AuthSplitShell>
  )
}
