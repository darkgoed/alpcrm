---
title: "WhatsApp Business Account - Assigned Users Management API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-account/assigned-users-management-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## Conta do WhatsApp Business - API de Gerenciamento de Usuários Atribuídos

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-account/assigned-users-management-api/v23.0.md/)

API para gerenciar atribuições de usuários e permissões para contas de negócios do WhatsApp.

Este endpoint permite que empresas gerenciem o acesso dos usuários às suas contas de negócios do WhatsApp,

incluindo a listagem de usuários atribuídos, adição de usuários com permissões específicas e remoção do acesso do usuário.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{WhatsApp-Business-Account-ID}/assigned\_users](#get-version-whatsapp-business-account-id-assigned-users) |
| --- | --- |
| POST | [/{Version}/{WhatsApp-Business-Account-ID}/assigned\_users](#post-version-whatsapp-business-account-id-assigned-users) |
| DELETE | [/{Version}/{WhatsApp-Business-Account-ID}/assigned\_users](#delete-version-whatsapp-business-account-id-assigned-users) |

## GET /{Version}/{WhatsApp-Business-Account-ID}/assigned\_users

Recuperar uma lista de usuários atribuídos à Conta de Negócios do WhatsApp com suas permissões e detalhes do usuário. Este endpoint suporta capacidades de paginação e filtragem.

Casos de Uso:

- Auditoria de acesso de usuários à Conta de Negócios do WhatsApp
- Recuperar atribuições de permissões de usuários para conformidade
- Listar todos os usuários com acesso para fins de gerenciamento
- Monitorar padrões de acesso e atribuições de usuários

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Cache:

Os dados de atribuição de usuários podem ser armazenados em cache por curtos períodos, mas as alterações de permissões podem ocorrer com frequência. Implemente estratégias de invalidação de cache apropriadas.

### Sintaxe da solicitação

**GET** /{Version}/{WhatsApp-Business-Account-ID}/assigned\_users

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{WhatsApp-Business-Account-ID}/assigned_users' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "multiple_users": {
    "summary": "Multiple assigned users with different types",
    "value": {
      "data": {
        "0": {
          "id": "1234567890123456",
          "name": "John Smith",
          "business": {
            "id": "9876543210987654",
            "name": "Example Business Inc"
          },
          "user_type": "BUSINESS_USER"
        },
        "1": {
          "id": "2345678901234567",
          "name": "System User Bot",
          "business": {
            "id": "9876543210987654",
            "name": "Example Business Inc"
          },
          "user_type": "SYSTEM_USER"
        }
      },
      "paging": {
        "cursors": {
          "after": "QVFIUjJ5M2wwdmtONVFHbDZAMVQ4OGJBQUFBQQ",
          "before": "QVFIUmx1WTBpMGpJWXprYzVYaVhabW9PVVhF"
        },
        "next": "https://graph.facebook.com/v23.0/1234567890123456/assigned_users?access_token=YOUR_SYSTEM_USER_ACCESS_TOKEN&limit=25&after=QVFIUjJ5M2wwdmtONVFHbDZAMVQ4OGJBQUFBQQ"
      },
      "summary": {
        "total_count": 15
      }
    }
  },
  "single_user": {
    "summary": "Single assigned user",
    "value": {
      "data": {
        "0": {
          "id": "1234567890123456",
          "name": "Jane Doe",
          "user_type": "BUSINESS_USER"
        }
      },
      "summary": {
        "total_count": 1
      }
    }
  }
}
```

Header Parameters

User-Agentstring

A string do agente do usuário que identifica o software do cliente que faz a solicitação.

Authorizationstring·obrigatório

Token de portador para autenticação de API. Isso deve ser um token de acesso válido obtido por meio do fluxo OAuth apropriado ou token de usuário do sistema.

Path Parameters

Versionstring·obrigatório

Versão da Graph API a ser usada para essa solicitação. Determina o comportamento da API e os recursos disponíveis.

WhatsApp-Business-Account-IDstring·obrigatório

Seu ID da Conta do WhatsApp Business. Esse ID é fornecido quando você cria a conta e pode ser encontrado no Gerenciador de Negócios ou por meio das APIs de gerenciamento de contas.

Query Parameters

businessstring·obrigatório

ID da empresa que é proprietária ou tem acesso à Conta de Negócios do WhatsApp.

Este parâmetro é necessário para especificar o contexto empresarial para atribuições de usuários.

fieldsstring

Lista separada por vírgulas dos campos a serem incluídos na resposta. Se não especificado, os campos padrão serão retornados (id, name). Campos disponíveis: id, name, business, user\_type

limitinteger \[min: 1, max: 100\]

Número máximo de usuários atribuídos para retornar por página. O padrão é 25, o máximo é 100.

afterstring

Cursor para paginação. Use isso para obter a próxima página de resultados.

beforestring

Cursor para paginação. Use isso para obter a página anterior de resultados.

Respostas

Recuperar uma lista de usuários atribuídos à Conta de Negócios do WhatsApp com suas permissões e detalhes do usuário. Este endpoint suporta capacidades de paginação e filtragem.

Casos de Uso:

- Auditoria de acesso de usuários à Conta de Negócios do WhatsApp
- Recuperar atribuições de permissões de usuários para conformidade
- Listar todos os usuários com acesso para fins de gerenciamento
- Monitorar padrões de acesso e atribuições de usuários

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Cache:

Os dados de atribuição de usuários podem ser armazenados em cache por curtos períodos, mas as alterações de permissões podem ocorrer com frequência. Implemente estratégias de invalidação de cache apropriadas.

200

Lista de usuários atribuídos recuperada com sucesso

Tipo de conteúdo:application/json

Esquema:AssignedUsersResponse

Mostrar atributos secundários

AssignedUsersResponse

dataarray of AssignedUser·obrigatório

Matriz de usuários atribuídos

Mostrar atributos secundários

data\[\]AssignedUser

Usuário atribuído à Conta de Negócios do WhatsApp com permissões

Mostrar atributos secundários

idstring·obrigatório

Identificador único do usuário atribuído

namestring·obrigatório

Nome de exibição do usuário atribuído

businessBusinessNode

Entidade comercial associada ao usuário

Mostrar atributos secundários

idstring

Identificador único para o negócio

namestring

Nome do negócio

user\_typeAssignedUserType

Tipo de atribuição de usuário

pagingCursorPaging

Informações de paginação baseada em cursor

Mostrar atributos secundários

cursorsobject

Mostrar atributos secundários

beforestring

Cursor apontando para o início da página de dados

afterstring

Cursor apontando para o final da página de dados

nextstring

Ponto de extremidade da API do Graph para a próxima página de resultados

previousstring

Ponto de extremidade da API do Graph para a página anterior de resultados

summaryAssignedUsersSummary

Resumo de informações sobre usuários atribuídos

Mostrar atributos secundários

total\_countinteger

Número total de usuários atribuídos

400

Requisição Inválida - Parâmetros inválidos ou requisição malformada

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

401

Não autorizado - Token de acesso inválido ou ausente

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

403

Proibido - Permissões insuficientes ou acesso negado

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

404

Não Encontrado - O ID da Conta de Negócios do WhatsApp não existe ou não está acessível

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

422

Entidade Não Processável - Parâmetros da solicitação são válidos, mas não podem ser processados

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

429

Muitos Pedidos - Limite de taxa excedido

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

500

Erro Interno do Servidor - Erro inesperado do servidor

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

## POST /{Version}/{WhatsApp-Business-Account-ID}/assigned\_users

Adicione um usuário à Conta de Negócios do WhatsApp com tarefas de permissão especificadas.

Essa operação concede ao usuário acesso para realizar ações específicas na conta com base nas tarefas de permissão fornecidas.

Casos de Uso:

- Conceder acesso do usuário ao gerenciamento da Conta de Negócios do WhatsApp
- Atribuir tarefas de permissão específicas para controle de acesso granular
- Adicionar novos membros da equipe às operações da Conta de Negócios do WhatsApp
- Configurar permissões de usuário para diferentes funções de negócios

Tarefas de Permissão:

Diferentes tarefas de permissão concedem acesso a diferentes recursos da Conta de Negócios do WhatsApp:

- GERENCIAR: Permissões de gerenciamento de conta gerais
- DESENVOLVER: Permissões de desenvolvimento e acesso à API
- GERENCIAR\_MODELOS: Gerenciamento de modelos de mensagem
- GERENCIAR\_TELEFONE: Gerenciamento de números de telefone
- MENSAGEM: Enviar e receber mensagens
- CONTROLE\_TOTAL: Acesso completo a todos os recursos da conta

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

### Sintaxe da solicitação

**POST** /{Version}/{WhatsApp-Business-Account-ID}/assigned\_users

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{WhatsApp-Business-Account-ID}/assigned_users' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'user=2345678901234567' \
  --data-urlencode 'tasks[0]=MANAGE'
```

```json
{
  "success": true
}
```

Header Parameters

User-Agentstring

A string do agente do usuário que identifica o software do cliente que faz a solicitação.

Authorizationstring·obrigatório

Token de portador para autenticação de API. Isso deve ser um token de acesso válido obtido por meio do fluxo OAuth apropriado ou token de usuário do sistema.

Path Parameters

Versionstring·obrigatório

Versão da Graph API a ser usada para essa solicitação. Determina o comportamento da API e os recursos disponíveis.

WhatsApp-Business-Account-IDstring·obrigatório

Seu ID da Conta do WhatsApp Business. Esse ID é fornecido quando você cria a conta e pode ser encontrado no Gerenciador de Negócios ou por meio de APIs de gerenciamento de contas.

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:application/x-www-form-urlencoded

Esquema:object

Mostrar atributos secundários

userstring·obrigatório

User ID of the person to add to the WhatsApp Business Account.

This must be a valid Facebook user ID.

tasksarray of WhatsAppBusinessAccountPermissionTask·obrigatório

Array of permission tasks to grant to the user. These tasks determine

what actions the user can perform on the WhatsApp Business Account.

Mostrar atributos secundários

tasks\[\]WhatsAppBusinessAccountPermissionTask

Tarefas de permissão granular para acesso à conta do WhatsApp Business

Respostas

Adicione um usuário à Conta de Negócios do WhatsApp com tarefas de permissão especificadas.

Essa operação concede ao usuário acesso para realizar ações específicas na conta com base nas tarefas de permissão fornecidas.

Casos de Uso:

- Conceder acesso do usuário ao gerenciamento da Conta de Negócios do WhatsApp
- Atribuir tarefas de permissão específicas para controle de acesso granular
- Adicionar novos membros da equipe às operações da Conta de Negócios do WhatsApp
- Configurar permissões de usuário para diferentes funções de negócios

Tarefas de Permissão:

Diferentes tarefas de permissão concedem acesso a diferentes recursos da Conta de Negócios do WhatsApp:

- GERENCIAR: Permissões de gerenciamento de conta gerais
- DESENVOLVER: Permissões de desenvolvimento e acesso à API
- GERENCIAR\_MODELOS: Gerenciamento de modelos de mensagem
- GERENCIAR\_TELEFONE: Gerenciamento de números de telefone
- MENSAGEM: Enviar e receber mensagens
- CONTROLE\_TOTAL: Acesso completo a todos os recursos da conta

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

200

Usuário adicionado com sucesso à Conta do WhatsApp Business

Tipo de conteúdo:application/json

Esquema:SuccessResponse

Mostrar atributos secundários

SuccessResponse

successboolean·obrigatório

Indica se a operação foi bem-sucedida

400

Requisição Inválida - Parâmetros inválidos ou requisição malformada

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

401

Não autorizado - Token de acesso inválido ou ausente

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

403

Proibido - Permissões insuficientes ou acesso negado

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

404

Não Encontrado - ID da Conta de Negócios do WhatsApp ou ID do Usuário não existe

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

422

Entidade Não Processável - Parâmetros da solicitação são válidos, mas não podem ser processados

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

429

Muitos Pedidos - Limite de taxa excedido

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

500

Erro Interno do Servidor - Erro inesperado do servidor

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

## DELETE /{Version}/{WhatsApp-Business-Account-ID}/assigned\_users

Remover o acesso de um usuário da Conta de Negócios do WhatsApp. Essa operação revoga todas as permissões e direitos de acesso para o usuário especificado na conta.

Casos de Uso:

- Revogar o acesso do usuário quando ele deixa a organização
- Remover concessões de acesso temporárias
- Limpar permissões de usuário para conformidade de segurança
- Gerenciar o ciclo de vida do usuário e controle de acesso

Observações Importantes:

- Essa operação remove TODAS as permissões do usuário nessa Conta de Negócios do WhatsApp
- O usuário perderá acesso a todos os recursos e dados da conta
- Essa ação não pode ser desfeita - o usuário deve ser re-adicionado se o acesso for necessário novamente
- Webhooks podem ser acionados para notificar sobre alterações de acesso do usuário

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

### Sintaxe da solicitação

**DELETE** /{Version}/{WhatsApp-Business-Account-ID}/assigned\_users

Testar

```shell
curl --request DELETE \
  --url 'https://graph.facebook.com/{Version}/{WhatsApp-Business-Account-ID}/assigned_users' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'user=2345678901234567'
```

```json
{
  "success": true
}
```

Header Parameters

User-Agentstring

A string do agente do usuário que identifica o software do cliente que faz a solicitação.

Authorizationstring·obrigatório

Token de portador para autenticação de API. Isso deve ser um token de acesso válido obtido por meio do fluxo OAuth apropriado ou token de usuário do sistema.

Path Parameters

Versionstring·obrigatório

Versão da Graph API a ser usada para essa solicitação. Determina o comportamento da API e os recursos disponíveis.

WhatsApp-Business-Account-IDstring·obrigatório

Seu ID da Conta do WhatsApp Business. Esse ID é fornecido quando você cria a conta e pode ser encontrado no Gerenciador de Negócios ou por meio de APIs de gerenciamento de contas.

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:application/x-www-form-urlencoded

Esquema:object

Mostrar atributos secundários

userstring·obrigatório

User ID of the person to remove from the WhatsApp Business Account.

This must be a valid Facebook user ID that is currently assigned to the account.

Respostas

Remover o acesso de um usuário da Conta de Negócios do WhatsApp. Essa operação revoga todas as permissões e direitos de acesso para o usuário especificado na conta.

Casos de Uso:

- Revogar o acesso do usuário quando ele deixa a organização
- Remover concessões de acesso temporárias
- Limpar permissões de usuário para conformidade de segurança
- Gerenciar o ciclo de vida do usuário e controle de acesso

Observações Importantes:

- Essa operação remove TODAS as permissões do usuário nessa Conta de Negócios do WhatsApp
- O usuário perderá acesso a todos os recursos e dados da conta
- Essa ação não pode ser desfeita - o usuário deve ser re-adicionado se o acesso for necessário novamente
- Webhooks podem ser acionados para notificar sobre alterações de acesso do usuário

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

200

Usuário removido com sucesso da Conta de Negócios do WhatsApp

Tipo de conteúdo:application/json

Esquema:SuccessResponse

Mostrar atributos secundários

SuccessResponse

successboolean·obrigatório

Indica se a operação foi bem-sucedida

400

Requisição Inválida - Parâmetros inválidos ou requisição malformada

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

401

Não autorizado - Token de acesso inválido ou ausente

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

403

Proibido - Permissões insuficientes ou acesso negado

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

404

Não Encontrado - O ID da Conta Comercial do WhatsApp ou o ID do Usuário não existe ou não foi atribuído.

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

422

Entidade Não Processável - Parâmetros da solicitação são válidos, mas não podem ser processados

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

429

Muitos Pedidos - Limite de taxa excedido

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

500

Erro Interno do Servidor - Erro inesperado do servidor

Tipo de conteúdo:application/json

Esquema:GraphAPIError

Mostrar atributos secundários

GraphAPIError

errorobject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Mensagem de erro legível por humanos

typestring·obrigatório

Tipo de categoria de erro

codeinteger·obrigatório

Código de erro numérico

error\_subcodeinteger

Código de suberro mais específico quando disponível

fbtrace\_idstring

Identificador único para depuração e solicitações de suporte com a Meta

is\_transientboolean

Indica se este erro é temporário e a solicitação deve ser repetida

error\_user\_titlestring

Título de erro de fácil uso para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

## Autenticação

| **Esquema** | **Tipo** | **Localização** |
| --- | --- | --- |
| bearerAuth | HTTP Bearer | Header: `Authorization` |

### Exemplos de uso

bearerAuth:

Include `Authorization: Bearer your-token-here` in request headers

### Requisitos de autenticação global

Todos os pontos de extremidade requerem o seguinte:

bearerAuth

Você achou esta página útil?