import { AuthShell } from '@/features/auth/components/auth-shell';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Onboarding rápido"
      title="Criar novo workspace"
      description="Cadastre sua operação, gere o slug do ambiente e comece a centralizar conversas no mesmo painel."
      footerText="Já possui acesso?"
      footerHref="/login"
      footerLabel="Fazer login"
      accent="register"
    >
      <RegisterForm />
    </AuthShell>
  );
}
