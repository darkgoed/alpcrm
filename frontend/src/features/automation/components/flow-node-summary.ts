import {
  Bot,
  Clock3,
  GitBranch,
  MessageSquarePlus,
  MessageSquareText,
  Power,
  Send,
  Tag,
  Webhook,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { FlowNodeType } from '@/hooks/useAutomation';

export interface FlowNodeSummary {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  badgeVariant: 'success' | 'outline' | 'muted';
}

const SUMMARY: Record<FlowNodeType, FlowNodeSummary> = {
  message:          { label: 'Mensagem',            icon: MessageSquareText,  iconClassName: 'text-emerald-600', badgeVariant: 'success' },
  send_template:    { label: 'Enviar template',     icon: Workflow,           iconClassName: 'text-orange-500',  badgeVariant: 'success' },
  send_interactive: { label: 'Mensagem interativa', icon: Send,               iconClassName: 'text-teal-500',    badgeVariant: 'success' },
  delay:            { label: 'Delay',                icon: Clock3,             iconClassName: 'text-sky-600',     badgeVariant: 'outline' },
  wait_for_reply:   { label: 'Aguardar resposta',   icon: MessageSquarePlus,  iconClassName: 'text-blue-500',    badgeVariant: 'outline' },
  branch:           { label: 'Condição',             icon: GitBranch,          iconClassName: 'text-violet-500',  badgeVariant: 'outline' },
  condition:        { label: 'Condição',             icon: GitBranch,          iconClassName: 'text-violet-500',  badgeVariant: 'outline' },
  finalize:         { label: 'Finalizar',            icon: Power,              iconClassName: 'text-rose-500',    badgeVariant: 'muted'   },
  tag_contact:      { label: 'Tag no contato',      icon: Tag,                iconClassName: 'text-emerald-500', badgeVariant: 'outline' },
  move_stage:       { label: 'Mover no pipeline',   icon: Workflow,           iconClassName: 'text-sky-500',     badgeVariant: 'outline' },
  assign_to:        { label: 'Atribuir',             icon: Bot,                iconClassName: 'text-pink-500',    badgeVariant: 'outline' },
  webhook_call:     { label: 'Webhook',              icon: Webhook,            iconClassName: 'text-zinc-500',    badgeVariant: 'outline' },
};

export function getFlowNodeSummary(type: FlowNodeType): FlowNodeSummary {
  return SUMMARY[type] ?? { label: type, icon: Workflow, iconClassName: 'text-muted-foreground', badgeVariant: 'outline' };
}

export function describeFlowNode(type: FlowNodeType, config: Record<string, unknown>): string {
  switch (type) {
    case 'message': {
      const content = typeof config.content === 'string' ? config.content.trim() : '';
      return content || 'Mensagem sem conteúdo';
    }
    case 'delay': {
      const ms = Number(config.ms ?? 0);
      if (!Number.isFinite(ms) || ms <= 0) return 'Sem duração';
      const seconds = Math.round(ms / 1000);
      if (seconds < 60) return `${seconds}s de espera`;
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return `${minutes}min de espera`;
      const hours = Math.round(minutes / 60);
      return `${hours}h de espera`;
    }
    case 'wait_for_reply': {
      const v = typeof config.variableName === 'string' ? config.variableName : 'reply';
      return `Guarda resposta em {{${v}}}`;
    }
    case 'branch':
    case 'condition': {
      const field = typeof config.field === 'string' ? config.field : 'campo';
      const op = typeof config.operator === 'string' ? config.operator : 'eq';
      const value = typeof config.value === 'string' ? config.value : '';
      return `${field} ${op} ${value || '∅'}`.trim();
    }
    case 'tag_contact': {
      const action = config.action === 'remove' ? 'Remove' : 'Adiciona';
      return `${action} tag`;
    }
    case 'move_stage': return config.stageId ? 'Move para stage configurado' : 'Stage não definido';
    case 'assign_to': {
      if (config.teamId) return 'Atribui ao time';
      if (config.userId) return 'Atribui ao agente';
      return 'Round-robin';
    }
    case 'send_template': {
      const name = typeof config.templateName === 'string' ? config.templateName : '';
      return name ? `Template: ${name}` : 'Template não definido';
    }
    case 'send_interactive': {
      const kind = config.interactiveType === 'list' ? 'Lista' : 'Botões';
      return `${kind} interativa`;
    }
    case 'webhook_call': {
      const method = typeof config.method === 'string' ? config.method : 'POST';
      const url = typeof config.url === 'string' ? config.url : '';
      return url ? `${method} ${url}` : 'URL não definida';
    }
    case 'finalize': return 'Encerra o flow';
    default: return '';
  }
}

export const FLOW_TRIGGER_LABELS: Record<
  'new_conversation' | 'keyword' | 'always' | 'tag_applied' | 'stage_changed' | 'button_reply',
  string
> = {
  new_conversation: 'Nova conversa',
  keyword: 'Palavra-chave',
  always: 'Toda mensagem',
  tag_applied: 'Tag aplicada',
  stage_changed: 'Mudança de stage',
  button_reply: 'Resposta de botão',
};
