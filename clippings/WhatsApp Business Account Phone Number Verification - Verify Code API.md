---
title: "WhatsApp Business Account Phone Number Verification - Verify Code API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/verify-code-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## Verificação do Número de Telefone da Conta Comercial do WhatsApp - API de Verificação de Código

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/verify-code-api/v23.0.md/)

API para verificar códigos de verificação de número de telefone para números de telefone da Conta de Negócios do WhatsApp.

Este endpoint permite que as empresas verifiquem os códigos de verificação de número de telefone enviados durante o processo de registro ou verificação de número de telefone.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| POST | [/{Version}/{Phone-Number-ID}/verify\_code](#post-version-phone-number-id-verify-code) |
| --- | --- |

## POST /{Version}/{Phone-Number-ID}/verify\_code

Verificar um código de verificação de número de telefone para um número de telefone da Conta de Negócios do WhatsApp.

Este endpoint é usado para concluir o processo de verificação do número de telefone enviando

o código de verificação recebido por SMS ou chamada de voz.

Casos de Uso:

- Concluir a verificação do número de telefone durante a configuração inicial
- Verificar a propriedade do número de telefone para capacidades de mensagens
- Finalizar o processo de registro do número de telefone
- Concluir a verificação de migração do número de telefone

Limitação de Taxa:

As tentativas de verificação são limitadas por taxa para prevenir abusos. Tentativas mal-sucedidas podem resultar em bloqueio temporário. Use lógica de repetição apropriada com backoff exponencial.

Segurança:

Os códigos de verificação são limitados no tempo (geralmente 10 minutos) e de uso único.

Múltiplas tentativas mal-sucedidas podem acionar medidas de segurança adicionais.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/verify\_code

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/verify_code' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "code": "123456"
}'
```

```json
{
  "successful_verification": {
    "summary": "Successful verification response",
    "value": {
      "success": true,
      "id": "1234567890123456"
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

O ID do número de telefone da Conta de Negócios do WhatsApp que precisa ser verificado.

Este ID é fornecido quando você adiciona um número de telefone à sua Conta de Negócios do WhatsApp.

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:application/json

Esquema:VerifyCodeRequest

Mostrar atributos secundários

VerifyCodeRequest

codestring·obrigatório

O código de verificação recebido por SMS ou chamada de voz

Respostas

Verificar um código de verificação de número de telefone para um número de telefone da Conta de Negócios do WhatsApp.

Este endpoint é usado para concluir o processo de verificação do número de telefone enviando

o código de verificação recebido por SMS ou chamada de voz.

Casos de Uso:

- Concluir a verificação do número de telefone durante a configuração inicial
- Verificar a propriedade do número de telefone para capacidades de mensagens
- Finalizar o processo de registro do número de telefone
- Concluir a verificação de migração do número de telefone

Limitação de Taxa:

As tentativas de verificação são limitadas por taxa para prevenir abusos. Tentativas mal-sucedidas podem resultar em bloqueio temporário. Use lógica de repetição apropriada com backoff exponencial.

Segurança:

Os códigos de verificação são limitados no tempo (geralmente 10 minutos) e de uso único.

Múltiplas tentativas mal-sucedidas podem acionar medidas de segurança adicionais.

200

Código de verificação do número de telefone verificado com sucesso

Tipo de conteúdo:application/json

Esquema:VerifyCodeResponse

Mostrar atributos secundários

VerifyCodeResponse

successboolean·obrigatório

Indica se o código de verificação foi verificado com sucesso

idstring

O ID do número de telefone que foi verificado

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

Título de erro de fácil compreensão para fins de exibição

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

Título de erro de fácil compreensão para fins de exibição

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

Título de erro de fácil compreensão para fins de exibição

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

Título de erro de fácil compreensão para fins de exibição

error\_user\_msgstring

Mensagem de erro de fácil compreensão para fins de exibição

422

Entidade não processável - Código de verificação inválido ou expirado

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

Título de erro de fácil compreensão para fins de exibição

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

Título de erro de fácil compreensão para fins de exibição

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

Título de erro de fácil compreensão para fins de exibição

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