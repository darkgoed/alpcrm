'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';

export default function ChangePasswordPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/login');
    }
  }, [token, isLoading, router]);

  if (isLoading || !token) return null;

  return (
    <AuthShell
      eyebrow="Segurança"
      title="Alterar senha"
      description="Defina uma nova senha para continuar acessando o workspace."
      footerText=""
      footerHref=""
      footerLabel=""
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
