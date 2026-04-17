'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  testSmtpSettings,
  updateSettings,
  useWorkspaceSettings,
} from '@/hooks/useWorkspaceSettings';

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(({ key }) => [key, { enabled: key !== 'sat' && key !== 'sun', open: '09:00', close: '18:00' }]),
);

interface DayHours { enabled: boolean; open: string; close: string; }
type BusinessHours = Record<string, DayHours>;

export function WorkspaceSection() {
  const { settings, mutate, isLoading } = useWorkspaceSettings();
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [language, setLanguage] = useState('pt_BR');
  const [logoUrl, setLogoUrl] = useState('');
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [saved, setSaved] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState(false);
  const [smtpFromName, setSmtpFromName] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpMessage, setSmtpMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setTimezone((settings as any).timezone ?? 'America/Sao_Paulo');
      setLanguage((settings as any).language ?? 'pt_BR');
      setLogoUrl((settings as any).logoUrl ?? '');
      setBusinessHours((settings as any).businessHours ?? DEFAULT_HOURS);
      setOutOfHoursMessage((settings as any).outOfHoursMessage ?? '');
      setSmtpHost((settings as any).smtpHost ?? '');
      setSmtpPort((settings as any).smtpPort ? String((settings as any).smtpPort) : '587');
      setSmtpSecure(Boolean((settings as any).smtpSecure));
      setSmtpUser((settings as any).smtpUser ?? '');
      setSmtpPassword('');
      setSmtpPasswordConfigured(Boolean((settings as any).smtpPasswordConfigured));
      setSmtpFromName((settings as any).smtpFromName ?? '');
      setSmtpFromEmail((settings as any).smtpFromEmail ?? '');
    }
  }, [settings]);

  function updateDay(day: string, field: keyof DayHours, value: any) {
    setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({
        timezone,
        language,
        logoUrl: logoUrl || null,
        businessHours,
        outOfHoursMessage: outOfHoursMessage || null,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort.trim() ? parseInt(smtpPort, 10) : null,
        smtpSecure,
        smtpUser: smtpUser || null,
        ...(smtpPassword.trim() ? { smtpPassword } : {}),
        smtpFromName: smtpFromName || null,
        smtpFromEmail: smtpFromEmail || null,
      } as any);
      mutate();
      if (smtpPassword.trim()) {
        setSmtpPasswordConfigured(true);
        setSmtpPassword('');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  async function handleTestSmtp() {
    setTestingSmtp(true);
    setSmtpMessage(null);
    try {
      await testSmtpSettings({
        smtpHost: smtpHost || null,
        smtpPort: smtpPort.trim() ? parseInt(smtpPort, 10) : null,
        smtpSecure,
        smtpUser: smtpUser || null,
        ...(smtpPassword.trim() ? { smtpPassword } : {}),
        smtpFromName: smtpFromName || null,
        smtpFromEmail: smtpFromEmail || null,
      });
      setSmtpMessage('Conexão SMTP validada com sucesso.');
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : 'Não foi possível validar o SMTP.';
      setSmtpMessage(message);
    } finally {
      setTestingSmtp(false);
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-lg" />;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold">Configurações do Workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Identidade, localização e horário de atendimento.
        </p>
      </div>

      {/* Identidade */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Identidade</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fuso horário</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
              <option value="America/Manaus">America/Manaus (AMT)</option>
              <option value="America/Belem">America/Belem (BRT)</option>
              <option value="America/Fortaleza">America/Fortaleza (BRT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Idioma padrão</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="pt_BR">Português (Brasil)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">URL do logo (opcional)</label>
          <Input
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">SMTP do Workspace</h3>
          <p className="text-sm text-muted-foreground">
            Usado para recuperação de senha e outros e-mails transacionais.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Host</label>
            <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.seudominio.com" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Porta</label>
            <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} inputMode="numeric" placeholder="587" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Usuário</label>
            <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="usuario" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Senha</label>
            <Input
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder={smtpPasswordConfigured ? 'Senha já configurada' : 'Senha SMTP'}
            />
            {smtpPasswordConfigured && !smtpPassword ? (
              <p className="text-[11px] text-muted-foreground">A senha atual será mantida se este campo ficar em branco.</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nome do remetente</label>
            <Input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="CRM WhatsApp" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">E-mail remetente</label>
            <Input value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} type="email" placeholder="noreply@empresa.com" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={smtpSecure}
            onChange={(e) => setSmtpSecure(e.target.checked)}
            className="rounded border-input accent-primary"
          />
          Usar conexão segura (SSL/TLS)
        </label>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={handleTestSmtp} disabled={testingSmtp}>
            {testingSmtp ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Testar SMTP
          </Button>
          {smtpMessage ? <p className="text-xs text-muted-foreground">{smtpMessage}</p> : null}
        </div>
      </section>

      <Separator />

      {/* Horário de atendimento */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Horário de Atendimento</h3>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const day = businessHours[key] ?? { enabled: false, open: '09:00', close: '18:00' };
            return (
              <div key={key} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-28 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay(key, 'enabled', e.target.checked)}
                    className="rounded border-input accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
                <Input
                  type="time"
                  value={day.open}
                  onChange={(e) => updateDay(key, 'open', e.target.value)}
                  disabled={!day.enabled}
                  className="w-28 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">até</span>
                <Input
                  type="time"
                  value={day.close}
                  onChange={(e) => updateDay(key, 'close', e.target.value)}
                  disabled={!day.enabled}
                  className="w-28 h-8 text-sm"
                />
              </div>
            );
          })}
        </div>
        <div className="space-y-1 pt-2">
          <label className="text-xs text-muted-foreground">Mensagem fora do horário</label>
          <textarea
            value={outOfHoursMessage}
            onChange={(e) => setOutOfHoursMessage(e.target.value)}
            placeholder="Olá! Nosso horário de atendimento é..."
            rows={3}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving}>
        {saving
          ? <Loader2 className="size-4 animate-spin mr-2" />
          : <Save className="size-4 mr-2" />}
        {saved ? 'Salvo!' : 'Salvar configurações'}
      </Button>
    </div>
  );
}
