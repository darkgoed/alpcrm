---
title: "WhatsApp Cloud API - Commerce Settings API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/commerce-settings-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Configurações de Comércio

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/commerce-settings-api/v23.0.md/)

Configure as configurações de comércio do WhatsApp Business, incluindo visibilidade de catálogo e ativação de carrinho de compras. Recupere e atualize as configurações de comércio para números de telefone comerciais.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/whatsapp\_commerce\_settings](#get-version-phone-number-id-whatsapp-commerce-settings) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/whatsapp\_commerce\_settings](#post-version-phone-number-id-whatsapp-commerce-settings) |

## GET /{Version}/{Phone-Number-ID}/whatsapp\_commerce\_settings

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/whatsapp\_commerce\_settings

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/whatsapp_commerce_settings' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "Example response": {
    "value": {
      "data": {
        "0": {
          "id": "527759822865714",
          "is_cart_enabled": true,
          "is_catalog_visible": true
        }
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

Phone-Number-IDstring·obrigatório

## POST /{Version}/{Phone-Number-ID}/whatsapp\_commerce\_settings

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/whatsapp\_commerce\_settings

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/whatsapp_commerce_settings' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "Example response": {
    "value": {
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

Path Parameters

Versionstring·obrigatório

Phone-Number-IDstring·obrigatório

Query Parameters

is\_cart\_enabledstring

is\_catalog\_visiblestring

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