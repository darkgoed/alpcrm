# FEATURES.md - Roadmap de Features

Este arquivo e o roadmap funcional do produto.
Ele existe separado de `ROADMAP.md` porque o `ROADMAP.md` cobre evolucao tecnica, hardening, operacao e prontidao de producao, enquanto este documento cobre features, UX e capacidade de negocio.

## Como usar este arquivo

- Use `FEATURES.md` para futuras funcionalidades, melhorias de UX e expansoes de produto
- Use `ROADMAP.md` para infraestrutura, confiabilidade, compliance tecnico, seguranca e qualidade operacional
- Ao concluir uma feature daqui, atualizar o status neste arquivo

## Legenda

- `[ ]` Nao iniciado
- `[~]` Em andamento ou parcialmente definido
- `[x]` Entregue
- `Prioridade`: `Alta`, `Media`, `Baixa`

## Fase 1 - Pipelines e Kanban Comercial

Status: `[~]`
Prioridade: `Alta`

Objetivo: deixar o CRM visual mais operacional para equipes comerciais e de acompanhamento.

- `[x]` Implementar drag-and-drop de cards entre stages
- `[x]` Permitir transicao bidirecional entre colunas
- `[x]` Restringir criacao de pipeline por role/permissao
- `[x]` Restringir criacao de stage por role/permissao
- `[x]` Editar stage com nome e cor
- `[ ]` Excluir stage
- `[ ]` Excluir pipeline completo
- `[ ]` Refinar governanca visual do modulo de pipeline

## Fase 2 - Dashboard e Visao Gerencial

Status: `[ ]`
Prioridade: `Alta`

Objetivo: transformar o dashboard em uma visao de operacao e BI, sem virar uma inbox paralela.

- `[ ]` Restringir acesso do dashboard a roles administrativas/analiticas
- `[ ]` Remover qualquer CTA de abrir/ver inbox dentro do dashboard
- `[ ]` Exibir consumo financeiro de API
- `[ ]` Exibir total de atendimentos
- `[ ]` Exibir proporcao bot vs humano
- `[ ]` Exibir fila de espera em tempo real
- `[ ]` Criar cards de agentes com status online/offline
- `[ ]` Exibir sessoes ativas por agente
- `[ ]` Exibir filas ou tags associadas ao agente
- `[ ]` Exibir TMA por agente
- `[ ]` Exibir alertas de inatividade operacional
- `[ ]` Criar agrupamento por equipes/setores
- `[ ]` Exibir distribuicao de carga entre membros da equipe
- `[ ]` Criar visao de fases operacionais com gargalos
- `[ ]` Exibir tempo medio por etapa do fluxo

## Fase 3 - Seguranca Operacional e Gestao de Agentes

Status: `[ ]`
Prioridade: `Alta`

Objetivo: padronizar o ciclo de criacao de usuarios operacionais e reduzir friccao em seguranca.

- `[ ]` Corrigir erro de submissao em "Criar Equipe"
- `[ ]` Corrigir erro de submissao em "Criar Agente"
- `[ ]` Aplicar senha padrao automatica quando agente for criado sem senha
- `[ ]` Definir padrao `nome@crm` como fallback de senha inicial
- `[ ]` Forcar troca de senha no primeiro login
- `[ ]` Diferenciar claramente tela interna de troca de senha da tela externa de recuperacao
- `[ ]` Adicionar botao "Voltar" na tela interna de troca de senha
- `[ ]` Ajustar issuer do 2FA para exibir `AlpCRM`

## Fase 4 - Workspace, SMTP e Ajustes Operacionais

Status: `[ ]`
Prioridade: `Media`

Objetivo: corrigir pontos de configuracao do workspace que bloqueiam operacao ou geram suporte desnecessario.

- `[ ]` Corrigir erro `500` em `POST /api/workspaces/settings/test-smtp`
- `[ ]` Ajustar placeholder do campo "Usuario" para `email@dominio.com.br`
- `[ ]` Revisar feedback visual de sucesso/erro no teste SMTP

## Fase 5 - Config/Chat e Centralizacao de Regras

Status: `[ ]`
Prioridade: `Alta`

Objetivo: consolidar regras do atendimento em um modulo unico e limpar o menu de contatos.

- `[ ]` Criar modulo de configuracao de chat
- `[ ]` Adicionar checkbox para ativar/desativar assinatura do operador
- `[ ]` Permitir configurar mensagem automatica de atribuicao
- `[ ]` Suportar variaveis como `{{contact_name}}` e `{{agent_name}}` na mensagem de boas-vindas
- `[ ]` Remover "Nova Tag" do menu lateral de Contacts
- `[ ]` Remover "Importar CSV" do menu lateral de Contacts
- `[ ]` Centralizar criacao de tags em `Config/Chat`
- `[ ]` Centralizar importacao CSV em `Config/Chat`
- `[ ]` Manter Contacts focado em consulta e gestao simples

## Fase 6 - UX de Roles e Dicionario de Variaveis

Status: `[ ]`
Prioridade: `Media`

Objetivo: melhorar legibilidade administrativa e reduzir erro humano no uso de placeholders.

- `[ ]` Exibir roles em formato accordion
- `[ ]` Mostrar permissoes apenas quando a role for expandida
- `[ ]` Adicionar dicionario de variaveis em Respostas Rapidas
- `[ ]` Adicionar dicionario de variaveis em Config/Chat
- `[ ]` Documentar placeholders disponiveis, como `{{contact_name}}` e `{{protocol}}`

## Fase 7 - Relatorios e Auditoria

Status: `[ ]`
Prioridade: `Media`

Objetivo: extrair informacao gerencial a partir da operacao e da trilha de auditoria.

- `[ ]` Criar relatorio geral com exportacao CSV
- `[ ]` Criar relatorio geral com exportacao PDF
- `[ ]` Permitir filtros baseados em dados de auditoria
- `[ ]` Exibir metricas de volume de conversa
- `[ ]` Exibir fluxo origem/destino
- `[ ]` Exibir interacoes entre agentes para analise de produtividade

## Fase 8 - SaaS, Franquia e Storage

Status: `[ ]`
Prioridade: `Baixa`

Objetivo: preparar o produto para controle de consumo e governanca de armazenamento por workspace.

- `[ ]` Implementar limite mensal de mensagens por workspace
- `[ ]` Exibir alerta visual quando o limite for atingido
- `[ ]` Exibir metricas internas de consumo por workspace
- `[ ]` Criar modulo `Config/Storage`
- `[ ]` Centralizar imagens, videos, audios e documentos em um painel unico
- `[ ]` Filtrar arquivos por tipo
- `[ ]` Filtrar arquivos por contato
- `[ ]` Filtrar arquivos por data
- `[ ]` Adicionar politica de retencao com checkbox para apagar arquivos antigos
- `[ ]` Permitir definir quantidade de meses para limpeza automatica

## Regras Especiais

Antes de executar qualquer item da Fase 7 ou da Fase 8, confirmar explicitamente com o usuario.

## Observacoes

- Este documento pode conter features ainda nao validadas tecnicamente
- Quando uma feature daqui exigir base tecnica nova, alinhar a execucao com o `ROADMAP.md`
- Se uma feature mudar arquitetura, refletir a dependencia cruzada entre `FEATURES.md` e `ROADMAP.md`
