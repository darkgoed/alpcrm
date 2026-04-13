---
title: "WhatsApp Cloud API - WhatsApp Business QR Code Management API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-qr-code-management-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Gerenciamento de Códigos QR do WhatsApp Business

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-qr-code-management-api/v23.0.md/)

API para gerenciar coleções de códigos QR de mensagens da conta do WhatsApp Business.

Fornece endpoints para listar todos os códigos QR de mensagens e criar novos.

Os códigos QR de mensagens geram links profundos do WhatsApp com mensagens pré-preenchidas que os clientes podem usar para iniciar conversas. Cada código QR tem um identificador único de 14 caracteres.

Requisitos: Conta do WhatsApp Business com permissão `whatsapp_business_management`, número de telefone verificado e token de acesso de usuário do sistema válido.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/message\_qrdls](#get-version-phone-number-id-message-qrdls) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/message\_qrdls](#post-version-phone-number-id-message-qrdls) |

## GET /{Version}/{Phone-Number-ID}/message\_qrdls

Recupere todos os códigos QR de mensagem para um número de telefone, classificados por tempo de criação (mais recentes primeiro).

Suporta seleção de campos, filtragem por código, paginação baseada em cursor e geração de imagem QR.

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/message\_qrdls

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/message_qrdls' \
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
          "code": "5QBPAD2DC6L5A1",
          "prefilled_message": "Show me Cyber Tuesday deals!",
          "deep_link_url": "https://wa.me/message/5QBPAD2DC6L5A1"
        },
        "1": {
          "code": "ANED2T5QRU7HG1",
          "prefilled_message": "Show me Cyber Monday deals!",
          "deep_link_url": "https://wa.me/message/ANED2T5QRU7HG1"
        },
        "2": {
          "code": "WOMVT6TJ2BP7A1",
          "prefilled_message": "Tell me more about your production workshop",
          "deep_link_url": "https://wa.me/message/WOMVT6TJ2BP7A1"
        }
      }
    }
  },
  "with_qr_image": {
    "summary": "Response with QR code image",
    "description": "Response including QR code image URL in SVG format",
    "value": {
      "data": {
        "0": {
          "code": "FO7JXE4BG3RFG1",
          "prefilled_message": "Tell me more about your event planning packages",
          "deep_link_url": "https://wa.me/message/FO7JXE4BG3RFG1",
          "qr_image_url": "https://scontent-iad3-1.xx.fbcdn.net/m1/v/t6/An-H7T8OyTqO07lcRGHlKteuPMKDnx07nua3dGb4i560bVxDscweOV4KoKD_4wCDFoHR_C5LyVjxQISKPxwora1bbFhUEo2nA19ZPLBUVoQSmV12l1x-nuu312jKty-5rmojmde_a0g?ccb=10-5&oh=00_AfASq_vjojFza_9A-HDeRgHM3wZ8yjNprpYBjNKOn8RkSg&oe=64550A9E&_nc_sid=f36290"
        }
      }
    }
  },
  "single_qr_code": {
    "summary": "Filtered by specific QR code",
    "description": "Response when filtering by a specific QR code ID",
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
  "empty_response": {
    "summary": "No QR codes found",
    "description": "Response when no QR codes exist or match the filter criteria",
    "value": {
      "data": []
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

O ID do número de telefone da Conta de Negócios do WhatsApp para o qual listar códigos QR.

Este ID é fornecido quando você adiciona um número de telefone à sua Conta de Negócios do WhatsApp.

Query Parameters

fieldsstring

Lista separada por vírgulas dos campos a serem incluídos na resposta. Campos disponíveis:

- code: identificador do código QR (sempre incluído)
- prefilled\_message: texto de mensagem pré-preenchido (sempre incluído)
- deep\_link\_url: URL de link profundo do WhatsApp (sempre incluído)
- creation\_time: carimbo de data/hora Unix quando o código QR foi criado (apenas aplicativos de primeira parte)
- qr\_image\_url.format(FORMAT): URL da imagem do código QR onde FORMAT é SVG ou PNG

Exemplo: "code,prefilled\_message,qr\_image\_url.format(SVG)"

codestring

Filtrar resultados para um código QR específico por seu identificador exclusivo.

Quando fornecido, apenas o código QR correspondente será retornado (se existir).

limitinteger \[min: 1, max: 25\]

Número máximo de códigos QR para retornar em uma única resposta.

O limite padrão e máximo é normalmente 25.

afterstring

Cursor para paginação. Use isso para obter a próxima página de resultados.

Obtenha esse valor do campo paging.cursors.after em respostas anteriores.

beforestring

Cursor para paginação. Use isso para obter a página anterior de resultados.

Obtenha esse valor do campo paging.cursors.before em respostas anteriores.

Respostas

Recupere todos os códigos QR de mensagem para um número de telefone, classificados por tempo de criação (mais recentes primeiro).

Suporta seleção de campos, filtragem por código, paginação baseada em cursor e geração de imagem QR.

200

Lista de códigos QR de mensagens recuperada com sucesso

Tipo de conteúdo:application/json

Esquema:QrCodeList

Mostrar atributos secundários

QrCodeList

dataarray of QrCodeDetails·obrigatório

Matriz de objetos de código QR

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

Carimbo de data/hora Unix quando o código QR foi criado (aplicativos de primeira parte apenas)

qr\_image\_urlstring (uri)

URL de download da imagem do código QR (quando o formato é especificado nos campos)

pagingobject

Informações de paginação para navegar por grandes conjuntos de resultados.

Contém cursors para acessar as páginas anteriores e posteriores dos resultados.

Mostrar atributos secundários

cursorsobject

Mostrar atributos secundários

beforestring

Cursor para acessar a página anterior de resultados

afterstring

Cursor para acessar a próxima página de resultados

previousstring (uri)

URL para a página anterior de resultados

nextstring (uri)

URL para a próxima página de resultados

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

## POST /{Version}/{Phone-Number-ID}/message\_qrdls

Crie um novo código QR (sem parâmetro de código) ou atualize o código QR existente (com parâmetro de código).

Suporta geração opcional de imagem QR em formato PNG ou SVG.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/message\_qrdls

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/message_qrdls' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "prefilled_message": "Hi! I'm interested in your products. Can you help me?",
  "generate_qr_image": "SVG"
}'
```

```json
{
  "created_qr_code_with_image": {
    "summary": "Newly created QR code with image",
    "value": {
      "code": "ANED2T5QRU7HG1",
      "prefilled_message": "Hi! I'm interested in your products. Can you help me?",
      "deep_link_url": "https://wa.me/message/ANED2T5QRU7HG1",
      "qr_image_url": "https://scontent-iad3-2.xx.fbcdn.net/m1/v/t6/An-psFmLBls2NFXnhhkSVqwIHEqCTQoNKTLxxlOeci0Wbsukd2RLiwZalHrXwqT5RTFSzOhyw6OLvJJO0itaQtJI1BS2WkNcV67wR3GNx7ZX1tFSNCbpo1e6KPptKF1GbVGzmUfkgSPX?ccb=10-5&oh=00_AfAOAr6oRA2OKV_Ur3GUh4em57sACxUkfhXHsObiFrxOsA&oe=64DCCEF6&_nc_sid=5a413f"
    }
  },
  "updated_qr_code": {
    "summary": "Updated existing QR code",
    "value": {
      "code": "WOMVT6TJ2BP7A1",
      "prefilled_message": "Hello! I'd like to know more about your latest offers.",
      "deep_link_url": "https://wa.me/message/WOMVT6TJ2BP7A1"
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

Versão da Graph API a ser usada para essa solicitação. Determina o comportamento da API e os recursos disponíveis.

Phone-Number-IDstring·obrigatório

O ID do número de telefone da Conta de Negócios do WhatsApp para o qual criar ou atualizar o código QR.

Este ID é fornecido quando você adiciona um número de telefone à sua Conta de Negócios do WhatsApp.

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:application/json

Esquema:Must be one of: CreateQrCodeRequest, UpdateQrCodeRequest

Mostrar atributos secundários

Must be one of: CreateQrCodeRequest, UpdateQrCodeRequest

CreateQrCodeRequest

Payload de solicitação para criar um novo código QR de mensagem

Mostrar atributos secundários

prefilled\_messagestring·obrigatório

Texto de mensagem preenchido (máx. 140 caracteres) que aparece na conversa do cliente

generate\_qr\_imageOne of "PNG", "SVG"

Formato de imagem QR. Quando especificado, a resposta inclui qr\_image\_url

UpdateQrCodeRequest

Payload de solicitação para atualizar um código QR de mensagem existente

Mostrar atributos secundários

codestring·obrigatório

Identificador de código QR de 14 caracteres para atualizar

prefilled\_messagestring·obrigatório

Novo texto de mensagem preenchido (máx. 140 caracteres)

Respostas

Crie um novo código QR (sem parâmetro de código) ou atualize o código QR existente (com parâmetro de código).

Suporta geração opcional de imagem QR em formato PNG ou SVG.

200

Código QR da mensagem criado ou atualizado com sucesso

Tipo de conteúdo:application/json

Esquema:QrCodeResponse

Mostrar atributos secundários

QrCodeResponse

codestring·obrigatório

Identificador único de 14 caracteres para o código QR. Este código é usado para atualizações ou exclusões futuras.

prefilled\_messagestring·obrigatório

O texto de mensagem pré-preenchido associado a esse código QR.

Esse texto aparece quando os clientes usam o código QR.

deep\_link\_urlstring (uri)·obrigatório

URL de link profundo do WhatsApp que pode ser usado diretamente sem a necessidade de digitalizar o código QR. Os clientes podem clicar nesse link para iniciar uma conversa com a mensagem pré-preenchida.

qr\_image\_urlstring (uri)

URL para baixar a imagem do código QR. Apresentado apenas se o parâmetro generate\_qr\_image foi especificado na solicitação. O formato da imagem corresponde ao formato solicitado.

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

Não Encontrado - O ID do número de telefone não existe ou o código QR não foi encontrado para atualização

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