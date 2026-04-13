'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bot,
  Kanban,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareMore,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NavRail, ContextSidebar, GlobalSearch } from '@/features/dashboard/components/dashboard-sidebar';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Mobile drawer nav ────────────────────────────────────────────────────────

interface MobileNavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: MobileNavItem[] = [
  { href: '/', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/conversations', label: 'Inbox', icon: MessageSquareMore },
  { href: '/contacts', label: 'Contatos', icon: Users },
  { href: '/crm', label: 'CRM Kanban', icon: Kanban },
  { href: '/automation', label: 'Automação', icon: Bot },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background border-r border-border/70 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">CRM WhatsApp</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="px-3 py-3 border-b border-border/70">
          <GlobalSearch onNavigate={onClose} />
        </div>

        <nav className="flex flex-col gap-1 px-3 py-3 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
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

        <Separator />
        <div className="px-3 py-3">
          <Button variant="outline" className="w-full justify-start" onClick={logout}>
            <LogOut className="size-4" />
            Sair da operação
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Notificações do browser para novas mensagens
  const activeConvId = pathname.startsWith('/conversations/') ? pathname.split('/')[2] : undefined;
  useBrowserNotifications(activeConvId);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/login');
    }
  }, [token, isLoading, router]);

  if (isLoading || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white px-5 py-4 shadow-sm">
          <LoaderCircle className="size-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop: NavRail + ContextSidebar */}
      <NavRail />
      <ContextSidebar />

      {/* Mobile: top bar + drawer */}
      <div className="flex min-h-0 flex-1 flex-col xl:hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">CRM WhatsApp</span>
          </div>
          <Button variant="outline" size="icon" className="size-8" onClick={() => setDrawerOpen(true)}>
            <Menu className="size-4" />
          </Button>
        </header>
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Desktop main content */}
      <main className="hidden min-h-0 flex-1 overflow-hidden xl:block">{children}</main>
    </div>
  );
}
