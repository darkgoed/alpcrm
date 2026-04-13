---
title: "WhatsApp Cloud API - WhatsApp Business Profile API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-profile-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Perfil de Negócios do WhatsApp

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-profile-api/v23.0.md/)

API para gerenciar informações do perfil do WhatsApp Business, incluindo detalhes da empresa, informações de contato e configurações do perfil. Este endpoint permite que as empresas recuperem e atualizem suas informações do perfil do WhatsApp Business, incluindo descrição da empresa, detalhes de contato, endereço e outras configurações de perfil essenciais para a comunicação com os clientes.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/whatsapp\_business\_profile](#get-version-phone-number-id-whatsapp-business-profile) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/whatsapp\_business\_profile](#post-version-phone-number-id-whatsapp-business-profile) |

Recupere informações abrangentes sobre um Perfil de Negócios do WhatsApp, incluindo detalhes do negócio, informações de contato e configurações do perfil.

Casos de Uso:

- Recuperar informações atuais do perfil do negócio
- Verificar detalhes de contato e configurações do negócio
- Verificar informações do setor e site do negócio
- Obter URL da foto do perfil e seção sobre

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Cache:

As informações do perfil do negócio podem ser armazenadas em cache por períodos moderados, mas devem ser atualizadas periodicamente para garantir a precisão.

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/whatsapp\_business\_profile

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/whatsapp_business_profile' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "business_profile_details": {
    "summary": "Complete business profile information",
    "value": {
      "data": {
        "0": {
          "business_profile": {
            "messaging_product": "whatsapp",
            "about": "Welcome to our business! We provide excellent service.",
            "address": "123 Business Street, City, State 12345",
            "description": "We are a leading provider of quality products and services.",
            "email": "contact@business.com",
            "profile_picture_url": "https://pps.whatsapp.net/v/profile_picture_url",
            "websites": {
              "0": "https://www.business.com",
              "1": null
            },
            "vertical": "RESTAURANT"
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

Versão da Graph API a ser usada para essa solicitação. Determina o comportamento da API e os recursos disponíveis.

Phone-Number-IDstring·obrigatório

Seu ID de número de telefone do WhatsApp Business. Esse ID representa a entidade de status do número de telefone e pode ser obtido na lista de números de telefone da sua conta do WhatsApp Business.

Query Parameters

fieldsstring

Lista separada por vírgulas dos campos a serem incluídos na resposta. Se não especificado, os campos padrão serão retornados (messaging\_product, about, address, description, email, profile\_picture\_url, websites, vertical).

Campos disponíveis: messaging\_product, about, address, description, email, profile\_picture\_url, websites, vertical

Respostas

Recupere informações abrangentes sobre um Perfil de Negócios do WhatsApp, incluindo detalhes do negócio, informações de contato e configurações do perfil.

Casos de Uso:

- Recuperar informações atuais do perfil do negócio
- Verificar detalhes de contato e configurações do negócio
- Verificar informações do setor e site do negócio
- Obter URL da foto do perfil e seção sobre

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Cache:

As informações do perfil do negócio podem ser armazenadas em cache por períodos moderados, mas devem ser atualizadas periodicamente para garantir a precisão.

200

Informações do Perfil do WhatsApp Business recuperadas com sucesso

Tipo de conteúdo:application/json

Esquema:WhatsAppBusinessProfileResponse

Mostrar atributos secundários

WhatsAppBusinessProfileResponse

dataarray of object

Mostrar atributos secundários

data\[\]object

Mostrar atributos secundários

business\_profileWhatsAppBusinessProfile

Informações e configurações do perfil do WhatsApp Business

Mostrar atributos secundários

messaging\_product"whatsapp"·obrigatório

O serviço de mensagens usado para a solicitação

aboutstring

O texto a ser exibido na seção Sobre do perfil da empresa

addressstring

O endereço do negócio

descriptionstring

Descrição do negócio

emailstring (email)

O endereço de e-mail de contato da empresa

profile\_picture\_urlstring (uri)

URL da foto de perfil da empresa

websitesarray of string (uri)

URLs associados ao negócio

Mostrar atributos secundários

websites\[\]string (uri)

verticalWhatsAppBusinessVertical

O tipo de indústria da empresa

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

Não Encontrado - O ID do Número de Telefone não existe ou não está acessível

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

Atualize as informações do perfil do WhatsApp Business, incluindo detalhes da empresa, informações de contato e configurações do perfil.

Casos de Uso:

- Atualize a descrição da empresa e as informações de contato
- Modifique o endereço da empresa e as informações do site
- Altere a classificação vertical da empresa
- Atualize a foto do perfil usando a API de Upload Resumível
- Atualize a foto do perfil e a seção sobre

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Atualizações da Foto do Perfil:

Para atualizar a foto do perfil, primeiro use a API de Upload Resumível para obter um profile\_picture\_handle, em seguida, inclua-o na solicitação.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/whatsapp\_business\_profile

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/whatsapp_business_profile' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "messaging_product": "whatsapp",
  "about": "Welcome to our business! We provide excellent service.",
  "address": "123 Business Street, City, State 12345",
  "description": "We are a leading provider of quality products and services.",
  "email": "contact@business.com",
  "profile_picture_handle": "4:VGVzdC5wbmc=:aW1hZ2UvanBlZw==:ARat4Mt-L09JON3f30SmDkdyPSuyBkDDYiB4TFXuXISjdgHoNp2b7j882_9Jzr2tPrdKxi92UygyVzTivJiOvmebMpZ6MIjTik3gTyI3ZCQAgQ:e:1659995302:2022308451254161:636685196:ARZf1ftR5N6-qSLtklU",
  "websites": {
    "0": "https://www.business.com",
    "1": null
  },
  "vertical": "RESTAURANT"
}'
```

```json
{
  "profile_update_success": {
    "summary": "Successful profile update",
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

Versão da Graph API a ser usada para essa solicitação. Determina o comportamento da API e os recursos disponíveis.

Phone-Number-IDstring·obrigatório

Seu ID de número de telefone do WhatsApp Business. Esse ID representa a entidade de status do número de telefone e pode ser obtido na lista de números de telefone da sua conta do WhatsApp Business.

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:application/json

Esquema:WhatsAppBusinessProfileUpdateRequest

Mostrar atributos secundários

WhatsAppBusinessProfileUpdateRequest

messaging\_product"whatsapp"·obrigatório

O serviço de mensagens usado para a solicitação

aboutstring

O texto a ser exibido na seção Sobre do perfil da empresa

addressstring

O endereço do negócio

descriptionstring

Descrição do negócio

emailstring (email)

O endereço de e-mail de contato da empresa

profile\_picture\_handlestring

O identificador da foto de perfil gerada a partir da API de Upload Resumível

websitesarray of string (uri)

URLs associados ao negócio

Mostrar atributos secundários

websites\[\]string (uri)

verticalWhatsAppBusinessVertical

O tipo de indústria da empresa

Respostas

Atualize as informações do perfil do WhatsApp Business, incluindo detalhes da empresa, informações de contato e configurações do perfil.

Casos de Uso:

- Atualize a descrição da empresa e as informações de contato
- Modifique o endereço da empresa e as informações do site
- Altere a classificação vertical da empresa
- Atualize a foto do perfil usando a API de Upload Resumível
- Atualize a foto do perfil e a seção sobre

Limitação de Taxa:

As limitações de taxa padrão da Graph API se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Atualizações da Foto do Perfil:

Para atualizar a foto do perfil, primeiro use a API de Upload Resumível para obter um profile\_picture\_handle, em seguida, inclua-o na solicitação.

200

Perfil do WhatsApp Business atualizado com sucesso

Tipo de conteúdo:application/json

Esquema:WhatsAppBusinessProfileUpdateResponse

Mostrar atributos secundários

WhatsAppBusinessProfileUpdateResponse

successboolean

Indica se a atualização foi bem-sucedida

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

Não Encontrado - O ID do Número de Telefone não existe ou não está acessível

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