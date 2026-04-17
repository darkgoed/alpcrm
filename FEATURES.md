# 🚀 Roadmap de Desenvolvimento: AlpCRM

Este artefato detalha a reestruturação das funcionalidades, correções críticas e o planejamento de novas capacidades para a plataforma.

OBS: Variaveis ou uso de `` citadas nos modulos, são exemplos, utilize oq for melhor para o nosso projeto!

---

## 1. Módulo: Pipelines (Kanban)
*Melhoria na interatividade e controle de governança.*

* **Interatividade Stage-to-Stage:**
    * Implementar funcionalidade de **Drag-and-Drop** (arrastar e soltar) para os cards de contato.
    * Permitir transição bidirecional entre colunas ($Stage \leftrightarrow Stage$).
* **Gestão de Estrutura:**
    * **Permissão por Role:** Apenas usuários com `role` específica podem visualizar os botões de "Adicionar Stage" ou "Criar Pipeline".
    * **CRUD de Stages:** Implementar opções de **Editar** (nome/cor) e **Excluir** estágios e pipelines completos.

## 2. Módulo: Dashboard & Visão Geral
*Foco em BI (Business Intelligence) e monitoramento administrativo.*

* **Controle de Acesso:** Visualização restrita a `roles` de administração/análise.
* **Privacidade Operacional:** Remoção de qualquer funcionalidade de "Abrir/Ver Inbox" para manter o foco em dados, não em atendimento.
* **Novos Indicadores & Gráficos:**
    * **Consumo Financeiro:** Visualização de gastos com API (monitoramento de custos).
    * **Contadores Globais:** Total de atendimentos, proporção Bot vs. Humano e fila de espera em tempo real.
* **Monitoramento Real-time (Três Pilares):**
    1.  **AGENTES:** Cards individuais com Status (online/offline), sessões ativas, filas/tags, TMA (Tempo Médio de Atendimento) e alertas de inatividade.
    2.  **EQUIPES:** Agrupamento por setor (Comercial, Suporte, etc.) com volume de atendimentos e distribuição de carga entre membros.
    3.  **FASES:** Visualização do fluxo operacional (Navegando $\rightarrow$ Espera $\rightarrow$ Atendimento) com identificação de gargalos e tempo de permanência em cada etapa.

## 3. Módulo: Configurações de Segurança & Agentes
*Padronização de acessos e correção de fluxos de criação.*

* **Criação de Agentes & Equipes:**
    * **Bug Fix:** Corrigir erro de submissão no botão "Criar Equipe" e "Criar Agente".
    * **Senha Padrão:** Agentes criados com campo de senha vazio recebem automaticamente o padrão `nome@crm`.
    * **First Login Policy:** Todo agente (com senha padrão ou manual) **deve** ser redirecionado para alteração de senha no primeiro acesso.
* **Segurança (2FA & Senhas):**
    * **UI de Troca:** No menu de configurações, a tela de alteração de senha deve incluir um botão **"Voltar"** e possuir layout de formulário interno (diferente da tela de recuperação externa).
    * **Branding 2FA:** Configurar o `Issuer Name` no QR Code para que apareça automaticamente como **"AlpCRM"** nos aplicativos de autenticação.

## 4. Módulo: Configurações de Workspace & SMTP
*Infraestrutura e usabilidade técnica.*

* **Correção SMTP:**
    * **Bug Fix:** Resolver erro `500 (Internal Server Error)` no endpoint `POST /api/workspaces/settings/test-smtp`.
    * **UX:** Atualizar o placeholder do campo "Usuário" para o formato `email@dominio.com.br`.

## 5. Novo Módulo: Config/Chat
*Centralização de regras de negócio e limpeza da interface de contatos.*

* **Regras de Atendimento:**
    * **Assinatura:** Checkbox para ativar/desativar assinatura do operador em cada mensagem enviada.
    * **Mensagem de Boas-Vindas:** Input para configurar a mensagem automática de atribuição (ex: *"Olá {{contact_name}}, me chamo {{agent_name}} e vou te atender"*).
* **Migração de Funções (Cleanup):**
    * Remover "Nova Tag" e "Importar CSV" do menu lateral de **Contacts**.
    * Centralizar essas funções dentro de **Config/Chat**. O menu de contatos passa a ser apenas para consulta e gestão simples.

## 6. UX: Gestão de Roles & Respostas Rápidas
*Organização visual e suporte ao usuário.*

* **Hierarquia de Roles:** Implementar visualização em **Accordion** (recolhível). As permissões de cada Role só aparecem ao clicar na seta de expansão.
* **Dicionário de Variáveis:** Adicionar legenda técnica em **Respostas Rápidas** e **Config/Chat** listando todas as variáveis disponíveis (ex: `{{contact_name}}`, `{{protocol}}`).

#

## 7. Relatórios & Auditoria
*Extração de dados para gestão estratégica.*

* **Relatório Geral:** Ferramenta de extração (CSV/PDF) baseada nos dados de auditoria.
* **Métricas de Conversa:** Dados de volume, fluxo origem/destino e interações entre agentes para análise de produtividade.

## 8. Visão de Futuro (SaaS & Escalabilidade)
*Novas frentes de monetização e gestão de recursos.*

* **Franquia de Mensagens:**
    * Implementação de limites por Workspace (ex: 30k/mês).
    * Sistema de alertas visuais para o administrador quando o limite for atingido (foco em métricas internas, sem gateway de pagamento nativo).
* **Config/Storage (Gestão de Armazenamento):**
    * Painel centralizador de arquivos (Imagens, Vídeos, Áudios, Documentos).
    * **Filtros Avançados:** Busca por tipo de arquivo, contato ou data.
    * **Políticas de Retenção:** Checkbox para "Apagar arquivos antigos" com seletor de meses para automação da limpeza.

---
