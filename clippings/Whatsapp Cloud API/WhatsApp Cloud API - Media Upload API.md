---
title: "WhatsApp Cloud API - Media Upload API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/media-upload-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Upload de Mídia

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/media-upload-api/v23.0.md/)

Envie arquivos de mídia (imagens, vídeos, áudio, documentos, adesivos) para o WhatsApp.

Retorna um ID de mídia que pode ser usado para enviar mensagens de mídia.

Suporta vários formatos de arquivo e uploads de formulário de dados multipart.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| POST | [/{Version}/{Phone-Number-ID}/media](#post-version-phone-number-id-media) |
| --- | --- |

## POST /{Version}/{Phone-Number-ID}/media

Este pedido faz o upload de uma imagem como.jpeg. Os parâmetros são especificados como form-data no corpo da solicitação.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/media

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/media' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "file": "@/local/path/file.ogg;type=ogg",
  "messaging_product": "whatsapp"
}'
```

```json
{
  "Upload Audio (form-data)": {
    "value": {
      "id": "<MEDIA_ID>"
    }
  },
  "Upload Audio JSON": {
    "value": {
      "id": "4490709327384033"
    }
  },
  "Upload Image JSON": {
    "value": {
      "id": "4490709327384033"
    }
  },
  "Upload Sticker File (form-data)": {
    "value": {
      "id": "<MEDIA_ID>"
    }
  },
  "Upload Sticker File JSON": {
    "value": {
      "id": "4490709327384033"
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

Corpo da solicitaçãoOpcional

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

filestring

messaging\_productstring

Tipo de conteúdo:multipart/form-data

Esquema:object

Mostrar atributos secundários

filestring (binary)

messaging\_productstring

Respostas

Este pedido faz o upload de uma imagem como.jpeg. Os parâmetros são especificados como form-data no corpo da solicitação.

200

Enviar Imagem JSON / Enviar Arquivo de Figurinha (form-data) / Enviar Arquivo de Figurinha JSON / Enviar Áudio (form-data) / Enviar Áudio JSON

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

idstring

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