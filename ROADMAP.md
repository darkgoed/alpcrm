# CRM WhatsApp SaaS — Roadmap de Desenvolvimento

---

## Fase 1 — Base ✅
> Setup da infraestrutura, autenticação e multi-tenant

- [x] Docker instalado (PostgreSQL 16 + Redis 7)
- [x] NestJS scaffolded com todos os módulos
- [x] Prisma v7 + schema completo (todas as tabelas)
- [x] Migration inicial aplicada
- [x] Auth JWT (`/api/auth/register`, `/api/auth/login`)
- [x] Guards JWT + RBAC (PermissionsGuard)
- [x] Multi-tenant: workspace_id em toda a estrutura

---

## Fase 2 — Chat 🔲
> Integração com WhatsApp Cloud API e mensagens em tempo real

- [ ] Webhook para receber mensagens do WhatsApp (`POST /api/whatsapp/webhook`)
- [ ] Identificar workspace + conta WhatsApp pelo número
- [ ] Criar ou buscar contato pelo telefone
- [ ] Criar ou reutilizar conversa ativa
- [ ] Salvar mensagens (texto, imagem, áudio, vídeo, documento)
- [ ] Enviar mensagens pela API do WhatsApp (`POST /api/messages`)
- [ ] Atualizar status da mensagem (sent → delivered → read)
- [ ] WebSocket (Socket.io) para inbox em tempo real

---

## Fase 3 — Operadores 🔲
> Controle de acesso, atribuição e travamento de conversas

- [ ] CRUD de usuários por workspace
- [ ] CRUD de roles e permissões (RBAC customizável)
- [ ] Atribuição de conversa a operador (`assigned_user_id`)
- [ ] Lock de conversa: só operador atribuído responde
- [ ] Admin/Supervisor pode ver todas as conversas
- [ ] Seed de permissões padrão (`view_all_conversations`, `assign_conversation`, `respond_conversation`)

---

## Fase 4 — Teams 🔲
> Organização de operadores em equipes

- [ ] CRUD de equipes por workspace
- [ ] Adicionar/remover usuários de equipes
- [ ] Atribuição de conversa a equipe (`team_id`)
- [ ] Regras de distribuição automática (round-robin)

---

## Fase 5 — Automação 🔲
> Bot com fluxos IF/ELSE, mensagens e delays

- [ ] CRUD de flows por workspace
- [ ] Engine de execução de nós (message → delay → condition)
- [ ] Nó de mensagem: envia texto para o contato
- [ ] Nó de delay: aguarda N segundos antes do próximo nó
- [ ] Nó de condição (IF/ELSE): bifurca o fluxo
- [ ] Bot pausa quando operador humano responde
- [ ] Bot retoma quando conversa é reaberta
- [ ] Estado do contato no flow (`contact_flow_state`)

---

## Fase 6 — Follow-up 🔲
> Filas com BullMQ, delays e encerramento automático

- [ ] Integrar BullMQ + Redis para filas de automação
- [ ] Processar delays de flow via fila (não bloqueante)
- [ ] Follow-up agendado: reenviar mensagem após X horas sem resposta
- [ ] Encerramento automático de conversas inativas
- [ ] Retry automático em falhas de envio ao WhatsApp

---

## Fase 7 — CRM 🔲
> Gestão de contatos, pipeline e kanban

- [ ] CRUD completo de contatos (com tags)
- [ ] CRUD de pipelines e stages por workspace
- [ ] Mover contato entre stages (`contact_pipeline`)
- [ ] Endpoint para ordenar stages (drag-and-drop)
- [ ] Filtros de contatos por tag, stage e equipe

---

## Fase 8 — Extras 🔲
> Funcionalidades avançadas de colaboração

- [ ] Tags: criar, atribuir e filtrar por tags
- [ ] Notas internas na conversa (sender_type = system)
- [ ] @menção de operadores em notas
- [ ] Histórico de conversas encerradas
- [ ] Busca full-text em mensagens e contatos

---

## Fase 9 — Logs e LGPD 🔲
> Auditoria e conformidade

- [ ] Registro em `audit_logs` em todas as ações críticas
- [ ] Listagem de logs por workspace e entidade
- [ ] Exportação de dados do contato (LGPD)
- [ ] Endpoint para apagar dados de contato (LGPD)
- [ ] Retenção configurável de mensagens

---

## Fase 10 — SaaS / Produção 🔲
> Preparação para venda como produto

- [ ] Planos e limites por workspace (usuários, números, mensagens)
- [ ] Onboarding: criação guiada de workspace
- [ ] Domínio customizado por workspace
- [ ] Dashboard de métricas (conversas, tempo de resposta, volume)
- [ ] Deploy com Nginx + SSL + PM2 ou Docker em produção
- [ ] CI/CD básico (GitHub Actions)

---

## Stack

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Backend    | NestJS (Node.js 22)               |
| ORM        | Prisma v7 + adapter-pg            |
| Banco      | PostgreSQL 16                     |
| Cache/Fila | Redis 7 + BullMQ                  |
| Realtime   | Socket.io (WebSocket)             |
| Frontend   | Next.js (React)                   |
| Infra      | Docker Compose (VPS)              |
| Auth       | JWT + RBAC (Roles & Permissions)  |

---

## Comandos rápidos

```bash
# Subir banco + redis
cd /var/www/crm-whatsapp && docker compose up -d

# Backend em modo desenvolvimento
cd /var/www/crm-whatsapp/backend && npm run start:dev

# Nova migration após alterar schema
cd /var/www/crm-whatsapp/backend && npx prisma migrate dev --name descricao

# Visualizar banco no browser
cd /var/www/crm-whatsapp/backend && npx prisma studio
```
