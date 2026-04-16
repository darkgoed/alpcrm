'use client';

import { useState } from 'react';
import { AlignVerticalJustifyCenter, AlertTriangle, Maximize2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NODE_TYPE_PALETTE: Array<{ key: string; label: string; color: string }> = [
  { key: 'message', label: 'Mensagem', color: '#3b82f6' },
  { key: 'send_template', label: 'Template', color: '#f97316' },
  { key: 'send_interactive', label: 'Interativa', color: '#14b8a6' },
  { key: 'delay', label: 'Delay', color: '#f59e0b' },
  { key: 'wait_for_reply', label: 'Aguardar', color: '#3b82f6' },
  { key: 'branch', label: 'Branch', color: '#8b5cf6' },
  { key: 'tag_contact', label: 'Tag', color: '#10b981' },
  { key: 'move_stage', label: 'Stage', color: '#0ea5e9' },
  { key: 'assign_to', label: 'Atribuir', color: '#ec4899' },
  { key: 'webhook_call', label: 'Webhook', color: '#71717a' },
  { key: 'finalize', label: 'Finalizar', color: '#fb7185' },
];

interface FlowCanvasControlsProps {
  errorCount: number;
  onAutoOrganize: () => void;
  onCenter: () => void;
  onJumpToError: () => void;
}

export function FlowCanvasControls({
  errorCount,
  onAutoOrganize,
  onCenter,
  onJumpToError,
}: FlowCanvasControlsProps) {
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/50 bg-white/90 p-1 shadow-sm backdrop-blur">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 rounded-full px-2.5 text-[11px]"
        onClick={onAutoOrganize}
        title="Reorganizar nós automaticamente"
      >
        <AlignVerticalJustifyCenter className="size-3.5" />
        Auto-organizar
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 rounded-full px-2.5 text-[11px]"
        onClick={onCenter}
        title="Centralizar no canvas"
      >
        <Maximize2 className="size-3.5" />
        Centralizar
      </Button>

      {errorCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 rounded-full bg-destructive/10 px-2.5 text-[11px] font-medium text-destructive hover:bg-destructive/15"
          onClick={onJumpToError}
          title="Ir para o primeiro nó com erro"
        >
          <AlertTriangle className="size-3.5" />
          {errorCount} erro{errorCount > 1 ? 's' : ''}
        </Button>
      )}

      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 rounded-full p-0"
          onClick={() => setLegendOpen((o) => !o)}
          title="Legenda de cores"
        >
          <Palette className="size-3.5" />
        </Button>
        {legendOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setLegendOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-border bg-background p-3 shadow-md">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tipos de nó
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {NODE_TYPE_PALETTE.map((entry) => (
                  <div key={entry.key} className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate">{entry.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
                Clique no nó para editar · Arraste handles para conectar · Duplo clique na conexão para remover
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const MINIMAP_NODE_COLOR: Record<string, string> = Object.fromEntries(
  NODE_TYPE_PALETTE.map((entry) => [entry.key, entry.color]),
);
