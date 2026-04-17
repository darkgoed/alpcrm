'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres.')
      .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula.')
      .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula.')
      .regex(/[0-9]/, 'Inclua ao menos um número.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: FormValues) {
    if (!token) {
      setError('Token de recuperação ausente.');
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: values.newPassword,
      });
      setSuccess('Senha redefinida com sucesso. Redirecionando para o login...');
      setTimeout(() => router.replace('/login'), 1200);
    } catch (submitError) {
      const message =
        typeof submitError === 'object' &&
        submitError !== null &&
        'response' in submitError &&
        typeof submitError.response === 'object' &&
        submitError.response !== null &&
        'data' in submitError.response &&
        typeof submitError.response.data === 'object' &&
        submitError.response.data !== null &&
        'message' in submitError.response.data &&
        typeof submitError.response.data.message === 'string'
          ? submitError.response.data.message
          : 'Não foi possível redefinir a senha.';
      setError(message);
    }
  }

  return (
    <Card className="border-border/70 bg-white/70 shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {success ? (
              <Alert>
                <AlertTitle>Senha atualizada</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Falha ao redefinir</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input {...field} type="password" className="pl-9" autoComplete="new-password" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Atualizando...' : 'Redefinir senha'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
