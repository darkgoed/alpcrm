---
title: "WhatsApp Cloud API - Message API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Mensagens

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api/v23.0.md/)

Envie e receba mensagens do WhatsApp, incluindo texto, mídia, modelos, mensagens interativas, reações e muito mais. Suporta rastreamento de status de mensagem, recibos de entrega e confirmações de leitura.

Uma vez que você tenha seu token, salve-o de forma segura onde seu software possa acessá-lo.

ID da carteira de negócios

Você pode obter o ID da carteira de negócios fazendo login no [Meta Business Suite](https://business.facebook.com/). O ID aparece na URL como o valor do parâmetro de consulta `business_id`. Com isso, você pode consultar todos os WABAs de propriedade para obter o ID do WABA.

Permissões

A API depende apenas de duas permissões:

- whatsapp\_business\_management
- whatsapp\_business\_messaging

Observe que, se você obter um token de acesso de usuário do painel do aplicativo, seu aplicativo será automaticamente concedido essas permissões (por você, em seu nome), então você pode usar o token para testar imediatamente.

Consultas que visam sua carteira de negócios exigem a permissão de gerenciamento de negócios, que você também pode precisar com base em seu caso de uso de negócios. No entanto, a maioria dos desenvolvedores não precisa dessa permissão, pois acessar sua carteira de negócios é incomum e o Meta Business Suite fornece quase toda essa funcionalidade de qualquer maneira.

Depurador de token de acesso

Paginação

## URL base

https://graph.facebook.com

## Pontos de extremidade

| POST | [/{Version}/{Phone-Number-ID}/messages](#post-version-phone-number-id-messages) |
| --- | --- |

## POST /{Version}/{Phone-Number-ID}/messages

Enviar Mensagem.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/messages

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/messages' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "audio": {
    "id": "<AUDIO_OBJECT_ID>"
  },
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{{Recipient-Phone-Number}}",
  "type": "audio"
}'
```

```json
{
  "Example response": {
    "value": {
      "contacts": {
        "0": {
          "input": "+16505551234",
          "wa_id": "16505551234"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBJCOTY3NDc0NDFDRUI3NTA0Q0UA"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Audio Message By URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Audio Message by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Contact Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Document Message by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Document Message by URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Draft Flow by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "18055555555",
          "wa_id": "18055555555"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.HBgL..."
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Draft Flow by Name": {
    "value": {
      "contacts": {
        "0": {
          "input": "18055555555",
          "wa_id": "18055555555"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.HBgL..."
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Flow Template Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "18055555555",
          "wa_id": "18055555555"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.HBgL..."
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Image Message by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Image Message by URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Interactive Message Template": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send List Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "15555551234",
          "wa_id": "<WHATSAPP_ID>"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.ID"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Location Messages": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Message Template Media": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Message Template Text": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Published Flow by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "18055555555",
          "wa_id": "18055555555"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.HBgL..."
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Published Flow by Name": {
    "value": {
      "contacts": {
        "0": {
          "input": "18055555555",
          "wa_id": "18055555555"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.HBgL..."
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply Button": {
    "value": {
      "contacts": {
        "0": {
          "input": "PHONE_NUMBER",
          "wa_id": "WHATSAPP_ID"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.ID"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Audio Message by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Audio Message by URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Contact Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Document Message by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Document Message by URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Image Message by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Image Message by URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to List Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "15555551234",
          "wa_id": "<WHATSAPP_ID>"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.ID"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Location Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Sticker Message by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Sticker Message by URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Text Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Video Message by ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply to Video Message by URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Reply with Reaction Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "<PHONE_NUMBER>",
          "wa_id": "<WHATSAPP_ID>"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.HBgLM..."
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Sample Shipping Confirmation Template": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Sample Text message": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Single Product Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "+1-631-555-5555",
          "wa_id": "16315555555"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGFlaCGg0xcvAdgmZ9plHrf2Mh-o"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Sticker Message By ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Sticker Message By URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Test Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Text Message": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Video Message By ID": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send Video Message By URL": {
    "value": {
      "contacts": {
        "0": {
          "input": "48XXXXXXXXX",
          "wa_id": "48XXXXXXXXX "
        }
      },
      "messages": {
        "0": {
          "id": "wamid.gBGGSFcCNEOPAgkO_KJ55r4w_ww"
        }
      },
      "messaging_product": "whatsapp"
    }
  },
  "Send typing indicator and read receipt": {
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

Phone-Number-IDstring·obrigatório

Corpo da solicitaçãoOpcional

Tipo de conteúdo:application/json

Esquema:Message

Mostrar atributos secundários

Message

TextMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"text"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

textobject·obrigatório

Mostrar atributos secundários

bodystring

The text of the message.

preview\_urlboolean

AudioMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"audio"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

audioMust be one of: unknown, unknown

Um objeto de mídia. Ou `id` ou `link` é obrigatório.

Mostrar atributos secundários

unknown

Mostrar atributos secundários

idstring·obrigatório

The media object ID. Required when `link` is not used.

captionstring

Optional caption for the media

unknown

Mostrar atributos secundários

linkstring (url)·obrigatório

The protocol and URL of the media to be sent (HTTP/HTTPS only).

captionstring

Optional caption for the media

DocumentMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"document"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

documentMust be one of: unknown, unknown

Um objeto de mídia. Ou `id` ou `link` é obrigatório.

Mostrar atributos secundários

unknown

Mostrar atributos secundários

idstring·obrigatório

The media object ID. Required when `link` is not used.

captionstring

Optional caption for the media

unknown

Mostrar atributos secundários

linkstring (url)·obrigatório

The protocol and URL of the media to be sent (HTTP/HTTPS only).

captionstring

Optional caption for the media

ImageMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"image"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

imageMust be one of: unknown, unknown

Um objeto de mídia. Ou `id` ou `link` é obrigatório.

Mostrar atributos secundários

unknown

Mostrar atributos secundários

idstring·obrigatório

The media object ID. Required when `link` is not used.

captionstring

Optional caption for the media

unknown

Mostrar atributos secundários

linkstring (url)·obrigatório

The protocol and URL of the media to be sent (HTTP/HTTPS only).

captionstring

Optional caption for the media

LocationMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"location"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

locationobject·obrigatório

Mostrar atributos secundários

addressstring

The address of the location.

latitudestring

The latitude of the location.

longitudestring

The longitude of the location.

namestring

The name of the location.

VideoMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"video"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

videoMust be one of: unknown, unknown

Um objeto de mídia. Ou `id` ou `link` é obrigatório.

Mostrar atributos secundários

unknown

Mostrar atributos secundários

idstring·obrigatório

The media object ID. Required when `link` is not used.

captionstring

Optional caption for the media

unknown

Mostrar atributos secundários

linkstring (url)·obrigatório

The protocol and URL of the media to be sent (HTTP/HTTPS only).

captionstring

Optional caption for the media

StickerMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"sticker"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

stickerMust be one of: object, object·obrigatório

Mostrar atributos secundários

object

Mostrar atributos secundários

idstring·obrigatório

The ID of the sticker.

object

Mostrar atributos secundários

linkstring·obrigatório

The URL of the sticker.

ReactionMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"reaction"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

reactionobject·obrigatório

Mostrar atributos secundários

emojistring

emoji

message\_idstring

reacted message-id

InteractiveMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"interactive"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

interactiveobject

Um objeto que contém o conteúdo de uma mensagem interativa.

Mostrar atributos secundários

typeOne of "button", "call\_permission\_request", "catalog\_message", "list", "product", "product\_list", "flow"·obrigatório

O tipo de mensagem interativa a ser enviada.

headerobject

Conteúdo do cabeçalho exibido no topo de uma mensagem. Obrigatório para o tipo 'product\_list'. Não pode ser definido para o tipo 'product'.

Mostrar atributos secundários

typeOne of "text", "video", "image", "document"·obrigatório

O tipo de cabeçalho.

textstring

Texto para o cabeçalho. Obrigatório se 'type' for 'text'. Suporta emojis, sem markdown.

sub\_textstring

Texto sub-opcional para o cabeçalho. Suporta emojis, sem markdown.

documentMust be one of: unknown, unknown

Um objeto de mídia. Ou `id` ou `link` é obrigatório.

Mostrar atributos secundários

unknown

Mostrar atributos secundários

idstring·obrigatório

The media object ID. Required when `link` is not used.

captionstring

Optional caption for the media

unknown

Mostrar atributos secundários

linkstring (url)·obrigatório

The protocol and URL of the media to be sent (HTTP/HTTPS only).

captionstring

Optional caption for the media

imageMust be one of: unknown, unknown

Um objeto de mídia. Ou `id` ou `link` é obrigatório.

Mostrar atributos secundários

unknown

Mostrar atributos secundários

idstring·obrigatório

The media object ID. Required when `link` is not used.

captionstring

Optional caption for the media

unknown

Mostrar atributos secundários

linkstring (url)·obrigatório

The protocol and URL of the media to be sent (HTTP/HTTPS only).

captionstring

Optional caption for the media

videoMust be one of: unknown, unknown

Um objeto de mídia. Ou `id` ou `link` é obrigatório.

Mostrar atributos secundários

unknown

Mostrar atributos secundários

idstring·obrigatório

The media object ID. Required when `link` is not used.

captionstring

Optional caption for the media

unknown

Mostrar atributos secundários

linkstring (url)·obrigatório

The protocol and URL of the media to be sent (HTTP/HTTPS only).

captionstring

Optional caption for the media

bodyobject

Um objeto com o corpo da mensagem. Opcional para o tipo 'produto', obrigatório para outros tipos de mensagens interativas.

Mostrar atributos secundários

textstring·obrigatório

O conteúdo do corpo da mensagem. Emojis e markdown são suportados.

footerobject

Um objeto com o rodapé da mensagem. Opcional.

Mostrar atributos secundários

textstring·obrigatório

O conteúdo do rodapé. Emojis, markdown e links são suportados.

actionMust be one of: unknown, unknown, unknown, unknown, unknown, unknown

Ação que você deseja que o usuário execute após ler a mensagem. Sua estrutura varia de acordo com o tipo de mensagem interativa.

Mostrar atributos secundários

unknown

Mostrar atributos secundários

buttonstring·obrigatório

Button content for List Messages. Cannot be empty, must be unique. Emojis supported, no markdown.

sectionsarray of SectionObject·obrigatório

Array of section objects.

Mostrar atributos secundários

sections\[\]object

Um objeto de seção, usado em Mensagens de Lista e Mensagens de Múltiplos Produtos.

Mostrar atributos secundários

titlestring

Título da seção. Obrigatório se a mensagem tiver mais de uma seção. Máximo de 24 caracteres.

product\_itemsarray of object

Matriz de objetos de produtos.

Mostrar atributos secundários

product\_items\[\]object

Mostrar atributos secundários

product\_retailer\_idstring·obrigatório

Unique identifier of the product in a catalog.

rowsarray of object

Contém uma lista de linhas.

Mostrar atributos secundários

rows\[\]object

Mostrar atributos secundários

idstring·obrigatório

Unique row identifier.

titlestring·obrigatório

Row title.

descriptionstring

Optional row description.

unknown

Mostrar atributos secundários

buttonsarray of object·obrigatório

Array of button objects.

Mostrar atributos secundários

buttons\[\]object

Mostrar atributos secundários

type"reply"·obrigatório

Only supported type is "reply" for Reply Button.

replyobject·obrigatório

Mostrar atributos secundários

idstring·obrigatório

Unique identifier for your button. No leading/trailing spaces.

titlestring·obrigatório

Button title. Cannot be empty, must be unique. Emojis supported, no markdown.

unknown

Mostrar atributos secundários

catalog\_idstring·obrigatório

Unique identifier of the Facebook catalog linked to your WhatsApp Business Account.

product\_retailer\_idstring

Unique identifier of the product in a catalog. Required for Single Product Messages.

sectionsarray of SectionObject

Array of section objects.

Mostrar atributos secundários

sections\[\]object

Um objeto de seção, usado em Mensagens de Lista e Mensagens de Múltiplos Produtos.

Mostrar atributos secundários

titlestring

Título da seção. Obrigatório se a mensagem tiver mais de uma seção. Máximo de 24 caracteres.

product\_itemsarray of object

Matriz de objetos de produtos.

Mostrar atributos secundários

product\_items\[\]object

Mostrar atributos secundários

product\_retailer\_idstring·obrigatório

Unique identifier of the product in a catalog.

rowsarray of object

Contém uma lista de linhas.

Mostrar atributos secundários

rows\[\]object

Mostrar atributos secundários

idstring·obrigatório

Unique row identifier.

titlestring·obrigatório

Row title.

descriptionstring

Optional row description.

unknown

Mostrar atributos secundários

name"catalog\_message"·obrigatório

parametersobject·obrigatório

Mostrar atributos secundários

thumbnail\_product\_retailer\_idstring·obrigatório

Product retailer ID for the thumbnail.

unknown

Mostrar atributos secundários

name"flow"·obrigatório

parametersMust be one of: unknown, unknown·obrigatório

Mostrar atributos secundários

flow\_message\_version"3"·obrigatório

Must be "3".

flow\_idstring

Unique identifier of the Flow provided by WhatsApp. Required unless flow\_name is set. Cannot be used with flow\_name.

flow\_namestring

The name of the Flow that you created. Required unless flow\_id is set. Cannot be used with flow\_id.

flow\_ctastring·obrigatório

Text on the CTA button (e.g., "Signup"). Advised 30 characters or less, no emoji.

modeOne of "draft", "published"

The current mode of the Flow, either "draft" or "published".

flow\_tokenstring

A token generated by the business to serve as an identifier. Defaults to "unused".

flow\_actionOne of "navigate", "data\_exchange"

Either "navigate" to predefine the first screen, or "data\_exchange" for advanced use cases.

Mostrar atributos secundários

flow\_action\_payloadobject

Optional only if 'flow\_action' is 'navigate'.

Mostrar atributos secundários

screenstring

The 'id' of the first screen of the Flow.

dataobject

The input data for the first screen of the Flow. Must be a non-empty object.

unknown

unknown

unknown

Mostrar atributos secundários

name"call\_permission\_request"·obrigatório

TemplateMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"template"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

templateobject·obrigatório

Mostrar atributos secundários

namestring·obrigatório

Name of the template.

languageLanguageObject·obrigatório

Contains a `language` object. Specifies the language the template may be rendered in

componentsarray of TemplateComponent

Array of `components` objects containing the parameters of the message.

Mostrar atributos secundários

components\[\]TemplateComponent

ContactsMessage

Mostrar atributos secundários

messaging\_productstring·obrigatório

recipient\_typeOne of "individual", "group"·obrigatório

O tipo de destinatário.

tostring·obrigatório

O número de telefone do destinatário para mensagens individuais e group-id para mensagem de grupo.

type"contacts"

contextobject

Informações de contexto para responder a uma mensagem

Mostrar atributos secundários

message\_idstring

O ID da mensagem à qual esta mensagem é uma resposta.

contactsarray of ContactObject·obrigatório

Mostrar atributos secundários

contacts\[\]object

Mostrar atributos secundários

addressesarray of AddressObject

Endereço(ões) completo(s) de contato

Mostrar atributos secundários

addresses\[\]object

Mostrar atributos secundários

citystring

Nome da cidade

countrystring

Nome completo do país

Mostrar atributos secundários

country\_codestring

Código de país ISO de duas letras

statestring

Abreviação do estado

streetstring

Endereço de rua

typeOne of "HOME", "WORK"

Tipo de endereço

zipstring

CEP

birthdaystring (date)

Data de nascimento (formato AAAA-MM-DD)

emailsarray of EmailObject

Endereço(s) de e-mail de contato

Mostrar atributos secundários

emails\[\]object

Mostrar atributos secundários

emailstring (email)·obrigatório

Endereço de e-mail

typeOne of "HOME", "WORK"

Tipo de e-mail

nameobject

Mostrar atributos secundários

first\_namestring

Nome próprio

formatted\_namestring

Nome completo formatado

last\_namestring

Sobrenome

middle\_namestring

Nome do meio

prefixstring

Prefixo de nome

suffixstring

Sufixo de nome

orgobject

Mostrar atributos secundários

companystring

Nome da empresa

departmentstring

Nome do Departamento

titlestring

Título do cargo

phonesarray of PhoneObject

Número(s) de telefone para contato

Mostrar atributos secundários

phones\[\]object

Mostrar atributos secundários

phonestring·obrigatório

Número de telefone

typeOne of "HOME", "WORK"

Tipo de telefone

wa\_idstring

ID do WhatsApp

urlsarray of UrlObject

URL(s) de Contato

Mostrar atributos secundários

urls\[\]object

Mostrar atributos secundários

typeOne of "HOME", "WORK"

Tipo de URL

urlstring (uri)·obrigatório

URL

Respostas

Enviar Mensagem.

200

Enviar Mensagem de Teste / Enviar Mensagem de Texto / Enviar Resposta à Mensagem de Texto / Enviar Resposta com Mensagem de Reação / Enviar Mensagem de Imagem por ID / Enviar Resposta à Mensagem de Imagem por ID / Enviar Mensagem de Imagem por URL / Enviar Resposta à Mensagem de Imagem por URL / Enviar Mensagem de Áudio por ID / Enviar Resposta à Mensagem de Áudio por ID / Enviar Mensagem de Áudio por URL / Enviar Resposta à Mensagem de Áudio por URL / Enviar Mensagem de Documento por ID / Enviar Resposta à Mensagem de Documento por ID / Enviar Mensagem de Documento por URL / Enviar Resposta à Mensagem de Documento por URL / Enviar Mensagem de Figurinha por ID / Enviar Resposta à Mensagem de Figurinha por ID / Enviar Mensagem de Figurinha por URL / Enviar Resposta à Mensagem de Figurinha por URL / Enviar Mensagem de Vídeo por ID / Enviar Resposta à Mensagem de Vídeo por ID / Enviar Mensagem de Vídeo por URL / Enviar Resposta à Mensagem de Vídeo por URL / Enviar Mensagem de Contato / Enviar Resposta à Mensagem de Contato / Enviar Mensagens de Localização / Enviar Resposta à Mensagem de Localização / Enviar Modelo de Mensagem de Texto / Enviar Modelo de Mensagem de Mídia / Enviar Modelo de Mensagem Interativa / Enviar Mensagem de Lista / Enviar Resposta à Mensagem de Lista / Enviar Botão de Resposta / Enviar Mensagem de Produto Único / Exemplo de Resposta / Exemplo de Resposta / Enviar Fluxo de Rascunho por Nome / Enviar Fluxo de Rascunho por ID / Enviar Fluxo Publicado por Nome / Enviar Fluxo Publicado por ID / Enviar Mensagem de Modelo de Fluxo / Enviar indicador de digitação e recibo de leitura / Enviar Exemplo de Mensagem de Texto / Enviar Exemplo de Modelo de Confirmação de Envio / Enviar Exemplo de Modelo de Resolução de Problema

Tipo de conteúdo:application/json

Esquema:MessageResponsePayload

Mostrar atributos secundários

MessageResponsePayload

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