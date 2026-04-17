'use client';

import { useSearchParams } from 'next/navigation';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthShell
      eyebrow="Recuperação"
      title="Definir nova senha"
      description="Crie uma nova senha para voltar a acessar seu workspace."
      footerText="Preferiu voltar?"
      footerHref="/login"
      footerLabel="Ir para login"
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
