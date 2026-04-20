import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// ─────────────────────────────────────────────────────────
// Permissões padrão do sistema
// ─────────────────────────────────────────────────────────

export const SYSTEM_PERMISSIONS = [
  // Conversas
  {
    key: 'view_all_conversations',
    description: 'Ver todas as conversas do workspace',
  },
  {
    key: 'assign_conversation',
    description: 'Atribuir conversa a um operador ou equipe',
  },
  {
    key: 'respond_conversation',
    description: 'Responder uma conversa atribuída',
  },
  { key: 'close_conversation', description: 'Fechar e reabrir conversas' },
  {
    key: 'manage_internal_notes',
    description: 'Adicionar notas internas em conversas',
  },
  {
    key: 'initiate_outbound_conversation',
    description: 'Iniciar conversa outbound via template aprovado',
  },

  // Usuários
  {
    key: 'manage_users',
    description: 'Convidar, editar e desativar operadores',
  },

  // Roles
  { key: 'manage_roles', description: 'Criar e editar roles e permissões' },

  // Equipes
  { key: 'manage_teams', description: 'Criar equipes e gerenciar membros' },

  // WhatsApp
  {
    key: 'manage_whatsapp_accounts',
    description: 'Adicionar e remover contas WhatsApp',
  },
  {
    key: 'manage_templates',
    description: 'Gerenciar templates HSM aprovados e sincronização',
  },
  {
    key: 'manage_interactive_templates',
    description: 'Criar e editar templates interativos',
  },
  {
    key: 'manage_quick_replies',
    description: 'Criar e editar respostas rápidas',
  },

  // Contatos
  { key: 'manage_contacts', description: 'Editar e excluir contatos' },

  // Pipeline
  { key: 'manage_pipelines', description: 'Criar e editar pipelines e stages' },

  // Automação
  { key: 'manage_flows', description: 'Criar e editar fluxos de automação' },

  // Workspace
  {
    key: 'manage_workspace_settings',
    description: 'Editar configurações gerais do workspace',
  },
  {
    key: 'manage_follow_up_rules',
    description: 'Criar e editar regras de follow-up automático',
  },
  {
    key: 'view_audit_logs',
    description: 'Visualizar auditoria do workspace',
  },
  {
    key: 'manage_workspace',
    description: 'Acesso amplo às configurações do workspace',
  },

  // Dashboard
  {
    key: 'view_dashboard',
    description: 'Visualizar painel gerencial com métricas da operação',
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  console.log('Criando permissões padrão...');

  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: { key: perm.key },
    });
  }

  console.log(`✔ ${SYSTEM_PERMISSIONS.length} permissões criadas/verificadas`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
