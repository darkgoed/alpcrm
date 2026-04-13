---
title: "WhatsApp Business Account Official Business Account Status API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-account-official-business-account-status-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## Conta do WhatsApp Business Conta Oficial Status da API de Conta de Negócios

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-account-official-business-account-status-api/v23.0.md/)

API para recuperar informações de status da Conta de Negócios Oficial (OBA) para números de telefone da Conta de Negócios do WhatsApp.

Este endpoint permite que as empresas verifiquem o status da Conta de Negócios Oficial e as mensagens de status relacionadas para seus números de telefone da Conta de Negócios do WhatsApp.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/official\_business\_account](#get-version-phone-number-id-official-business-account) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/official\_business\_account](#post-version-phone-number-id-official-business-account) |

## GET /{Version}/{Phone-Number-ID}/official\_business\_account

Recupere o status da Conta de Negócios Oficial (OBA) e informações relacionadas para um número de telefone de Conta de Negócios do WhatsApp.

Casos de Uso:

- Verificar o status atual de verificação da OBA
- Monitorar o andamento do pedido de OBA
- Recuperar mensagens de status para verificação da conta de negócios
- Validar o status de credibilidade do negócio

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Cache:

As informações de status da OBA podem ser armazenadas em cache por períodos moderados, mas o status pode mudar durante os processos de verificação. Implemente estratégias de invalidação de cache apropriadas.

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/official\_business\_account

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/official_business_account' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "pending_status": {
    "summary": "Pending OBA application",
    "value": {
      "id": "1234567890123456",
      "oba_status": "PENDING",
      "status_message": "Your Official Business Account application is under review"
    }
  },
  "approved_status": {
    "summary": "Approved OBA status",
    "value": {
      "id": "2345678901234567",
      "oba_status": "APPROVED",
      "status_message": "Your Official Business Account has been approved"
    }
  },
  "rejected_status": {
    "summary": "Rejected OBA application",
    "value": {
      "id": "3456789012345678",
      "oba_status": "REJECTED",
      "status_message": "Your Official Business Account application was rejected. Please review the requirements and reapply."
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

Phone-Number-IDstring·obrigatório

Seu ID de número de telefone do WhatsApp Business. Esse ID representa a entidade de status do número de telefone e pode ser obtido na lista de números de telefone da sua conta do WhatsApp Business.

Query Parameters

fieldsstring

Lista separada por vírgulas dos campos a serem incluídos na resposta. Se não especificado, os campos padrão serão retornados (oba\_status, status\_message). Campos disponíveis: oba\_status, status\_message

Respostas

Recupere o status da Conta de Negócios Oficial (OBA) e informações relacionadas para um número de telefone de Conta de Negócios do WhatsApp.

Casos de Uso:

- Verificar o status atual de verificação da OBA
- Monitorar o andamento do pedido de OBA
- Recuperar mensagens de status para verificação da conta de negócios
- Validar o status de credibilidade do negócio

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Cache:

As informações de status da OBA podem ser armazenadas em cache por períodos moderados, mas o status pode mudar durante os processos de verificação. Implemente estratégias de invalidação de cache apropriadas.

200

Status da Conta de Negócios Oficial recuperado com sucesso

Tipo de conteúdo:application/json

Esquema:OfficialBusinessAccountStatus

Mostrar atributos secundários

OfficialBusinessAccountStatus

idstring·obrigatório

Identificador único para o número de telefone da Conta de Negócios do WhatsApp

oba\_statusWhatsAppBusinessAppealStatus·obrigatório

Status de verificação e recurso de Conta de Negócios Oficial

status\_messagestring·obrigatório

Mensagem legível por humanos que descreve o status atual da Conta de Negócios Oficial

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

Não Encontrado - O ID do número de telefone não existe ou não está acessível

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

## POST /{Version}/{Phone-Number-ID}/official\_business\_account

Atualize ou modifique o status da Conta de Negócios Oficial (OBA) para um número de telefone de Conta de Negócios do WhatsApp.

Este endpoint permite que as empresas enviem novas solicitações, cancelem solicitações existentes ou reenviem

após abordar os motivos de rejeição.

Casos de Uso:

- Enviar solicitação inicial de Conta de Negócios Oficial
- Cancelar solicitação de OBA pendente
- Reenviar solicitação de OBA após abordar feedback de rejeição
- Atualizar dados da solicitação para solicitações pendentes

Requisitos de Dados da Solicitação:

Ao enviar ou reenviar uma solicitação de OBA, certas informações comerciais podem ser necessárias

dependendo do status atual e das submissões anteriores.

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam com restrições adicionais nas submissões de solicitações

para prevenir abusos. Use lógica de retry apropriada com backoff exponencial.

Transições de Status:

- As solicitações só podem ser enviadas quando não há uma solicitação ativa
- Cancelamentos são permitidos apenas para solicitações pendentes
- Reenvios são permitidos apenas após rejeição

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/official\_business\_account

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/official_business_account' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "action": "SUBMIT_APPLICATION",
  "application_data": {
    "business_name": "Acme Corporation Ltd",
    "business_description": "Leading provider of innovative business solutions and consulting services",
    "website_url": "https://www.acmecorp.com",
    "contact_email": "business@acmecorp.com"
  }
}'
```

```json
{
  "successful_submission": {
    "summary": "Successful application submission",
    "value": {
      "success": true,
      "message": "Official Business Account application submitted successfully",
      "updated_status": {
        "id": "1234567890123456",
        "oba_status": "PENDING",
        "status_message": "Your Official Business Account application is under review"
      },
      "tracking_id": "oba_req_1234567890abcdef"
    }
  },
  "successful_withdrawal": {
    "summary": "Successful application withdrawal",
    "value": {
      "success": true,
      "message": "Official Business Account application withdrawn successfully",
      "updated_status": {
        "id": "1234567890123456",
        "oba_status": "CANCELLED",
        "status_message": "Official Business Account application has been cancelled"
      },
      "tracking_id": "oba_req_fedcba0987654321"
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

Phone-Number-IDstring·obrigatório

Seu ID de número de telefone do WhatsApp Business. Esse ID representa a entidade de status do número de telefone e pode ser obtido na lista de números de telefone da sua conta do WhatsApp Business.

Corpo da solicitaçãoObrigatório

Solicitação de atualização de status da Conta de Negócios Oficial

Tipo de conteúdo:application/json

Esquema:OfficialBusinessAccountUpdateRequest

Mostrar atributos secundários

OfficialBusinessAccountUpdateRequest

actionOne of "SUBMIT\_APPLICATION", "WITHDRAW\_APPLICATION", "RESUBMIT\_APPLICATION"·obrigatório

Ação a ser realizada no status da Conta de Negócios Oficial

application\_dataobject

Dados adicionais necessários para a aplicação de OBA (se aplicável)

Mostrar atributos secundários

business\_namestring

Nome oficial da empresa para verificação

business\_descriptionstring

Breve descrição das atividades comerciais

website\_urlstring (uri)

URL do site oficial de negócios

contact\_emailstring (email)

E-mail de contato comercial principal

Respostas

Atualize ou modifique o status da Conta de Negócios Oficial (OBA) para um número de telefone de Conta de Negócios do WhatsApp.

Este endpoint permite que as empresas enviem novas solicitações, cancelem solicitações existentes ou reenviem

após abordar os motivos de rejeição.

Casos de Uso:

- Enviar solicitação inicial de Conta de Negócios Oficial
- Cancelar solicitação de OBA pendente
- Reenviar solicitação de OBA após abordar feedback de rejeição
- Atualizar dados da solicitação para solicitações pendentes

Requisitos de Dados da Solicitação:

Ao enviar ou reenviar uma solicitação de OBA, certas informações comerciais podem ser necessárias

dependendo do status atual e das submissões anteriores.

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam com restrições adicionais nas submissões de solicitações

para prevenir abusos. Use lógica de retry apropriada com backoff exponencial.

Transições de Status:

- As solicitações só podem ser enviadas quando não há uma solicitação ativa
- Cancelamentos são permitidos apenas para solicitações pendentes
- Reenvios são permitidos apenas após rejeição

200

Status da Conta Oficial de Negócios atualizado com sucesso

Tipo de conteúdo:application/json

Esquema:OfficialBusinessAccountUpdateResponse

Mostrar atributos secundários

OfficialBusinessAccountUpdateResponse

successboolean·obrigatório

Indica se a operação foi bem-sucedida

messagestring·obrigatório

Mensagem legível por humanos que descreve o resultado da operação

updated\_statusOfficialBusinessAccountStatus

Informações de status da Conta de Negócios Oficial para um número de telefone da Conta de Negócios do WhatsApp

Mostrar atributos secundários

idstring·obrigatório

Identificador único para o número de telefone da Conta de Negócios do WhatsApp

oba\_statusWhatsAppBusinessAppealStatus·obrigatório

Status de verificação e recurso de Conta de Negócios Oficial

status\_messagestring·obrigatório

Mensagem legível por humanos que descreve o status atual da Conta de Negócios Oficial

tracking\_idstring

Identificador único para rastrear o pedido de aplicação/atualização

400

Solicitação Inválida - Parâmetros inválidos, solicitação malformada ou transição de estado inválida

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

Não Encontrado - O ID do número de telefone não existe ou não está acessível

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

409

Conflito - Transição de estado inválida ou solicitação em conflito

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

Entidade Não Processável - A solicitação é válida, mas não pode ser processada devido a regras de negócios.

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

Muitos Pedidos - Limite de taxa excedido ou muitas tentativas de aplicação

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