import { AuthShell } from '@/features/auth/components/auth-shell';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? null;

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
