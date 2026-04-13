---
title: "WhatsApp Business Cloud API - Groups Management API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/groups-management-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Business Cloud API - API de Gerenciamento de Grupos

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/groups-management-api/v23.0.md/)

Crie e gerencie grupos do WhatsApp Business com configurações de aprovação.

Retorne links de convite para adicionar participantes aos grupos.

Recupere listas de grupos ativos com suporte a paginação.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/groups](#get-version-phone-number-id-groups) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/groups](#post-version-phone-number-id-groups) |

## GET /{Version}/{Phone-Number-ID}/groups

Recuperar uma lista de grupos ativos para um determinado número de telefone comercial

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/groups

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/groups' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

Header Parameters

User-Agentstring

A string do agente do usuário que identifica o software do cliente que faz a solicitação.

Authorizationstring·obrigatório

Token de portador para autenticação de API. Isso deve ser um token de acesso válido obtido por meio do fluxo OAuth apropriado ou token de usuário do sistema.

Content-TypeOne of "application/json", "application/x-www-form-urlencoded", "multipart/form-data"·obrigatório

Tipo de mídia do corpo da solicitação

Path Parameters

Phone-Number-IDstring·obrigatório

ID do número de telefone comercial

Query Parameters

limitinteger \[min: 1, max: 1024\]

Número de grupos para buscar na solicitação

afterstring

Cursor que aponta para o final de uma página de dados

beforestring

Cursor que aponta para o início de uma página de dados

Respostas

Recuperar uma lista de grupos ativos para um determinado número de telefone comercial

200

Lista de grupos ativos

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

dataobject

Mostrar atributos secundários

groupsarray of object

Mostrar atributos secundários

groups\[\]object

Mostrar atributos secundários

idstring

Group ID

subjectstring

Group subject

created\_atstring

Group creation timestamp

pagingPagingInfo

Mostrar atributos secundários

cursorsobject

Mostrar atributos secundários

beforestring

Antes do cursor

afterstring

Após cursor

previousstring

URL da página anterior

nextstring

URL da próxima página

## POST /{Version}/{Phone-Number-ID}/groups

Crie um novo grupo e obtenha um link de convite

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/groups

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/groups' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "messaging_product": "\"whatsapp\"",
  "request_id": "\"106540352242922\""
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

ID do número de telefone comercial

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

messaging\_product"whatsapp"·obrigatório

Messaging product

subjectstring·obrigatório

Group subject. Maximum 128 characters. Whitespace is trimmed.

descriptionstring

Group description. Maximum 2048 characters.

join\_approval\_modeOne of "approval\_required", "auto\_approve"

Indicates if WhatsApp users who click the invitation link can join the group with or without being approved first.

- approval\_required: WhatsApp users must be approved via join request before they can access the group
- auto\_approve: WhatsApp users can join the group without approval

Respostas

Crie um novo grupo e obtenha um link de convite

200

Solicitação de criação de grupo enviada com sucesso

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

messaging\_productstring

request\_idstring

Group creation request ID

400

Requisição Inválida - Parâmetros de requisição inválidos

Tipo de conteúdo:application/json

Esquema:ErrorResponse

Mostrar atributos secundários

ErrorResponse

errorErrorObject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Descrição legível por humanos do erro

typestring·obrigatório

Classificação de tipos de erros

codeinteger·obrigatório

Código de erro numérico

401

Não autorizado - Token de acesso inválido ou ausente

Tipo de conteúdo:application/json

Esquema:ErrorResponse

Mostrar atributos secundários

ErrorResponse

errorErrorObject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Descrição legível por humanos do erro

typestring·obrigatório

Classificação de tipos de erros

codeinteger·obrigatório

Código de erro numérico

500

Erro Interno do Servidor - Ocorreu um erro inesperado

Tipo de conteúdo:application/json

Esquema:ErrorResponse

Mostrar atributos secundários

ErrorResponse

errorErrorObject·obrigatório

Mostrar atributos secundários

messagestring·obrigatório

Descrição legível por humanos do erro

typestring·obrigatório

Classificação de tipos de erros

codeinteger·obrigatório

Código de erro numérico

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