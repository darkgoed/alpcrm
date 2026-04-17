import { AuthShell } from '@/features/auth/components/auth-shell';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recuperação"
      title="Recuperar acesso"
      description="Informe seu e-mail para receber um link de redefinição de senha no workspace correspondente."
      footerText="Lembrou sua senha?"
      footerHref="/login"
      footerLabel="Voltar ao login"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
