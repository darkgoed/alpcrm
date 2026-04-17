🚀 Roadmap de Desenvolvimento: AlpCRM
Fase 1: Estabilização e Segurança (O que precisa funcionar agora)
Foco: Corrigir bugs críticos de sistema e garantir o acesso seguro.

Config/Workspace (SMTP):

[Bug Fix] Resolver Erro 500 no endpoint test-smtp.

[UX] Atualizar placeholder do usuário para email@dominio.com.

Config/Agentes e Equipes:

[Bug Fix] Reparar botão de criação de equipes e agentes (funcionalidade core).

[Lógica] Implementar senha padrão nome@crm para novos agentes.

[Lógica] Forçar alteração de senha no primeiro login (Flag require_password_change).

Segurança (Senhas e 2FA):

[UX] Ajustar fluxo de "Voltar" na alteração de senha interna (evitar loop de primeiro acesso).

[Branding] Configurar Secret Key do 2FA para exibir automaticamente o nome "AlpCRM" no Google Authenticator/Authy.

Fase 2: Gestão Operacional e UX (Melhorando o dia a dia)
Foco: Tornar a ferramenta utilizável e fluida para o operador.

Pipelines (Kanban):

[Feature] Habilitar Drag-and-Drop (arrastar) entre colunas.

[Permissão] Restringir edição/exclusão de stages e pipelines apenas para roles administrativas.

Config/Roles:

[UI] Implementar visualização em "Accordion" (encolher/expandir) para as permissões de cada role, limpando o visual da tela.

Config/Respostas Rápidas:

[Documentação] Adicionar legenda técnica com as variáveis disponíveis (ex: {{contact_name}}, {{agent_name}}).

Fase 3: Centralização de Configurações (A nova área "Chat")
Foco: Organizar onde o administrador controla o comportamento da ferramenta.

Criação do Menu "Config/Chat":

[Migração] Mover criação de Tags para cá (Remover do menu "Contacts").

[Migração] Mover Importação de CSV para cá (Remover do menu "Contacts").

Funcionalidades de Automação de Chat:

[Feature] Checkbox para "Assinatura do Operador" (anexar nome do agente em cada disparo).

[Feature] Input de "Mensagem de Boas-Vindas/Atribuição" com suporte a variáveis.

Fase 4: Inteligência e Monitoramento (Dashboard Pro)
Foco: Dados para quem decide (Administradores e Analisadores).

Visão Geral (Dashboard):

[Permissão] Acesso restrito via Role.

[Métricas] Gráficos de volume de mensagens, tempo médio de resposta e custos de API.

[Filtro] Remover qualquer acesso direto à Inbox por esta tela (foco em métricas, não leitura).

Monitoramento em Tempo Real:

Agentes: Status online/offline, carga de trabalho e tempo de última interação.

Equipes: Volume por setor e distribuição de carga.

Fases: Identificação de gargalos (onde os contatos ficam parados por mais tempo).

NÃO INICIE NENHUMA ALTERAÇÃO DA FASE 5 ANTES DE ME PERGUNTAR (Posso iniciar a fase 5, suas ideias de features futuros?)

Fase 5: Escalabilidade e Gestão de Recursos (Futuro/SaaS)
Foco: Controle de custos, armazenamento e relatórios avançados.

Config/Storage (Armazenamento):

[Feature] Painel de gestão de arquivos enviados/recebidos.

[Automação] Sistema de limpeza automática (Delete files > X meses).

[Filtros] Exclusão em massa por tipo de arquivo (imagem, áudio, etc) com data.

Sistema de Franquia (Mensageria):

[Métricas] Contador de mensagens por Workspace com teto definido (ex: 30k/mês).

[Alertas] Notificação visual no dashboard quando o limite for atingido (sem bloqueio de gateway, apenas aviso administrativo).

Relatórios Avançados:

[Extração] Exportação de logs de auditoria e métricas de conversas entre agentes (origem/destino).