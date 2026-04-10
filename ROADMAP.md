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

## Fase 6 — Follow-up ✅
> Filas com BullMQ, delays e encerramento automático

- [x] Integrar BullMQ + Redis para filas de automação
- [x] Processar delays de flow via fila (não bloqueante)
- [x] Follow-up agendado: reenviar mensagem após X horas sem resposta
- [x] Encerramento automático de conversas inativas
- [x] Retry automático em falhas de envio ao WhatsApp

---

## Fase 7 — CRM ✅
> Gestão de contatos, pipeline e kanban

- [x] CRUD completo de contatos (com tags)
- [x] CRUD de pipelines e stages por workspace
- [x] Mover contato entre stages (`contact_pipeline`)
- [x] Endpoint para ordenar stages (drag-and-drop)
- [x] Filtros de contatos por tag, stage e equipe

---

## Fase 8 — Extras ✅
> Funcionalidades avançadas de colaboração

- [x] Tags: criar, atribuir e filtrar por tags
- [x] Notas internas na conversa (sender_type = system)
- [x] @menção de operadores em notas
- [x] Histórico de conversas encerradas
- [x] Busca full-text em mensagens e contatos

---

Fase 8 continuação — Frontend Unificado 🔨

Antes de avançar para LGPD e SaaS, o frontend precisa ser consolidado com layout correto, design system e componentes reutilizáveis. Esta fase garante consistência visual para todas as próximas etapas.

> **Foco:** frontend. Alterações no backend são permitidas apenas se necessárias para que o frontend funcione corretamente (ex: endpoint faltando, campo ausente na resposta). Não refatorar backend sem necessidade.

**Estado atual analisado (2026-04-09):**
- `globals.css`: CSS variables `:root` completas (cores, radius, sombras) — design tokens OK
- `message-bubble.tsx`: bolhas outgoing/incoming, status icons, nota interna amber — OK
- `conversation-thread.tsx`: header, input com Enter, status de mensagem, painel lateral direito (só dados básicos) — base OK, falta tags/pipeline no painel
- `flow-editor-dialog.tsx`: editor dentro de Dialog/modal, layout 2-col funcional — viewport não estoura, mas precisa virar canvas com painel lateral
- `dashboard-sidebar.tsx`: sidebar principal + GlobalSearch já existem — layout duplo quebrado no `(dashboard)/layout.tsx`
- shadcn/ui: Button, Input, Badge, Avatar, Card, Modal, Toast, ScrollArea, Separator — todos instalados
- Skeleton/Loading: só spinner (`LoaderCircle`) — sem skeleton de lista

**Ordem de execução recomendada:** 8.1 → 8.4 (só skeletons) → 8.2 → 8.3

8.1 — Layout Shell (App Shell) ✅

 [x] Corrigir `(dashboard)/layout.tsx`: flex-row fixo com NavRail + ContextSidebar + conteúdo
 [x] Sidebar secundário contextual (lista de conversas) ao lado do principal
 [x] Layout: `sidebar-nav (64px) | sidebar-context (300px) | main-content (flex-1)`
 [x] Ambos os sidebars com `height: 100vh` e scroll interno independente
 [x] Sidebar secundário recolhível em telas menores (drawer mobile)

8.2 — Conversations / Inbox ✅

 [x] Lista de conversas (sidebar-context): avatar, nome, preview, timestamp, badge status
 [x] Filtros por status (aberta, fechada) na barra superior da lista
 [x] Painel lateral direito do thread: tags e stage de pipeline no "Contexto do atendimento"
 [x] Bolhas de mensagem: enviadas (direita, cor primária) e recebidas (esquerda, cinza)
 [x] Header do chat: nome do contato, status e ações (fechar, reabrir)
 [x] Input fixo no rodapé com suporte a Enter para enviar
 [x] Indicador de status por mensagem (enviando, enviado, entregue, lido, falhou)

8.3 — Automação (Canvas) ✅

 [x] Substituir Dialog por página/rota dedicada `/automation/[id]` com layout de canvas
 [x] Canvas com `overflow: auto` e nós em coluna vertical conectada por setas SVG simples
 [x] Toolbar superior: adicionar nó (mensagem / delay), salvar, toggle ativo/inativo
 [x] Painel lateral direito para editar o nó selecionado (inline, sem modal)
 [x] Chips coloridos por tipo: mensagem = azul (`primary`), delay = amarelo (`amber`)

8.4 — Design System Base ✅

 [x] CSS variables globais: cores, espaçamentos, border-radius — `globals.css` OK
 [x] Componentes base: Button, Input, Badge, Avatar, Card, Modal, Toast — shadcn/ui instalados
 [x] Tema claro definido — OK
 [x] Skeleton/Loading para listas assíncronas (lista de conversas, lista de flows)
 [x] Tipografia: consistência de escala verificada entre páginas

Estado atual e gaps críticos (perspectiva de produto)
O sistema tem toda a infraestrutura backend funcionando (Fases 1–8), mas falta a camada de configuração e operação que transforma o código em um produto utilizável. Pense como Chatwoot ou Syngoo: nenhum dos dois funciona sem que o admin configure primeiro a conta WhatsApp, depois crie usuários, depois monte as equipes. A ordem importa.

Fase 9 — Configurações e Conexão WhatsApp (desbloqueador de tudo)

Prioridade máxima. Sem a conta WhatsApp conectada via UI, nenhum atendimento funciona em produção. Hoje isso exige editar banco de dados provavelmente.

9.1 — Tela de conexão WhatsApp Cloud API ✅

Rota: /settings/whatsapp (acesso: manage_workspace)
Campos: display_phone_number, phone_number_id, waba_id, access_token, app_secret
Botão "Verificar conexão" — chama GET https://graph.facebook.com/v18.0/{phoneNumberId} e exibe status
Exibir webhook URL e verify token gerados automaticamente para o admin copiar no painel Meta
Backend: GET/POST/PATCH/DELETE /api/workspaces/whatsapp-accounts — CRUD completo com multi-conta
Schema: adicionados campos wabaId, appSecret, verifyToken, name ao WhatsappAccount
Settings shell com nav lateral unificando /settings e /settings/whatsapp

9.2 — Templates HSM (mensagens pré-aprovadas Meta) ✅

Rota: /settings/templates
CRUD local de templates com campos: name, category (MARKETING/UTILITY/AUTHENTICATION), language, body com variáveis {{1}}, {{2}}
Sincronização com a API da Meta: POST /v18.0/{waba_id}/message_templates
Status de aprovação: PENDING / APPROVED / REJECTED — polling ou webhook de status
Por que é crítico: sem HSM aprovado, o WhatsApp bloqueia mensagens para contatos que não iniciaram conversa nas últimas 24h. Todo fluxo de prospecção depende disso.
Backend: novo módulo templates/ com MessageTemplate no schema Prisma

9.3 — Importação de contatos ✅

Upload CSV com colunas: name, phone (obrigatório), email, tags
Validação de formato de telefone (E.164), deduplicação por workspaceId + phone
Preview antes de confirmar (N novos, M duplicados, K inválidos)
Backend: POST /api/contacts/import/preview + POST /api/contacts/import/confirm com BullMQ (contact-import queue)
Frontend: botão "Importar CSV" na página /contacts, seção inline 3 etapas (upload → preview → sucesso)


Fase 10 — Gestão de Usuários, Roles e Equipes (UI completa)

O backend de RBAC já existe (Fases 3–4). Falta a interface administrativa para o admin do workspace operar sem tocar na API.

10.1 — Cadastro e gestão de agentes

Rota: /settings/agents
Admin cria agente com: nome, e-mail, senha temporária, role inicial
Listar agentes com status (online/offline — via Socket.io), conversas abertas, equipes
Ações: editar, desativar, redefinir senha, reatribuir conversas abertas
Diferença de hoje: hoje existe POST /api/users mas não há tela; o admin precisa usar Postman

10.2 — Editor visual de roles e permissões

Rota: /settings/roles
Criar role com nome customizado (ex: "Supervisor", "Atendimento Nível 1")
Interface de toggle por permissão, agrupadas por domínio:

Conversas: view_all_conversations, assign_conversations, close_conversations
Contatos: manage_contacts, export_contacts
Equipes: manage_teams
Configurações: manage_workspace, manage_flows, manage_roles


Exibir quais agentes têm cada role
Backend: PATCH /api/roles/:id/permissions já existe — só falta a UI

10.3 — Gestão de equipes (UI completa)

Rota: /settings/teams
Criar equipe com nome, descrição, avatar de cor
Adicionar/remover agentes com busca
Configurar: round-robin ativo/inativo, carga máxima por agente
Ver métricas por equipe: conversas abertas, TMA, agentes online


Fase 11 — Inbox operacional (após WA conectado)

Com a Fase 9 concluída, o chat começa a funcionar de verdade. Esta fase adiciona as ferramentas do dia a dia do agente.

11.1 — Iniciar conversa ativa (outbound)

Botão "Nova conversa" na inbox
Selecionar contato (busca) ou digitar número novo
Selecionar template HSM aprovado + preencher variáveis
Enviar e abrir thread imediatamente
Regra de negócio: só HSM pode iniciar conversa fora da janela de 24h — validar no backend antes de enviar

11.2 — Respostas rápidas (canned responses)

Atalho / no input do chat abre painel de busca de respostas prontas
CRUD em /settings/quick-replies: título (interno), texto (com variáveis {{contact_name}}, {{agent_name}})
Backend: novo módulo quick-replies/ com isolamento por workspaceId

11.3 — Envio de mídia no chat

Suporte a: imagem (jpg/png/webp), documento (pdf), áudio (ogg/mp3), sticker
Upload via POST /api/messages com multipart/form-data
Backend: upload para storage (local ou S3) + enviar via messages/media da API Meta
UI: botão de clipe no input, preview antes de enviar


Fase 12 — Painel de configurações unificado

Tudo que o admin precisa sem abrir o banco de dados.

12.1 — Settings do workspace

Nome, logo, fuso horário, idioma padrão
Horário de atendimento: janelas por dia da semana + mensagem automática fora do horário

12.2 — Notificações

Push/som no browser quando chega nova conversa ou mensagem em conversa atribuída
Configurável por agente: quais eventos geram notificação

12.3 — Auditoria

Tabela audit_logs com: actor_id, action, entity_type, entity_id, diff, created_at
Registrar em: login, assign, close, reopen, delete contact, change role, template send
Rota /settings/audit com filtros por data, ator, tipo de entidade


Ordem de execução recomendada
Fase 9 (WA + HSM + Import) → Fase 10 (Usuários/Roles/Equipes UI)
  → Fase 11 (Inbox operacional) → Fase 12 (Settings avançados)
A Fase 9 desbloqueia tudo. Sem ela, nenhum cliente consegue usar o sistema sem intervenção técnica.

Decisões de arquitetura — DEFINIDAS (2026-04-10)

✅ Storage de mídia: local (disk) — pasta uploads/ no servidor. Migrar para S3/R2 futuramente.
✅ Aprovação de HSM: polling via cron (BullMQ scheduler) — sem webhook da Meta por ora.
✅ Multi-número por workspace: múltiplos WhatsappAccount por workspace são suportados. UI e round-robin devem considerar múltiplos números.
✅ Senha temporária de agente: exibir na tela uma única vez após criação + forçar troca de senha no primeiro login (flag must_change_password no User).


Fase FINAL 1 — Logs e LGPD ⬜

 [ ] Registro em audit_logs em todas as ações críticas
 [ ] Listagem de logs por workspace e entidade (filtros por data e tipo)
 [ ] Exportação de dados do contato em JSON/CSV (portabilidade)
 [ ] Endpoint para apagar dados do contato (direito ao esquecimento)
 [ ] Retenção configurável de mensagens por workspace
 [ ] Página de privacidade e consentimento para contatos


Fase FINAL 1.2 — SaaS / Produção ⬜

 [ ] Planos e limites por workspace (usuários, números, volume de mensagens)
 [ ] Onboarding guiado: criação de workspace, conexão WhatsApp, primeiro fluxo
 [ ] Dashboard de métricas: volume de conversas, TMA, taxa de resolução
 [ ] Domínio customizado por workspace (white-label)
 [ ] Deploy com Nginx + SSL + Docker em produção
 [ ] CI/CD com GitHub Actions (lint, test, build, deploy)
 [ ] Monitoramento de erros em produção (Sentry ou similar)