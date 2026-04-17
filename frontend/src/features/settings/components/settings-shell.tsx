'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, Settings2, Wifi, Users, Shield, UsersRound, MessageSquareQuote, Building2, ClipboardList, SquareMousePointer, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const settingsNav = [
  {
    href: '/settings/whatsapp',
    label: 'WhatsApp',
    icon: Wifi,
    permissions: ['manage_whatsapp_accounts', 'manage_workspace'],
  },
  {
    href: '/settings/templates',
    label: 'Templates HSM',
    icon: FileText,
    permissions: ['manage_templates', 'manage_workspace'],
  },
  {
    href: '/settings/interactive-templates',
    label: 'Template Interativo',
    icon: SquareMousePointer,
    permissions: ['manage_interactive_templates', 'manage_workspace'],
  },
  {
    href: '/settings/agents',
    label: 'Agentes',
    icon: Users,
    permissions: ['manage_users'],
  },
  {
    href: '/settings/roles',
    label: 'Roles',
    icon: Shield,
    permissions: ['manage_roles'],
  },
  {
    href: '/settings/teams',
    label: 'Equipes',
    icon: UsersRound,
    permissions: ['manage_teams'],
  },
  {
    href: '/settings/quick-replies',
    label: 'Respostas rápidas',
    icon: MessageSquareQuote,
    permissions: ['manage_quick_replies', 'manage_workspace'],
  },
  {
    href: '/settings/workspace',
    label: 'Workspace',
    icon: Building2,
    permissions: ['manage_workspace_settings', 'manage_workspace'],
  },
  {
    href: '/settings/security',
    label: 'Segurança',
    icon: KeyRound,
  },
  {
    href: '/settings/audit',
    label: 'Auditoria',
    icon: ClipboardList,
    permissions: ['view_audit_logs', 'manage_workspace'],
  },
  {
    href: '/settings',
    label: 'Automações',
    icon: Bot,
    exact: true,
    permissions: [
      'manage_follow_up_rules',
      'manage_workspace_settings',
      'manage_workspace',
    ],
  },
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const visibleNav = settingsNav.filter(
    (item) =>
      !item.permissions || item.permissions.some((permission) => hasPermission(permission)),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/70 px-8 py-6 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="size-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie integrações, automações e preferências do workspace.
        </p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Nav lateral */}
        <nav className="hidden w-52 shrink-0 flex-col gap-1 border-r border-border/70 px-3 py-4 md:flex">
          {visibleNav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
