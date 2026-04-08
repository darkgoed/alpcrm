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

## Fase 2 — Chat ✅
> Integração com WhatsApp Cloud API e mensagens em tempo real

- [x] Webhook para receber mensagens do WhatsApp (`POST /api/whatsapp/webhook`)
- [x] Identificar workspace + conta WhatsApp pelo número (via `meta_account_id`)
- [x] Criar ou buscar contato pelo telefone (upsert por workspace+phone)
- [x] Criar ou reutilizar conversa ativa (status open)
- [x] Salvar mensagens (texto, imagem, áudio, vídeo, documento)
- [x] Enviar mensagens pela API do WhatsApp (`POST /api/messages`)
- [x] Atualizar status da mensagem via webhook de status (sent → delivered → read)
- [x] WebSocket (Socket.io) em `/ws` — rooms por workspace + conversa
- [x] `GET /api/conversations` com filtros (status, team, operador) + RBAC
- [x] `GET /api/conversations/:id` com todas as mensagens
- [x] `PATCH /api/conversations/:id/assign|close|reopen`
- [x] `GET /api/messages?conversationId=` com paginação por cursor

---

## Fase 3 — Operadores ✅
> Controle de acesso, atribuição e travamento de conversas

- [x] CRUD de usuários por workspace (`GET/POST/PATCH /api/users`)
- [x] Convidar operador com role opcional, desativar conta
- [x] Atribuir/remover role de usuário (`POST/DELETE /api/users/:id/roles/:roleId`)
- [x] CRUD de roles por workspace (`GET/POST/DELETE /api/roles`)
- [x] Atualizar permissões da role em lote (`PATCH /api/roles/:id/permissions`)
- [x] Listar permissões do sistema (`GET /api/permissions`)
- [x] 12 permissões padrão seedadas automaticamente
- [x] Role **admin** criada automaticamente no registro com todas as permissões
- [x] Lock de conversa: só operador atribuído responde (ou quem tem `view_all_conversations`)
- [x] Admin/Supervisor vê e responde qualquer conversa
- [x] JWT retorna array `permissions` para o frontend usar

---

## Fase 4 — Teams ✅
> Organização de operadores em equipes

- [x] CRUD de equipes por workspace (`GET/POST/PATCH/DELETE /api/teams`)
- [x] Adicionar/remover membros (`POST/DELETE /api/teams/:id/members/:userId`)
- [x] Atribuição de conversa a equipe via round-robin na chegada do webhook
- [x] Round-robin por menor carga: operador com menos conversas abertas recebe a próxima
- [x] Validação de assinatura `X-Hub-Signature-256` com `WHATSAPP_APP_SECRET`
- [x] Credenciais do app Meta configuradas no `.env`

---

## Fase 5 — Automação ✅
> Bot com fluxos de mensagens e delays

- [x] CRUD de flows por workspace (`GET/POST/PUT/DELETE /api/automation/flows`)
- [x] Toggle ativo/inativo por flow (`PATCH /api/automation/flows/:id/toggle`)
- [x] 3 tipos de gatilho: `new_conversation`, `keyword`, `always`
- [x] Engine de execução de nós encadeados via `next_id`
- [x] Nó de mensagem: envia texto via WhatsApp Cloud API e salva no banco
- [x] Nó de delay: aguarda N segundos antes do próximo nó
- [x] Bot para automaticamente quando operador humano responde
- [x] Estado do contato no flow (`contact_flow_state`) com upsert
- [x] Frontend: página `/automation` com criação/edição/toggle/exclusão de flows
- [x] Sidebar com navegação Inbox ↔ Automação

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

## Infraestrutura de Produção

| Serviço       | Endereço                        |
|---------------|---------------------------------|
| Frontend      | https://crm.alpdash.com.br      |
| Backend API   | https://crm.alpdash.com.br/api  |
| WebSocket     | https://crm.alpdash.com.br/socket.io |
| SSL           | Let's Encrypt (auto-renova)     |

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

# PM2 — gerenciar processos de produção
pm2 list                    # status dos processos
pm2 restart crm-backend     # reiniciar backend
pm2 restart crm-frontend    # reiniciar frontend
pm2 logs crm-backend        # ver logs do backend
```
