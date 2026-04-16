# CRM WhatsApp SaaS — Roadmap de Produção

Este roadmap substitui o anterior.

Objetivo: levar o sistema atual de "chat funcionando com texto" para um WhatsApp CRM pronto para operação real, com novas funções essenciais, confiabilidade, conformidade com a Cloud API e base para escala.

## Estado atual resumido

O sistema já possui:

- autenticação JWT multi-tenant
- RBAC básico
- ingestão de webhook do WhatsApp
- criação de contatos e conversas
- envio de mensagens de texto
- templates básicos
- filas BullMQ
- socket para atualização em tempo real
- UI de inbox, contatos, configurações e automação básica

O sistema ainda não está pronto para produção porque faltam principalmente:

- envio e consumo reais de mídia
- cumprimento completo das regras da WhatsApp Cloud API
- automação avançada
- funções de CRM ainda incompletas
- hardening de segurança
- idempotência e confiabilidade operacional
- observabilidade
- cobertura de testes

---

## Ordem de execução recomendada

Executar nesta ordem:

1. Fase 1 — WhatsApp Cloud API completa
2. Fase 2 — Inbox e CRM operacional
3. Fase 3 — Automação v2
4. Fase 4 — Segurança e isolamento
5. Fase 5 — Confiabilidade de mensageria
6. Fase 6 — Observabilidade e QA
7. Fase 7 — Escala e inteligência operacional

---

## Fase 1 — WhatsApp Cloud API Completa

Status: `CRÍTICO`

Meta: colocar no produto as funções novas mais importantes que ainda faltam no núcleo WhatsApp.

### 1.1 — Mídia outbound real

- [x] Integrar `sendMediaMessage` no fluxo de envio
- [x] Suportar imagem
- [x] Suportar documento
- [x] Suportar áudio
- [x] Suportar vídeo
- [x] Persistir `externalId` da mídia enviada
- [x] Tratar caption corretamente por tipo

### 1.2 — Mídia inbound utilizável

- [x] Baixar mídia da Meta usando media endpoint
- [x] Persistir metadados de mídia
- [x] Armazenar arquivo em storage apropriado
- [x] Gerar URL autenticada para renderização
- [x] Exibir preview/download no frontend
- [x] Mostrar nome do arquivo, tipo MIME e tamanho

### 1.3 — Regras de janela de 24 horas

- [x] Registrar timestamp da última mensagem do contato
- [x] Bloquear mensagem livre fora da janela
- [x] Exigir template aprovado fora da janela
- [x] Explicar bloqueio de sessão na UI

### 1.4 — Templates completos

- [x] Suportar header
- [x] Suportar footer
- [x] Suportar botões
- [x] Suportar media header
- [x] Suportar exemplos de variáveis
- [x] Exibir motivo de rejeição de forma operacional
- [x] Melhorar sincronização de status com a Meta

### 1.5 — Interactive messages

- [x] Suportar reply buttons
- [x] Suportar list messages
- [x] Suportar CTA URL quando aplicável
- [x] Normalizar resposta interativa inbound
- [x] Expor interativos no frontend e em automação

Critério de saída da fase:

- mídia funciona de ponta a ponta
- regras de janela 24h são respeitadas
- templates deixam de ser apenas texto BODY
- mensagens interativas entram no produto

---

## Fase 2 — Inbox e CRM Operacional

Status: `MVP`

Meta: dar ao operador um CRM realmente utilizável no dia a dia.

### 2.1 — Inbox operacional

- [x] Tornar o botão "Atribuir" funcional no thread
- [x] Adicionar modal ou drawer de atribuição
- [x] Mostrar fila/estado da mensagem no composer
- [x] Exibir erro operacional claro em falha de envio
- [x] Adicionar contador de não lidas
- [x] Adicionar presença do operador na conversa
- [x] Adicionar prevenção de colisão entre agentes

### 2.2 — Histórico e contexto

- [x] Exibir timeline completa do contato, não só da conversa atual
- [x] Exibir histórico de conversas encerradas
- [x] Exibir SLA e tempos de resposta
- [x] Exibir última interação do cliente
- [x] Exibir origem do contato e opt-in

### 2.3 — Contact management real

- [x] Adicionar campos customizados
- [x] Adicionar empresa/organização
- [x] Adicionar owner do contato
- [x] Adicionar lifecycle stage
- [x] Adicionar merge de duplicados
- [x] Adicionar notas internas no nível do contato

### 2.4 — Tags, segmentação e pipeline

- [x] Melhorar filtros compostos por tags + pipeline + status
- [x] Adicionar segmentação salva
- [x] Adicionar ações em lote
- [x] Adicionar automação baseada em tags/stages

### 2.5 — Configurações de workspace completas

- [x] Persistir `timezone`
- [x] Persistir `language`
- [x] Persistir `logoUrl`
- [x] Persistir `businessHours`
- [x] Persistir `outOfHoursMessage`
- [x] Aplicar essas configs em follow-up e automação

### 2.6 — Horário comercial

- [x] Respeitar timezone do workspace
- [x] Detectar atendimento fora de horário
- [x] Enviar mensagem automática fora do horário quando configurado
- [x] Evitar follow-up indevido fora de horário

### 2.7 — Opt-in e compliance de outbound

- [x] Modelar consentimento/opt-in por contato
- [x] Registrar origem do consentimento
- [x] Registrar data e evidência
- [x] Implementar opt-out
- [x] Bloquear outbound quando política exigir

Critério de saída da fase:

- operador consegue atender, atribuir, entender contexto e agir sem workarounds

---

## Fase 3 — Automação v2

Status: `MVP+`

Meta: sair do fluxo linear simples e chegar a uma engine utilizável para atendimento automatizado.

### 3.1 — Engine de execução

- [x] Substituir recursão linear por executores de nó
- [x] Persistir histórico de execução
- [x] Tornar retomada via fila determinística
- [x] Garantir cancelamento limpo quando operador assume

### 3.2 — Novos tipos de nó

- [x] Condition real
- [x] Wait for reply
- [x] Branch
- [x] Tag contact
- [x] Move pipeline stage
- [x] Assign team/user
- [x] Send template
- [x] Send interactive message
- [x] Webhook call

### 3.3 — Estado por contato e conversa

- [x] Criar store de variáveis do flow
- [x] Registrar respostas do usuário por etapa
- [x] Permitir reutilização de variáveis em mensagens
- [x] Suportar timeout em espera de resposta

### 3.4 — Triggers avançados

- [x] Trigger por nova conversa
- [x] Trigger por keyword
- [x] Trigger por tag
- [x] Trigger por stage
- [x] Trigger por evento de sistema
- [x] Trigger por template reply/button reply

### 3.5 — UI de flow builder

- [x] Canvas com conexões reais
- [x] Painel lateral por tipo de nó
- [x] Validação visual do flow
- [ ] Simulador/test run
- [x] Publicação versionada

Critério de saída da fase:

- fluxos conseguem bifurcar, esperar resposta e alterar estado do CRM

---

## Fase 4 — Segurança e Isolamento de Tenant

Status: `CRÍTICO`

Meta: corrigir riscos de acesso indevido, configuração insegura e entrada falsa de eventos.

### 4.1 — Endurecimento de autenticação

- [x] Remover fallback de `JWT_SECRET`
- [x] Falhar boot se variáveis críticas não existirem
- [x] Adicionar validação central de configuração de ambiente
- [x] Definir perfis explícitos `development`, `staging`, `production`
- [ ] Adicionar rotação planejada de segredo JWT
- [x] Implementar refresh token
- [x] Implementar revogação de sessão

### 4.2 — Hardening do webhook

- [x] Exigir assinatura válida da Meta em produção
- [x] Proibir bypass silencioso quando `WHATSAPP_APP_SECRET` estiver ausente
- [x] Garantir `rawBody` obrigatório para rota de webhook
- [x] Validar origem esperada do payload
- [x] Registrar tentativas inválidas com contexto suficiente
- [x] Adicionar proteção contra replay de webhook

### 4.3 — RBAC real nas ações sensíveis

- [x] Exigir permissão explícita para atribuir conversa
- [x] Exigir permissão explícita para fechar/reabrir conversa
- [x] Exigir permissão explícita para iniciar conversa outbound
- [x] Exigir permissão explícita para notas internas
- [x] Exigir permissão explícita para ler usuários, roles e times
- [ ] Revalidar autorização no service layer, não só no controller <!-- parcial: conversas sensíveis e envio já revalidam permissão no service; falta expandir para leitura e demais superfícies -->

### 4.4 — Segurança de websocket

- [x] Validar acesso à conversa antes de entrar em `conversation room`
- [x] Restringir eventos por workspace e por autorização real
- [x] Definir CORS/WS origin por ambiente
- [x] Impedir que cliente entre em salas arbitrárias sem checagem

### 4.5 — Segredos e credenciais

- [x] Nunca expor token da Meta no frontend
- [x] Mover "testar conexão WhatsApp" para endpoint backend
- [ ] Definir política de criptografia para tokens armazenados
- [ ] Adicionar rotação de credenciais de conta WhatsApp

Critério de saída da fase:

- nenhuma ação crítica de conversa acessível apenas com login
- webhook aceito somente com validação correta
- nenhum segredo sensível exposto ao browser

---

## Fase 5 — Confiabilidade de Mensageria

Status: `CRÍTICO`

Meta: corrigir ingestão, persistência e envio para operação estável sob retry, falha transitória e duplicidade.

### 5.1 — Idempotência inbound

- [x] Tornar `Message.externalId` único quando presente
- [x] Implementar deduplicação de mensagens recebidas
- [x] Implementar deduplicação de status webhook
- [x] Criar tabela ou mecanismo de receipts de processamento de webhook
- [x] Garantir que retry da Meta não gere mensagem duplicada

### 5.2 — Envio outbound via fila

- [x] Tirar envio Meta do request síncrono do operador
- [x] Criar job outbound de mensagem
- [x] Persistir estado `queued`, `sending`, `sent`, `failed`
- [x] Classificar erros retryable vs não retryable
- [x] Adicionar exponential backoff
- [x] Adicionar dead-letter strategy
- [x] Permitir reenvio manual de mensagens falhadas

### 5.3 — Consistência de estado

- [x] Garantir atualização correta de `lastMessageAt`
- [x] Garantir consistência entre banco, fila e socket
- [x] Emitir socket só após persistência confirmada
- [x] Criar estratégia de recuperação para jobs órfãos

### 5.4 — Meta error handling

- [x] Mapear erros da Cloud API por categoria
- [x] Exibir motivo de falha para operador
- [x] Persistir código e mensagem de erro da Meta
- [x] Diferenciar bloqueio de janela 24h, rate limit, número inválido, token inválido, mídia inválida

### 5.5 — Rate limiting e throughput

- [x] Centralizar cliente de WhatsApp Cloud API
- [x] Implementar controle de taxa por `phone_number_id`
- [x] Implementar retry com jitter
- [x] Preparar fila para bursts por workspace

Critério de saída da fase:

- retries da Meta não duplicam mensagens
- falhas transitórias não dependem de retry manual do operador
- mensagens falhadas têm motivo auditável

---

## Fase 6 — Observabilidade, Testes e Operação

Status: `CRÍTICO`

Meta: operar incidentes e evoluir o produto com segurança.

### 6.1 — Logging estruturado

- [x] Adotar logger estruturado
- [x] Incluir `workspaceId`, `conversationId`, `messageId`, `jobId`
- [x] Correlation ID por request e job
- [x] Logs padronizados para webhook, send, retry e processor

### 6.2 — Error tracking

- [x] Integrar Sentry no backend
- [x] Integrar Sentry no frontend
- [x] Capturar erros por tenant e contexto funcional

### 6.3 — Métricas e health checks

- [x] Endpoint de liveness
- [x] Endpoint de readiness
- [x] Métricas Prometheus
- [x] Métricas de fila BullMQ <!-- parcial: gauge configurado, atualização periódica não implementada -->
- [x] Métricas de throughput de mensagens
- [x] Métricas de erro por tipo

### 6.4 — Testes

- [x] Unit tests para `WhatsappService`
- [x] Unit tests para `MessagesService`
- [x] Unit tests para `ConversationsService`
- [x] Unit tests para `FlowExecutorService`
- [x] Tests de permissão e isolamento de workspace
- [ ] E2E de webhook
- [ ] E2E de outbound text/template/media
- [ ] E2E de follow-up/auto-close

### 6.5 — CI/CD

- [x] Pipeline com lint
- [x] Pipeline com test
- [x] Pipeline com build backend
- [x] Pipeline com build frontend
- [x] Bloqueio de merge em falha
- [ ] Estratégia de deploy com rollback

Critério de saída da fase:

- o sistema é observável, testado e implantável com previsibilidade

---

## Fase 7 — Escala e Inteligência Operacional

Status: `PÓS-MVP`

Meta: preparar o produto para operação maior, integrações e diferenciação funcional.

### 7.1 — Auditoria real

- [ ] Implementar gravação de audit logs
- [ ] Auditar login
- [ ] Auditar alterações de usuários/roles/times
- [ ] Auditar configurações
- [ ] Auditar templates
- [ ] Auditar mudança de conversa

### 7.2 — Segurança corporativa

- [ ] Política de senha
- [ ] Forçar troca de senha no primeiro login de verdade
- [ ] Recuperação de senha
- [ ] Sessões ativas por usuário
- [ ] Revogação de sessões
- [ ] 2FA opcional

### 7.3 — API e integrações

- [ ] API keys por workspace
- [ ] Webhooks outbound para clientes
- [ ] Event delivery com retry
- [ ] Assinatura de webhook do cliente
- [ ] Histórico/replay de eventos
- [ ] Integração com Zapier/n8n

### 7.4 — Escala técnica

- [ ] Separar workers por tipo de fila
- [ ] Escalar websocket separadamente
- [ ] Adicionar rate limit por tenant
- [ ] Adicionar storage externo para mídia
- [ ] Preparar sharding lógico de filas se necessário

### 7.5 — Analytics e SLA

- [ ] Dashboard de volume por workspace
- [ ] Dashboard de SLA
- [ ] Taxa de entrega, leitura e falha
- [ ] Tempo médio de primeira resposta
- [ ] Produtividade por operador/time

### 7.6 — Campanhas e reengajamento

- [ ] Segmentação de audiência
- [ ] Broadcast com templates
- [ ] Controle de opt-out de campanha
- [ ] Agendamento
- [ ] Relatório de campanha

### 7.7 — Assistência inteligente

- [ ] Sugestão de resposta
- [ ] Resumo automático de conversa
- [ ] Classificação de intenção
- [ ] Priorização de atendimento
- [ ] Transcrição de áudio

Critério de saída da fase:

- produto apto para crescimento operacional, integração e diferenciação competitiva

---

## Backlog técnico transversal

Executar ao longo das fases quando fizer sentido:

- [ ] Padronizar cliente da Meta em um provider único
- [ ] Modelar payload completo de mensagem em JSON
- [ ] Revisar índices Prisma para busca e throughput
- [ ] Criar migração para unicidade de `externalId`
- [ ] Revisar limites de upload por tipo de mídia
- [ ] Migrar uploads locais para S3/R2
- [ ] Adicionar versionamento de flows
- [ ] Adicionar feature flags por workspace

---

## Definição de base mínima operacional

Esta seção não significa que o produto estará realmente "production-ready" no sentido pleno.

Mesmo após concluir todos os itens abaixo, isso ainda representa apenas o começo de uma operação mais séria:

- uma base mínima para operar com menos risco
- um núcleo funcional mais confiável
- um ponto de partida para evoluir o produto

Em outras palavras:

- concluir estes itens não encerra o roadmap
- concluir estes itens não significa maturidade total de produto
- concluir estes itens apenas remove os bloqueadores mais graves para a próxima etapa

O sistema só deve ser considerado com uma base mínima operacional quando todos os itens abaixo estiverem concluídos:

- [ ] Segurança crítica concluída
- [ ] Webhook idempotente
- [ ] Outbound via fila com retry
- [ ] Mídia inbound e outbound funcionando
- [ ] Regra de 24h aplicada
- [ ] Templates completos e usáveis
- [ ] Observabilidade implantada
- [ ] Testes de fluxos críticos cobrindo ingestão, envio e isolamento
- [ ] Audit logs sendo gravados
- [ ] Configurações de workspace completas
- [ ] Sem segredo sensível exposto ao frontend
- [ ] Sem bloqueadores críticos de segurança ou confiabilidade

---

## Entrega sugerida por sprint

### Sprint 1

- mídia outbound real
- mídia inbound com download
- renderização de mídia na UI
- regra de 24h

### Sprint 2

- templates completos
- mensagens interativas
- contexto operacional da conversa
- assign UI funcional

### Sprint 3

- campos de contato e contexto CRM
- settings completos do workspace
- horário comercial
- automação com novos nós prioritários

### Sprint 4

- hardening JWT
- hardening webhook
- RBAC em conversas
- endpoint backend para testar conta Meta

### Sprint 5

- idempotência inbound
- outbound via fila
- persistência de erro Meta
- reenvio manual

### Sprint 6

- observabilidade
- testes críticos
- CI/CD

### Sprint 7

- API keys
- webhooks para clientes
- auditoria real
- segurança corporativa
