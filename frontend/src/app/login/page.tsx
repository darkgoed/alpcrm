import { AuthShell } from '@/features/auth/components/auth-shell';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Acesso seguro"
      title="Entrar no workspace"
      description="Faça login para acompanhar a operação, responder clientes e ajustar automações do seu time."
      footerText="Ainda não tem acesso?"
      footerHref="/register"
      footerLabel="Criar workspace"
    >
      <LoginForm />
    </AuthShell>
  );
}
