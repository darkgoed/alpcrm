Pipelines(kanban):
fazer o contato no pipelines crm kanban ser possivel "arrastar" podendo transitar stage<->stage
somente quem tem "role" permitida, pode adicionar stage e pipeline
ter como excluir e editar stage e pipeline

Dashboard/Visão geral:
Somente quem tem "role" permitida, pode visualizar o visão geral
Deve ter mais graficos, mais dados, pois visão geral é para administração e analisadores
Ideias se possivel: (ter uma visualização de quanto foi gasto pela API)
Não ter nada sobre "abrir/ver inbox"


Config/(Equipe/Time):
Botão de criação de equipes funcionar

Config/Segurança(senhas):
No local de alterar senha, se for alterado pela configuração, deve ter botão voltar e não ser igual ao q acessa pela primeira vez
2FA deve ter qrcode com o codigo e automaticamente aparecer o nome do AlpCRM

Config/Workspace: 
Erro ao enviar teste SMTP: (08ix0v.c-tt4t.js:2  POST https://crm.alpdash.com.br/api/workspaces/settings/test-smtp 500 (Internal Server Error))
No placeholder do "usuario" smtp, deve ser email@dominio

Config/Respostas rapidas:
Deve ter escrito em uma legenda, todas as variaveis q fazem sentido para uma mensagem, ex: {{contact_name}}...

Config/Equipes:
Fazer essa configuração funcionar, o botão de criar equipe não esta criando.

Config/Roles:
Fazer as roles serem encolhidas e somente visualizadas se clicar na seta(menu) da role, para aparecer as permissões

Config/Agentes:
Fazer a configuração de agentes funcionarem, não consigo criar agente
Todo agente criado com senha em branco deve aparecer um padrão tipo "nome@crm" e TODO agente criado em branco ou com senha criada, DEVE alterar a senha no seu primeiro acesso!

Criar um "Config/Chat" para "role" especifico permitido poder acessar. Deve conter:
Checkbox de assinatura de operador em cada mensagem no chat?
Text Input: Mensagem que é enviado para o "lead/contato" quando operador for atribuido, ex: "Bem vindo ao "..." me chamo "nome" e sou eu que vou te atender!" deve conter na legenda, as variaveis para serem utilizadas, ex: {{contact_name}}...
Remover o "Nova Tag" do menu "contacts" e trazer p "Config/Chat" onde pode ser criado tags. Como não tem "Nova Tag", remover tambem o botão salvar
Remover o "Importar CSV" do menu "contacts" e trazer p "Config/Chat" onde poder ser importado se necessario