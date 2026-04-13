---
title: "WhatsApp Cloud API - Business Encryption API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/business-encryption-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Criptografia de Negócios

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/business-encryption-api/v23.0.md/)

API para gerenciamento de configurações de criptografia da conta comercial do WhatsApp e gerenciamento de chaves públicas.

Este endpoint permite que empresas configurem e gerenciem a criptografia para suas mensagens comerciais do WhatsApp, carregando e recuperando chaves públicas de negócios usadas para criptografia de carga.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/whatsapp\_business\_encryption](#get-version-phone-number-id-whatsapp-business-encryption) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/whatsapp\_business\_encryption](#post-version-phone-number-id-whatsapp-business-encryption) |

## GET /{Version}/{Phone-Number-ID}/whatsapp\_business\_encryption

Recupere a chave pública comercial atual e seu status de verificação de assinatura.

Este endpoint retorna a chave pública atualmente configurada para criptografar as cargas de mensagens e indica se a assinatura armazenada é válida ou tem uma incompatibilidade.

Casos de Uso:

- Verificar a configuração de criptografia atual
- Verificar o status de validação da assinatura da chave pública
- Recuperar a chave pública para configuração de criptografia do lado do cliente
- Monitorar o status da chave de criptografia para conformidade de segurança

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Armazenamento em Cache:

As informações da chave pública podem ser armazenadas em cache por períodos moderados, mas o status da assinatura pode mudar e deve ser verificado regularmente para validação de segurança.

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/whatsapp\_business\_encryption

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/whatsapp_business_encryption' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "valid_key": {
    "summary": "Valid public key with verified signature",
    "value": {
      "data": {
        "0": {
          "business_public_key_signature_status": "VALID"
        }
      }
    }
  },
  "mismatch_key": {
    "summary": "Public key with signature mismatch",
    "value": {
      "data": {
        "0": {
          "business_public_key": " ",
          "business_public_key_signature_status": "MISMATCH"
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

Seu ID de número de telefone do WhatsApp Business. Esse ID representa a entidade do número de telefone e pode ser obtido na lista de números de telefone da sua conta do WhatsApp Business.

Query Parameters

fieldsstring

Lista separada por vírgulas dos campos a serem incluídos na resposta. Se não especificado, todos os campos disponíveis serão retornados.

Campos disponíveis: business\_public\_key, business\_public\_key\_signature\_status

Respostas

Recupere a chave pública comercial atual e seu status de verificação de assinatura.

Este endpoint retorna a chave pública atualmente configurada para criptografar as cargas de mensagens e indica se a assinatura armazenada é válida ou tem uma incompatibilidade.

Casos de Uso:

- Verificar a configuração de criptografia atual
- Verificar o status de validação da assinatura da chave pública
- Recuperar a chave pública para configuração de criptografia do lado do cliente
- Monitorar o status da chave de criptografia para conformidade de segurança

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Armazenamento em Cache:

As informações da chave pública podem ser armazenadas em cache por períodos moderados, mas o status da assinatura pode mudar e deve ser verificado regularmente para validação de segurança.

200

Informações da chave pública de criptografia de negócios recuperadas com sucesso

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

dataarray of WhatsAppBusinessEncryptionInfo

Mostrar atributos secundários

data\[\]WhatsAppBusinessEncryptionInfo

Informações de chave pública de criptografia de negócios e status de verificação

Mostrar atributos secundários

business\_public\_keystring·obrigatório

A chave pública de negócios usada para criptografar as cargas de mensagens.

Essa chave é usada para criptografar solicitações e respostas do canal de dados.

Mostrar atributos secundários

business\_public\_key\_signature\_statusBusinessPublicKeyVerificationStatus·obrigatório

Status de verificação de assinatura de chave pública de negócios

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

## POST /{Version}/{Phone-Number-ID}/whatsapp\_business\_encryption

Carregar e configurar uma chave pública comercial para criptografia de carga de mensagens.

Este endpoint aceita uma chave pública comercial no formato PEM, valida-a e a armazena com uma assinatura criptográfica para uso futuro na criptografia de cargas de mensagens e solicitações de canal de dados.

Casos de Uso:

- Configuração inicial de criptografia para mensagens do WhatsApp Business
- Atualização da chave pública existente para rotação de chaves
- Habilitar criptografia de carga segura para comunicações comerciais sensíveis
- Configurar chaves de criptografia para requisitos de conformidade

Requisitos Principais:

- Deve ser uma chave pública RSA válida no formato PEM
- A chave deve atender aos padrões de segurança da Meta para criptografia
- Apenas uma chave pública ativa por número de telefone por vez
- Chaves anteriores são substituídas quando novas são carregadas

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Os uploads de chaves podem ter limitações de taxa adicionais relacionadas à segurança para prevenir abusos.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/whatsapp\_business\_encryption

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/whatsapp_business_encryption' \
  --header 'Authorization: Bearer <Token>' \
  -F 'business_public_key=-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
'
```

```json
{
  "success": {
    "summary": "Successful key upload",
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

Seu ID de número de telefone do WhatsApp Business. Esse ID representa a entidade do número de telefone e pode ser obtido na lista de números de telefone da sua conta do WhatsApp Business.

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:multipart/form-data

Esquema:WhatsAppBusinessEncryptionUploadRequest

Mostrar atributos secundários

WhatsAppBusinessEncryptionUploadRequest

business\_public\_keystring·obrigatório

A chave pública da empresa no formato PEM a ser carregada e assinada. Deve ser uma chave pública RSA válida que será usada para criptografia de carga.

Respostas

Carregar e configurar uma chave pública comercial para criptografia de carga de mensagens.

Este endpoint aceita uma chave pública comercial no formato PEM, valida-a e a armazena com uma assinatura criptográfica para uso futuro na criptografia de cargas de mensagens e solicitações de canal de dados.

Casos de Uso:

- Configuração inicial de criptografia para mensagens do WhatsApp Business
- Atualização da chave pública existente para rotação de chaves
- Habilitar criptografia de carga segura para comunicações comerciais sensíveis
- Configurar chaves de criptografia para requisitos de conformidade

Requisitos Principais:

- Deve ser uma chave pública RSA válida no formato PEM
- A chave deve atender aos padrões de segurança da Meta para criptografia
- Apenas uma chave pública ativa por número de telefone por vez
- Chaves anteriores são substituídas quando novas são carregadas

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Os uploads de chaves podem ter limitações de taxa adicionais relacionadas à segurança para prevenir abusos.

200

Chave pública de criptografia de negócios carregada e configurada com sucesso

Tipo de conteúdo:application/json

Esquema:WhatsAppBusinessEncryptionUploadResponse

Mostrar atributos secundários

WhatsAppBusinessEncryptionUploadResponse

successboolean·obrigatório

Indica se a chave pública foi carregada e assinada com sucesso

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