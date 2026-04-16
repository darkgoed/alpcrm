import type { CanvasEdgeDraft } from './flow-canvas';
import type { NodeDraft } from './flow-node-editor';

export function validateFlow(
  nodes: NodeDraft[],
  edges: CanvasEdgeDraft[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (nodes.length === 0) return errors;

  const connectedTargets = new Set(edges.map((edge) => edge.toClientId));

  for (const node of nodes) {
    const config = node.config ?? {};

    if (nodes.length > 1 && !connectedTargets.has(node.clientId)) {
      errors[node.clientId] = 'Nó sem conexão de entrada';
      continue;
    }

    switch (node.type) {
      case 'message':
        if (!String(config.content ?? '').trim()) {
          errors[node.clientId] = 'Texto da mensagem é obrigatório';
        }
        break;
      case 'send_template':
        if (!String(config.templateId ?? config.templateName ?? '').trim()) {
          errors[node.clientId] = 'Template é obrigatório';
        }
        break;
      case 'send_interactive':
        if (!String(config.body ?? '').trim()) {
          errors[node.clientId] = 'Corpo da mensagem é obrigatório';
        }
        break;
      case 'condition':
      case 'branch':
        if (!String(config.field ?? '').trim()) {
          errors[node.clientId] = 'Campo de condição é obrigatório';
        }
        break;
      case 'assign_to':
        if (!config.userId && !config.teamId) {
          errors[node.clientId] = 'Usuário ou time é obrigatório';
        }
        break;
      case 'tag_contact':
        if (!config.tagId && !config.tagName) {
          errors[node.clientId] = 'Tag é obrigatória';
        }
        break;
      case 'webhook_call':
        if (!String(config.url ?? '').trim()) {
          errors[node.clientId] = 'URL do webhook é obrigatória';
        }
        break;
    }
  }

  return errors;
}
