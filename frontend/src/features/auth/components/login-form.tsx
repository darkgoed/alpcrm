'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
  twoFactorCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string'
      ) {
        return data.message;
      }
    }
  }

  return 'Não foi possível entrar. Tente novamente.';
}

function getErrorCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (
        typeof data === 'object' &&
        data !== null &&
        'code' in data &&
        typeof data.code === 'string'
      ) {
        return data.code;
      }
    }
  }

  return null;
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);

    try {
      const result = await login(
        values.email,
        values.password,
        values.twoFactorCode,
      );
      router.push(result.mustChangePassword ? '/change-password' : '/');
    } catch (submitError) {
      const code = getErrorCode(submitError);
      if (code === 'TWO_FACTOR_REQUIRED' || code === 'TWO_FACTOR_INVALID') {
        setShowTwoFactor(true);
      }
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <Card className="border-border/70 bg-white/70 shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Falha no acesso</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail corporativo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input {...field} type="email" placeholder="voce@empresa.com" autoComplete="email" className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-right">
                    <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80">
                      Esqueci minha senha
                    </Link>
                  </div>
                </FormItem>
              )}
            />

            {showTwoFactor ? (
              <FormField
                control={form.control}
                name="twoFactorCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código 2FA</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        autoComplete="one-time-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Senha</FormLabel>
                    <Link href="/register" className="text-xs font-medium text-primary hover:text-primary/80">
                      Criar workspace
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        type="password"
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        className="pl-9"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Entrando...' : 'Entrar no workspace'}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
