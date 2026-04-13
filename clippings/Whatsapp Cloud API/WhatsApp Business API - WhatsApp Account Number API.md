---
title: "WhatsApp Business API - WhatsApp Account Number API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-account-number/whatsapp-account-number-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## API do WhatsApp Business - API do Número da Conta do WhatsApp

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-account-number/whatsapp-account-number-api/v23.0.md/)

API para recuperar detalhes e informações de configuração do número da conta do WhatsApp.

Este endpoint permite que empresas recuperem informações abrangentes sobre seus números de conta do WhatsApp, incluindo status, detalhes de verificação e configurações.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{WhatsApp-Account-Number-ID}](#get-version-whatsapp-account-number-id) |
| --- | --- |

## GET /{Version}/{WhatsApp-Account-Number-ID}

Recupere detalhes abrangentes sobre um Número de Conta do WhatsApp, incluindo seu status atual, informações de verificação, classificação de qualidade e configurações.

Casos de Uso:

- Monitorar o status e a classificação de qualidade do número da conta
- Verificar a configuração do número da conta antes das operações de mensagens
- Verificar o status de verificação e aprovação
- Recuperar o nome de exibição e informações do perfil comercial

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Cache:

Os detalhes do número da conta podem ser armazenados em cache por curtos períodos, mas as informações de status podem mudar com frequência. Implemente estratégias de invalidação de cache apropriadas.

### Sintaxe da solicitação

**GET** /{Version}/{WhatsApp-Account-Number-ID}

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{WhatsApp-Account-Number-ID}' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "verified_account_number": {
    "summary": "Verified account number with full details",
    "value": {
      "id": "1234567890123456",
      "display_phone_number": "+1 631-555-5555",
      "verified_name": "Jasper's Market",
      "status": "CONNECTED",
      "quality_rating": "GREEN",
      "country_code": "US",
      "country_dial_code": "1",
      "code_verification_status": "VERIFIED",
      "name_status": "APPROVED",
      "messaging_limit_tier": "TIER_1K",
      "account_mode": "LIVE",
      "is_official_business_account": false
    }
  },
  "unverified_account_number": {
    "summary": "Unverified account number with minimal details",
    "value": {
      "id": "2345678901234567",
      "display_phone_number": "+1 555-123-4567",
      "status": "UNVERIFIED",
      "quality_rating": "NA",
      "code_verification_status": "UNVERIFIED",
      "name_status": "NONE"
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

WhatsApp-Account-Number-IDstring·obrigatório

Seu ID de número da conta do WhatsApp. Este ID representa a entidade do número da conta e pode ser obtido a partir da lista de números de telefone da sua conta comercial do WhatsApp.

Query Parameters

fieldsstring

Lista separada por vírgulas dos campos a serem incluídos na resposta. Se não especificado,

os campos padrão serão retornados (id, display\_phone\_number, status).

Campos disponíveis: id, display\_phone\_number, verified\_name, status, quality\_rating,

country\_code, country\_dial\_code, code\_verification\_status, name\_status,

messaging\_limit\_tier, account\_mode, certificate, is\_official\_business\_account

Respostas

Recupere detalhes abrangentes sobre um Número de Conta do WhatsApp, incluindo seu status atual, informações de verificação, classificação de qualidade e configurações.

Casos de Uso:

- Monitorar o status e a classificação de qualidade do número da conta
- Verificar a configuração do número da conta antes das operações de mensagens
- Verificar o status de verificação e aprovação
- Recuperar o nome de exibição e informações do perfil comercial

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Cache:

Os detalhes do número da conta podem ser armazenados em cache por curtos períodos, mas as informações de status podem mudar com frequência. Implemente estratégias de invalidação de cache apropriadas.

200

Detalhes da Conta do WhatsApp recuperados com sucesso

Tipo de conteúdo:application/json

Esquema:WhatsAppAccountNumber

Mostrar atributos secundários

WhatsAppAccountNumber

idstring·obrigatório

Identificador único para o Número da Conta do WhatsApp

display\_phone\_numberstring·obrigatório

Número de telefone no formato internacional para fins de exibição

verified\_namestring

Nome da empresa verificado para este número de telefone

statusWhatsAppAccountNumberStatus·obrigatório

Status atual do número da conta do WhatsApp

quality\_ratingWhatsAppPhoneNumberQualityRating

Avaliação de qualidade com base na entrega de mensagens e no feedback do usuário

country\_codestring

Código de país ISO 3166-1 alfa-2

country\_dial\_codestring

Código de discagem do país

code\_verification\_statusWhatsAppCodeVerificationStatus

Status de verificação em duas etapas para o número de telefone

name\_statusWhatsAppDisplayNameStatus

Status do nome de exibição associado ao número de telefone

messaging\_limit\_tierOne of "TIER\_50", "TIER\_250", "TIER\_1K", "TIER\_10K", "TIER\_100K", "TIER\_UNLIMITED"

Nível atual de limite de mensagens para o número da conta

account\_modeWhatsAppBusinessSandboxEligibility

Modo de conta indicando ambiente de sandbox ou ao vivo

certificatestring

Informações do certificado comercial para o número da conta

is\_official\_business\_accountboolean

Se esta é uma conta de negócios oficial

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

Não Encontrado - O ID do Número da Conta não existe ou não está acessível

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