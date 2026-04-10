'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2, Mail, UserRound } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const registerSchema = z.object({
  name: z.string().min(2, 'Informe seu nome completo.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
  workspaceName: z.string().min(2, 'Informe o nome da empresa.'),
  workspaceSlug: z
    .string()
    .min(3, 'O slug precisa ter no mínimo 3 caracteres.')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens.'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
  }

  return 'Não foi possível criar o workspace.';
}

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      workspaceName: '',
      workspaceSlug: '',
    },
  });

  const workspaceName = form.watch('workspaceName');

  useEffect(() => {
    const currentSlug = form.getValues('workspaceSlug');
    const nextSlug = slugify(workspaceName);

    if (!currentSlug || currentSlug === slugify(currentSlug)) {
      form.setValue('workspaceSlug', nextSlug, { shouldValidate: true, shouldDirty: true });
    }
  }, [form, workspaceName]);

  async function onSubmit(values: RegisterFormValues) {
    setError(null);

    try {
      await register(values);
      router.push('/');
    } catch (submitError) {
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
                <AlertTitle>Falha no cadastro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu nome</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input {...field} placeholder="João Silva" className="pl-9" autoComplete="name" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="joao@empresa.com" className="pl-9" autoComplete="email" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Crie uma senha segura" autoComplete="new-password" />
                  </FormControl>
                  <FormDescription>Use pelo menos 6 caracteres para começar.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Workspace</p>
                  <p className="text-xs text-muted-foreground">Esses dados identificam sua operação dentro do CRM.</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="workspaceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da empresa</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Atendimento Prime" autoComplete="organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workspaceSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug do workspace</FormLabel>
                      <FormControl>
                        <div className="flex items-center overflow-hidden rounded-md border border-input bg-background shadow-xs focus-within:ring-ring/50 focus-within:ring-[3px]">
                          <span className="border-r border-border bg-muted px-3 py-2 text-sm text-muted-foreground">crm/</span>
                          <Input
                            {...field}
                            className="border-0 shadow-none focus-visible:ring-0"
                            placeholder="atendimento-prime"
                            autoCapitalize="none"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Criando workspace...' : 'Criar workspace'}
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
