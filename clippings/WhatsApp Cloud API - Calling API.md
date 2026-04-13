---
title: "WhatsApp Cloud API - Calling API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/calling-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Chamada

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/calling-api/v23.0.md/)

A API de Chamadas Comerciais do WhatsApp permite que você inicie e receba chamadas com usuários do WhatsApp usando protocolo de voz sobre internet (VoIP).

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/call\_permissions](#get-version-phone-number-id-call-permissions) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/calls](#post-version-phone-number-id-calls) |

## GET /{Version}/{Phone-Number-ID}/call\_permissions

Verifique se você tem permissão para chamar um usuário do WhatsApp e quais ações estão disponíveis. Este endpoint retorna o status de permissão atual para chamar um usuário específico, juntamente com ações disponíveis e seus limites.

Status de Permissão:

- `granted`: Você tem permissão ativa para chamar este usuário
- `pending`: Um pedido de permissão foi enviado, mas ainda não foi aprovado
- `denied`: O usuário negou permissão para chamadas
- `expired`: A permissão anterior expirou

Ações Disponíveis:

- `start_call`: Iniciar uma nova chamada para este usuário
- `send_call_permission_request`: Enviar um pedido de permissão para este usuário

Tratamento de Erros:

Este endpoint pode retornar vários códigos de erro, incluindo erros de limitação de taxa se muitas verificações de permissão forem feitas em um curto período.

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/call\_permissions

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/call_permissions' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "Granted Permission": {
    "value": {
      "messaging_product": "whatsapp",
      "permission": {
        "status": "granted",
        "expiration_time": 1735689600
      },
      "actions": {
        "0": {
          "action_name": "start_call",
          "can_perform_action": true,
          "limits": {
            "0": {
              "time_period": "24h",
              "current_usage": 5,
              "max_allowed": 100,
              "limit_expiration_time": 1735689600
            }
          }
        },
        "1": {
          "action_name": "send_call_permission_request",
          "can_perform_action": false,
          "limits": ""
        }
      }
    }
  },
  "Pending Permission": {
    "value": {
      "messaging_product": "whatsapp",
      "permission": {
        "status": "pending"
      },
      "actions": {
        "0": {
          "action_name": "start_call",
          "can_perform_action": false
        },
        "1": {
          "action_name": "send_call_permission_request",
          "can_perform_action": false
        }
      }
    }
  },
  "Denied Permission": {
    "value": {
      "messaging_product": "whatsapp",
      "permission": {
        "status": "denied"
      },
      "actions": {
        "0": {
          "action_name": "start_call",
          "can_perform_action": false
        },
        "1": {
          "action_name": "send_call_permission_request",
          "can_perform_action": true,
          "limits": {
            "0": {
              "time_period": "24h",
              "current_usage": 2,
              "max_allowed": 5,
              "limit_expiration_time": 1735689600
            }
          }
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

A versão da API a ser usada

Phone-Number-IDstring·obrigatório

O ID do número de telefone registrado com sua Conta de Negócios do WhatsApp

Query Parameters

user\_wa\_idstring·obrigatório

O ID do WhatsApp do usuário para o qual você deseja verificar as permissões de chamada

Respostas

Verifique se você tem permissão para chamar um usuário do WhatsApp e quais ações estão disponíveis. Este endpoint retorna o status de permissão atual para chamar um usuário específico, juntamente com ações disponíveis e seus limites.

Status de Permissão:

- `granted`: Você tem permissão ativa para chamar este usuário
- `pending`: Um pedido de permissão foi enviado, mas ainda não foi aprovado
- `denied`: O usuário negou permissão para chamadas
- `expired`: A permissão anterior expirou

Ações Disponíveis:

- `start_call`: Iniciar uma nova chamada para este usuário
- `send_call_permission_request`: Enviar um pedido de permissão para este usuário

Tratamento de Erros:

Este endpoint pode retornar vários códigos de erro, incluindo erros de limitação de taxa se muitas verificações de permissão forem feitas em um curto período.

200

Verificação de Permissões de Chamada Concluída com Sucesso

Tipo de conteúdo:application/json

Esquema:CallPermissionCheckResponsePayload

Mostrar atributos secundários

CallPermissionCheckResponsePayload

messaging\_productstring·obrigatório

Produto de mensagens

permissionobject·obrigatório

Detalhes da permissão de chamada

Mostrar atributos secundários

statusOne of "granted", "pending", "denied", "expired"·obrigatório

Status de permissão atual para chamar este usuário

expiration\_timeinteger (int64)

Carimbo de data e hora Unix quando a permissão expira (se aplicável)

actionsarray of object

Ações disponíveis e suas restrições

Mostrar atributos secundários

actions\[\]object

Mostrar atributos secundários

action\_nameOne of "start\_call", "send\_call\_permission\_request"·obrigatório

Name of the action

can\_perform\_actionboolean·obrigatório

Whether the business can perform this action

limitsarray of object

Rate limits for this action

Mostrar atributos secundários

limits\[\]object

Mostrar atributos secundários

time\_periodstring·obrigatório

Time period for the limit

current\_usageinteger·obrigatório

Current usage count

max\_allowedinteger·obrigatório

Maximum allowed usage

limit\_expiration\_timeinteger (int64)

Unix timestamp when the limit resets

400

Requisição Inválida - Parâmetros de requisição inválidos

Tipo de conteúdo:application/json

429

Muitos Pedidos - Limite de taxa excedido

Tipo de conteúdo:application/json

403

Proibido - Modelo não aprovado ou permissões insuficientes

Tipo de conteúdo:application/json

500

Erro Interno do Servidor - Ocorreu um erro inesperado

Tipo de conteúdo:application/json

## POST /{Version}/{Phone-Number-ID}/calls

Use esse endpoint para iniciar, aceitar, rejeitar ou encerrar chamadas do WhatsApp.

Para iniciar ou gerenciar uma chamada:

Envie uma solicitação POST com a ação apropriada (conectar, pré-aceitar, aceitar, rejeitar, encerrar).

Para encerrar uma chamada:

Envie uma solicitação POST com a ação "encerrar" e o call\_id.

Observação: A resposta com o código de erro 138006 indica falta de permissão de solicitação de chamada para esse número comercial do usuário do WhatsApp.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/calls

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/calls' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "messaging_product": "whatsapp",
  "to": "14085551234",
  "action": "connect",
  "session": {
    "sdp_type": "offer",
    "sdp": "v=0\no=- 3626166318745852955 2 IN IP4 127.0.0.1\ns=-\nt=0 0\na=group:BUNDLE 0\na=extmap-allow-mixed\na=msid-semantic: WMS d8b26053-4474-4eb7-b3c3-c93d6c8c9b2e\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 110 126\nc=IN IP4 0.0.0.0\na=rtcp:9 IN IP4 0.0.0.0\na=ice-ufrag:4g1c\na=ice-pwd:qY/Bb+jQzg5ICn6X4fhJQetk\na=ice-options:trickle\na=fingerprint:sha-256 35:47:24:24:9F:93:C4:3E:DB:37:7F:BB:ED:F8:20:B5:AD:AC:DC:35:C2:7D:67:EE:6C:35:54:DF:A6:00:5C:4A\na=setup:actpass\na=mid:0\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\na=sendrecv\na=msid:d8b26053-4474-4eb7-b3c3-c93d6c8c9b2e 5b4d3d96-ea9b-44a8-87e6-11a1ad21a3bc\na=rtcp-mux\na=rtpmap:111 opus/48000/2\na=rtcp-fb:111 transport-cc\na=fmtp:111 minptime=10;useinbandfec=1\na=rtpmap:63 red/48000/2\na=fmtp:63 111/111\na=rtpmap:9 G722/8000\na=rtpmap:0 PCMU/8000\na=rtpmap:8 PCMA/8000\na=rtpmap:110 telephone-event/48000\na=rtpmap:126 telephone-event/8000\na=ssrc:2220762577 cname:w/zwpg3jXNiTFTdZ\na=ssrc:2220762577 msid:d8b26053-4474-4eb7-b3c3-c93d6c8c9b2e 5b4d3d96-ea9b-44a8-87e6-11a1ad21a3bc\n"
  },
  "biz_opaque_callback_data": "0fS5cePMok"
}'
```

```json
{
  "Connect Call Response": {
    "value": {
      "messaging_product": "whatsapp",
      "calls": {
        "0": {
          "id": "wacid.ABGGFjFVU2AfAgo6V"
        }
      }
    }
  },
  "Terminate Call Response": {
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

Content-TypeOne of "application/json", "application/x-www-form-urlencoded", "multipart/form-data"·obrigatório

Tipo de mídia do corpo da solicitação

Path Parameters

Versionstring·obrigatório

A versão da API a ser usada

Phone-Number-IDstring·obrigatório

O ID do número de telefone registrado com sua Conta de Negócios do WhatsApp

Corpo da solicitaçãoOpcional

Tipo de conteúdo:application/json

Esquema:Must be one of: CallRequestPayload, CallTerminateRequestPayload

Mostrar atributos secundários

Must be one of: CallRequestPayload, CallTerminateRequestPayload

CallRequestPayload

Mostrar atributos secundários

messaging\_productstring·obrigatório

Produto de mensagens

tostring·obrigatório

O número chamado (chamado)

actionOne of "connect", "pre\_accept", "accept", "reject", "terminate"·obrigatório

A ação sendo tomada no ID de chamada fornecido

sessionobject

Contém o tipo de protocolo de descrição de sessão (SDP) e a linguagem de descrição.

Mostrar atributos secundários

sdp\_typeOne of "offer", "answer"·obrigatório

Tipo SDP - "oferta" para ação de conexão, "resposta" para ação de aceitação

sdpstring·obrigatório

As informações SDP do dispositivo na outra extremidade da chamada. O SDP deve estar em conformidade com o RFC 8866

biz\_opaque\_callback\_datastring

Uma string arbitrária que você pode passar que é útil para fins de rastreamento e registro. Qualquer aplicativo inscrito no campo "chamadas" do webhook da sua Conta de Negócios do WhatsApp pode receber essa string, pois ela está incluída no objeto de chamadas dentro da carga útil do Webhook de Encerramento de Chamada subsequente. A Cloud API não processa esse campo. Máximo de 512 caracteres.

CallTerminateRequestPayload

Mostrar atributos secundários

messaging\_productstring·obrigatório

Produto de mensagens

call\_idstring·obrigatório

O ID da chamada do WhatsApp

action"terminate"·obrigatório

Ação para encerrar a chamada

Respostas

Use esse endpoint para iniciar, aceitar, rejeitar ou encerrar chamadas do WhatsApp.

Para iniciar ou gerenciar uma chamada:

Envie uma solicitação POST com a ação apropriada (conectar, pré-aceitar, aceitar, rejeitar, encerrar).

Para encerrar uma chamada:

Envie uma solicitação POST com a ação "encerrar" e o call\_id.

Observação: A resposta com o código de erro 138006 indica falta de permissão de solicitação de chamada para esse número comercial do usuário do WhatsApp.

200

Sucesso no Gerenciamento de Chamadas

Tipo de conteúdo:application/json

Esquema:Must be one of: CallResponsePayload, CallTerminateResponsePayload

Mostrar atributos secundários

Must be one of: CallResponsePayload, CallTerminateResponsePayload

CallResponsePayload

Mostrar atributos secundários

messaging\_productstring

callsarray of object

Mostrar atributos secundários

calls\[\]object

Mostrar atributos secundários

idstring

CallTerminateResponsePayload

Mostrar atributos secundários

successboolean

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