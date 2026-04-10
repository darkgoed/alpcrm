'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useWhatsappAccounts,
  createWhatsappAccount,
  updateWhatsappAccount,
  deleteWhatsappAccount,
  testWhatsappConnection,
  type WhatsappAccount,
} from '@/hooks/useWhatsappAccounts';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AccountForm {
  name: string;
  phoneNumber: string;
  metaAccountId: string;
  wabaId: string;
  token: string;
  appSecret: string;
  verifyToken: string;
}

const emptyForm: AccountForm = {
  name: '',
  phoneNumber: '',
  metaAccountId: '',
  wabaId: '',
  token: '',
  appSecret: '',
  verifyToken: '',
};

// ─── Gerador de verify token ──────────────────────────────────────────────────

function generateVerifyToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={handleCopy} title={`Copiar ${label}`}>
      {copied ? <CheckCircle2 className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

// ─── Formulário de nova conta ─────────────────────────────────────────────────

function NewAccountForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<AccountForm>({
    ...emptyForm,
    verifyToken: generateVerifyToken(),
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof AccountForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleTest() {
    if (!form.metaAccountId || !form.token) {
      setTestResult({ ok: false, label: 'Preencha o Phone Number ID e o Access Token' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const info = await testWhatsappConnection(form.metaAccountId, form.token);
      setTestResult({ ok: true, label: `✓ ${info.verified_name} (${info.display_phone_number})` });
    } catch {
      setTestResult({ ok: false, label: 'Falha na conexão — verifique o Phone Number ID e o Token' });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    const required: (keyof AccountForm)[] = ['name', 'phoneNumber', 'metaAccountId', 'wabaId', 'token', 'appSecret', 'verifyToken'];
    for (const f of required) {
      if (!form[f].trim()) {
        setError(`O campo "${f}" é obrigatório`);
        return;
      }
    }
    setSaving(true);
    try {
      await createWhatsappAccount(form);
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/whatsapp/webhook`;

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground">Nova conta WhatsApp</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nome da conta</label>
          <Input placeholder="Ex: Suporte Principal" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Número (formato internacional)</label>
          <Input placeholder="Ex: +5511999999999" value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Phone Number ID</label>
          <Input placeholder="Ex: 123456789012345" value={form.metaAccountId} onChange={(e) => set('metaAccountId', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">WABA ID</label>
          <Input placeholder="Ex: 987654321098765" value={form.wabaId} onChange={(e) => set('wabaId', e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Access Token</label>
          <Input type="password" placeholder="EAA..." value={form.token} onChange={(e) => set('token', e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">App Secret</label>
          <Input type="password" placeholder="App Secret do seu App Meta" value={form.appSecret} onChange={(e) => set('appSecret', e.target.value)} />
        </div>
      </div>

      {/* Webhook info (somente leitura) */}
      <div className="rounded-lg border border-border/70 bg-background p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Configure no painel Meta
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-28 shrink-0">Webhook URL</span>
            <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono truncate">{webhookUrl}</code>
            <CopyButton value={webhookUrl} label="URL do webhook" />
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="size-7">
                <ExternalLink className="size-3.5" />
              </Button>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-28 shrink-0">Verify Token</span>
            <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono truncate">{form.verifyToken}</code>
            <CopyButton value={form.verifyToken} label="verify token" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              title="Gerar novo token"
              onClick={() => set('verifyToken', generateVerifyToken())}
            >
              <Loader2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Verificar conexão */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="size-4 animate-spin" /> : <Wifi className="size-4" />}
          Verificar conexão
        </Button>
        {testResult && (
          <span className={`text-xs font-medium ${testResult.ok ? 'text-green-600' : 'text-destructive'}`}>
            {testResult.label}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? 'Salvando...' : 'Conectar conta'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCreated}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Card de conta existente ──────────────────────────────────────────────────

function AccountCard({ account, onChanged }: { account: WhatsappAccount; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await updateWhatsappAccount(account.id, { isActive: !account.isActive });
      onChanged();
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover a conta "${account.name}"? As conversas existentes não serão afetadas.`)) return;
    setDeleting(true);
    try {
      await deleteWhatsappAccount(account.id);
      onChanged();
    } finally {
      setDeleting(false);
    }
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/whatsapp/webhook`;

  return (
    <div className="rounded-xl border border-border/70 bg-background">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          {account.isActive
            ? <Wifi className="size-4 text-primary" />
            : <WifiOff className="size-4 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{account.name || account.phoneNumber}</p>
          <p className="text-xs text-muted-foreground">{account.phoneNumber}</p>
        </div>
        <Badge variant={account.isActive ? 'success' : 'muted'}>
          {account.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            disabled={toggling}
            onClick={handleToggle}
            title={account.isActive ? 'Desativar' : 'Ativar'}
          >
            {toggling
              ? <Loader2 className="size-4 animate-spin" />
              : account.isActive
                ? <ToggleRight className="size-4 text-primary" />
                : <ToggleLeft className="size-4 text-muted-foreground" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => setExpanded((v) => !v)}
            title="Ver detalhes"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={handleDelete}
            title="Remover conta"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          <Separator />
          <div className="px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Dados para configurar no painel Meta
            </p>
            {[
              { label: 'Webhook URL', value: webhookUrl },
              { label: 'Verify Token', value: account.verifyToken },
              { label: 'Phone Number ID', value: account.metaAccountId },
              { label: 'WABA ID', value: account.wabaId },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
                <code className="flex-1 rounded bg-muted px-2 py-1 text-xs font-mono truncate">{value || '—'}</code>
                {value && <CopyButton value={value} label={label} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────

export function WhatsappAccountsSection() {
  const { accounts, isLoading, mutate } = useWhatsappAccounts();
  const [showForm, setShowForm] = useState(false);

  function handleCreated() {
    void mutate();
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="size-4 text-primary" />
            <CardTitle className="text-base">Contas WhatsApp</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" />
            Adicionar número
          </Button>
        </div>
        <CardDescription>
          Conecte números de WhatsApp Business ao seu workspace. Cada número pode ser atribuído
          a equipes diferentes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {showForm && <NewAccountForm onCreated={handleCreated} />}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : accounts.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <Wifi className="mx-auto mb-3 size-8 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">Nenhum número conectado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Adicione um número do WhatsApp Business para começar a receber mensagens.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} onChanged={() => void mutate()} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
