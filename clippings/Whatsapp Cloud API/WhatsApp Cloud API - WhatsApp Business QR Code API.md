---
title: "WhatsApp Cloud API - WhatsApp Business QR Code API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-qr-code-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Código QR do WhatsApp Business

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-qr-code-api/v23.0.md/)

API para gerenciar códigos QR de mensagens de contas individuais do WhatsApp Business por meio de seu identificador exclusivo.

Fornece endpoints para recuperar e excluir códigos QR de mensagens específicos.

Os códigos QR de mensagens geram links profundos do WhatsApp com mensagens pré-preenchidas que os clientes podem usar para iniciar conversas. Cada código QR tem um identificador exclusivo de 14 caracteres.

Requisitos: Conta do WhatsApp Business com permissão `whatsapp_business_management`, número de telefone verificado, token de acesso de usuário do sistema válido e identificador de código QR válido.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/message\_qrdls/{QR-Code-ID}](#get-version-phone-number-id-message-qrdls-qr-code-id) |
| --- | --- |
| DELETE | [/{Version}/{Phone-Number-ID}/message\_qrdls/{QR-Code-ID}](#delete-version-phone-number-id-message-qrdls-qr-code-id) |

Recupere detalhes de um código QR específico por seu identificador único.

Suporta seleção de campos e geração de imagem de QR. A resposta retorna o código QR em um array de dados para consistência.

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/message\_qrdls/{QR-Code-ID}

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/message_qrdls/{QR-Code-ID}' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "default_fields": {
    "summary": "Default fields response",
    "description": "Response with default fields (code, prefilled_message, deep_link_url)",
    "value": {
      "data": {
        "0": {
          "code": "ANED2T5QRU7HG1",
          "prefilled_message": "Show me Cyber Monday deals!",
          "deep_link_url": "https://wa.me/message/ANED2T5QRU7HG1"
        }
      }
    }
  },
  "with_qr_image_svg": {
    "summary": "Response with SVG QR code image",
    "description": "Response including QR code image URL in SVG format",
    "value": {
      "data": {
        "0": {
          "code": "ANED2T5QRU7HG1",
          "prefilled_message": "Show me Cyber Monday deals!",
          "deep_link_url": "https://wa.me/message/ANED2T5QRU7HG1",
          "qr_image_url": "https://scontent-iad3-1.xx.fbcdn.net/m1/v/t6/An-H7T8OyTqO07lcRGHlKteuPMKDnx07nua3dGb4i560bVxDscweOV4KoKD_4wCDFoHR_C5LyVjxQISKPxwora1bbFhUEo2nA19ZPLBUVoQSmV12l1x-nuu312jKty-5rmojmde_a0g?ccb=10-5&oh=00_AfASq_vjojFza_9A-HDeRgHM3wZ8yjNprpYBjNKOn8RkSg&oe=64550A9E&_nc_sid=f36290"
        }
      }
    }
  },
  "with_creation_time": {
    "summary": "Response with creation time (first-party apps only)",
    "description": "Response including creation timestamp for first-party applications",
    "value": {
      "data": {
        "0": {
          "code": "ANED2T5QRU7HG1",
          "prefilled_message": "Show me Cyber Monday deals!",
          "deep_link_url": "https://wa.me/message/ANED2T5QRU7HG1",
          "creation_time": 1672531200
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

Versão da Graph API a ser usada para essa solicitação. Determina o comportamento da API e os recursos disponíveis.

Phone-Number-IDstring·obrigatório

O ID do número de telefone da Conta de Negócios do WhatsApp que é proprietário do código QR. Esse ID é fornecido quando você adiciona um número de telefone à sua Conta de Negócios do WhatsApp.

QR-Code-IDstring·obrigatório

O identificador exclusivo de 14 caracteres do código QR para recuperar. Este é o valor do código retornado quando o código QR foi criado.

Query Parameters

fieldsstring

Lista separada por vírgulas dos campos a serem incluídos na resposta. Campos disponíveis:

- code: identificador do código QR (sempre incluído)
- prefilled\_message: texto de mensagem preenchido (sempre incluído)
- deep\_link\_url: URL de link profundo do WhatsApp (sempre incluído)
- creation\_time: carimbo de data/hora Unix quando o código QR foi criado (apenas aplicativos de primeira parte)
- qr\_image\_url.format(FORMAT): URL da imagem do código QR onde FORMAT é SVG ou PNG

Exemplo: "code,prefilled\_message,qr\_image\_url.format(SVG)"

Respostas

Recupere detalhes de um código QR específico por seu identificador único.

Suporta seleção de campos e geração de imagem de QR. A resposta retorna o código QR em um array de dados para consistência.

200

Detalhes do código QR da mensagem recuperados com sucesso

Tipo de conteúdo:application/json

Esquema:QrCodeResponse

Mostrar atributos secundários

QrCodeResponse

dataarray of QrCodeDetails·obrigatório

Array contendo o único objeto de código QR (mantém a consistência com o endpoint de coleção)

Mostrar atributos secundários

data\[\]QrCodeDetails

Detalhes completos de um código QR de mensagem

Mostrar atributos secundários

codestring·obrigatório

Identificador de código QR único de 14 caracteres

prefilled\_messagestring·obrigatório

Texto de mensagem pré-preenchido que aparece no bate-papo do cliente

deep\_link\_urlstring (uri)·obrigatório

URL de link profundo do WhatsApp para iniciação direta de conversa

creation\_timeinteger

Carimbo de data e hora Unix quando o código QR foi criado (aplicativos de primeira parte apenas)

qr\_image\_urlstring (uri)

URL de download da imagem do código QR (quando o formato é especificado nos campos)

400

Solicitação Inválida - Formato de ID de código QR inválido ou parâmetros

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

Não Encontrado - O ID do número de telefone ou o código QR não existe

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

Excluir permanentemente um código QR específico. Uma vez excluído, o código QR e o link profundo se tornam inválidos.

A exclusão não pode ser desfeita e afeta qualquer material de marketing existente que use o código QR.

### Sintaxe da solicitação

**DELETE** /{Version}/{Phone-Number-ID}/message\_qrdls/{QR-Code-ID}

Testar

```shell
curl --request DELETE \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/message_qrdls/{QR-Code-ID}' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "successful_deletion": {
    "summary": "QR code successfully deleted",
    "description": "Confirmation that the QR code has been permanently deleted",
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

Versão da Graph API a ser usada para essa solicitação. Determina o comportamento da API e os recursos disponíveis.

Phone-Number-IDstring·obrigatório

O ID do número de telefone da Conta de Negócios do WhatsApp que é proprietário do código QR a ser excluído.

Esse ID é fornecido quando você adiciona um número de telefone à sua Conta de Negócios do WhatsApp.

QR-Code-IDstring·obrigatório

O identificador exclusivo de 14 caracteres do código QR a ser excluído. Este é o valor do código retornado quando o código QR foi criado.

Respostas

Excluir permanentemente um código QR específico. Uma vez excluído, o código QR e o link profundo se tornam inválidos.

A exclusão não pode ser desfeita e afeta qualquer material de marketing existente que use o código QR.

200

Mensagem do código QR excluída com sucesso

Tipo de conteúdo:application/json

Esquema:DeleteQrCodeResponse

Mostrar atributos secundários

DeleteQrCodeResponse

successboolean·obrigatório

Indica se o código QR foi excluído com sucesso

400

Solicitação Inválida - Formato de ID de código QR inválido

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

Não Encontrado - O ID do número de telefone ou o código QR não existe

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