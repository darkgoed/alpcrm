---
title: "WhatsApp Cloud API - Marketing Messages Lite API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/marketing-messages-lite-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Mensagens de Marketing Lite

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/marketing-messages-lite-api/v23.0.md/)

Envie modelos de mensagens de marketing com otimização automática de entrega.

Entrega mensagens relevantes e oportunas aos clientes mais propensos a se envolver,

com entrega aprimorada e insights de conversão downstream.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| POST | [/{Version}/{Phone-Number-ID}/marketing\_messages](#post-version-phone-number-id-marketing-messages) |
| --- | --- |

Envie mensagens de modelo de marketing usando modelos pré-aprovados. Suporta controles de política de produto opcionais e configurações de compartilhamento de atividade de mensagens.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/marketing\_messages

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/marketing_messages' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "16315552222",
  "type": "template",
  "template": {
    "name": "hello_world",
    "language": {
      "code": "en"
    }
  }
}'
```

```json
{
  "Successful Response": {
    "summary": "Successful marketing message response",
    "value": {
      "contacts": {
        "0": {
          "input": "16315552222",
          "wa_id": "16315552222"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp",
      "success": true
    }
  }
}
```

Header Parameters

User-Agentstring

A string do agente do usuário que identifica o software do cliente que faz a solicitação.

Authorizationstring·obrigatório

Token de portador para autenticação de API. Isso deve ser um token de acesso válido obtido por meio do fluxo OAuth apropriado ou token de usuário do sistema.

Content-TypeOne of "application/json", "application/x-www-form-urlencoded", "multipart/form-data"·obrigatório

Tipo de mídia do corpo da solicitação

Path Parameters

Versionstring·obrigatório

Versão da API do WhatsApp (por exemplo, v20.0)

Phone-Number-IDstring·obrigatório

ID do Número de Telefone do WhatsApp Business

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:application/json

Esquema:MarketingMessageRequestPayload

Mostrar atributos secundários

MarketingMessageRequestPayload

messaging\_product"whatsapp"·obrigatório

Serviço de mensagens utilizado. Deve ser "whatsapp".

recipient\_type"individual"·obrigatório

Tipo de destinatário. Deve ser "individual".

tostring·obrigatório

ID do WhatsApp ou número de telefone do destinatário da mensagem

type"template"·obrigatório

Tipo de mensagem. Deve ser "modelo" para mensagens de marketing

templateobject·obrigatório

Mostrar atributos secundários

namestring·obrigatório

Nome do modelo.

languageLanguageObject·obrigatório

Contém um objeto `language`. Especifica o idioma em que o modelo pode ser renderizado.

componentsarray of TemplateComponent

Matriz de objetos `components` contendo os parâmetros da mensagem.

Mostrar atributos secundários

components\[\]TemplateComponent

product\_policyOne of "CLOUD\_API\_FALLBACK", "STRICT"

Configuração de política de produto opcional

message\_activity\_sharingboolean

Flag opcional para controlar a compartilhamento de atividade de mensagens

Respostas

Envie mensagens de modelo de marketing usando modelos pré-aprovados. Suporta controles de política de produto opcionais e configurações de compartilhamento de atividade de mensagens.

200

Mensagem de marketing enviada com sucesso

Tipo de conteúdo:application/json

Esquema:MarketingMessageResponsePayload

Mostrar atributos secundários

MarketingMessageResponsePayload

contactsarray of object

Mostrar atributos secundários

contacts\[\]object

Mostrar atributos secundários

inputstring

wa\_idstring

messagesarray of object

Mostrar atributos secundários

messages\[\]object

Mostrar atributos secundários

idstring

message\_statusOne of "accepted", "held\_for\_quality\_assessment", "paused"

The status of a WhatsApp message:

- `accepted`: The message has been accepted by WhatsApp and is being processed
- `held_for_quality_assessment`: The message is being held for quality assessment before delivery
- `paused`: The message delivery has been paused

messaging\_productstring

400

Requisição Inválida - Parâmetros de requisição inválidos

Tipo de conteúdo:application/json

401

Não autorizado - Token de acesso inválido ou ausente

Tipo de conteúdo:application/json

403

Proibido - Modelo não aprovado ou permissões insuficientes

Tipo de conteúdo:application/json

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