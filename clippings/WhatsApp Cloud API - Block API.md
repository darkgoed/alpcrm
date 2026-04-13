---
title: "WhatsApp Cloud API - Block API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/block-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/block\_users](#get-version-phone-number-id-block-users) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/block\_users](#post-version-phone-number-id-block-users) |
| DELETE | [/{Version}/{Phone-Number-ID}/block\_users](#delete-version-phone-number-id-block-users) |

## GET /{Version}/{Phone-Number-ID}/block\_users

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/block\_users

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/block_users' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "Get blocked users": {
    "value": {
      "data": {
        "0": {
          "messaging_product": "whatsapp",
          "wa_id": "16505551234"
        }
      },
      "paging": {
        "cursors": {
          "after": "eyJvZAmZAzZAXQiOjAsInZAlcnNpb25JZACI6IjE3Mzc2Nzk2ODgzODM1ODQifQZDZD",
          "before": "eyJvZAmZAzZAXQiOjAsInZAlcnNpb25JZACI6IjE3Mzc2Nzk2ODgzODM1ODQifQZDZD"
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

Content-TypeOne of "application/json", "application/x-www-form-urlencoded", "multipart/form-data"·obrigatório

Tipo de mídia do corpo da solicitação

Path Parameters

Versionstring·obrigatório

Phone-Number-IDstring·obrigatório

## POST /{Version}/{Phone-Number-ID}/block\_users

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/block\_users

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/block_users' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "block_users": {
    "0": {
      "user": "+16505551234"
    }
  },
  "messaging_product": "whatsapp"
}'
```

```json
{
  "Block user(s)": {
    "value": {
      "block_users": {
        "added_users": {
          "0": {
            "input": "+16505551234",
            "wa_id": "16505551234"
          }
        }
      },
      "messaging_product": "whatsapp"
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

Phone-Number-IDstring·obrigatório

Corpo da solicitaçãoOpcional

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

block\_usersarray of object

Mostrar atributos secundários

block\_users\[\]object

Mostrar atributos secundários

userstring

messaging\_productstring

## DELETE /{Version}/{Phone-Number-ID}/block\_users

### Sintaxe da solicitação

**DELETE** /{Version}/{Phone-Number-ID}/block\_users

Testar

```shell
curl --request DELETE \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/block_users' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "block_users": {
    "0": {
      "user": "+16505551234"
    }
  },
  "messaging_product": "whatsapp"
}'
```

```json
{
  "Unblock user(s)": {
    "value": {
      "block_users": {
        "removed_users": {
          "0": {
            "input": "+16505551234",
            "wa_id": "16505551234"
          }
        }
      },
      "messaging_product": "whatsapp"
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

Phone-Number-IDstring·obrigatório

Corpo da solicitaçãoOpcional

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

block\_usersarray of object

Mostrar atributos secundários

block\_users\[\]object

Mostrar atributos secundários

userstring

messaging\_productstring

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