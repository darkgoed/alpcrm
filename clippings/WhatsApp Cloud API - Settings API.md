---
title: "WhatsApp Cloud API - Settings API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/settings-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Cloud API - API de Configurações

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/settings-api/v23.0.md/)

A API de Configurações permite configurar vários recursos e configurações para os números de telefone da sua Conta de Negócios do WhatsApp. Você pode gerenciar configurações de chamada, configurações de alteração de identidade do usuário, criptografia de carga e configurações de armazenamento de dados.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/settings](#get-version-phone-number-id-settings) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/settings](#post-version-phone-number-id-settings) |

## GET /{Version}/{Phone-Number-ID}/settings

Recupere as configurações atuais para um número de telefone do WhatsApp Business.

Retorna configurações de chamada, configurações de criptografia de carga e configurações de armazenamento de dados.

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/settings

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/settings' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "Basic settings response": {
    "value": {
      "calling": {
        "status": "enabled",
        "call_icon_visibility": "visible",
        "ip_addresses": {
          "default": {
            "0": "157.240.0.1",
            "1": null
          }
        },
        "callback_permission_status": "enabled",
        "video": {
          "status": "enabled"
        }
      },
      "payload_encryption": {
        "status": "disabled"
      },
      "storage_configuration": {
        "status": "default"
      }
    }
  },
  "Settings with SIP and encryption": {
    "value": {
      "calling": {
        "status": "enabled",
        "call_icon_visibility": "visible",
        "ip_addresses": {
          "default": {
            "0": "157.240.0.1",
            "1": null
          }
        },
        "callback_permission_status": "enabled",
        "srtp_key_exchange_protocol": "DTLS-SRTP",
        "sip": {
          "status": "enabled",
          "servers": {
            "0": {
              "app_id": "12345",
              "hostname": "sip.whatsapp.com",
              "port": 5060
            }
          }
        },
        "video": {
          "status": "enabled"
        }
      },
      "payload_encryption": {
        "status": "enabled",
        "client_encryption_key_fingerprint": "SHA256:abcd1234...",
        "cloud_encryption_key": "eyJhbGc..."
      },
      "storage_configuration": {
        "status": "in_country_storage_enabled",
        "data_localization_region": "us"
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

Query Parameters

include\_sip\_credentialsboolean

Inclua credenciais SIP na resposta (requer permissões adicionais)

Respostas

Recupere as configurações atuais para um número de telefone do WhatsApp Business.

Retorna configurações de chamada, configurações de criptografia de carga e configurações de armazenamento de dados.

200

Configurações do número de telefone atuais recuperadas com sucesso

Tipo de conteúdo:application/json

Esquema:PhoneNumberSettingsResponse

Mostrar atributos secundários

PhoneNumberSettingsResponse

callingCallingSettingsResponse·obrigatório

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Status atual da funcionalidade de chamada

call\_icon\_visibilityOne of "visible", "hidden"·obrigatório

Configuração de visibilidade do ícone de chamada atual

ip\_addressesobject·obrigatório

Mostrar atributos secundários

defaultarray of string·obrigatório

Endereços IP padrão para chamadas

Mostrar atributos secundários

default\[\]string

callback\_permission\_statusOne of "enabled", "disabled"·obrigatório

Status de permissão de retorno de chamada

srtp\_key\_exchange\_protocolOne of "DTLS-SRTP", "SDES-SRTP"

Protocolo de troca de chaves SRTP (opcional)

call\_hoursCallHoursSettings

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Status do recurso de horas de chamada

timezonestring

Fuso horário para horas de chamada

day\_of\_week\_startstring

Dia inicial da semana

call\_iconsCallIconsSettings

Mostrar atributos secundários

restrict\_to\_user\_countriesarray of string

Lista de países onde os ícones de chamada são restritos

Mostrar atributos secundários

restrict\_to\_user\_countries\[\]string

sipSipSettingsResponse

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Status de chamada SIP

serversarray of SipServerInfo

Configuração do servidor SIP

Mostrar atributos secundários

servers\[\]SipServerInfo

Mostrar atributos secundários

app\_idstring·obrigatório

ID da Aplicação para Servidor SIP

hostnamestring·obrigatório

Nome do host do servidor SIP

portinteger

Porta do servidor SIP (opcional)

passwordstring

Senha SIP (incluída apenas quando include\_sip\_credentials=true)

videoVideoSettingsResponse

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Status de chamada de vídeo

audioAudioSettingsResponse

Mostrar atributos secundários

statusOne of "enabled", "disabled"

Status de chamada de áudio

restrictionsCallingRestrictionsResponse

Mostrar atributos secundários

restrictionsarray of object

Mostrar atributos secundários

restrictions\[\]object

Mostrar atributos secundários

typestring

Type of restriction

expirationinteger (int64)

Expiration timestamp for the restriction

payload\_encryptionPayloadEncryptionSettingsResponse

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Status de criptografia de carga

client\_encryption\_key\_fingerprintstring

Impressão digital da chave de criptografia do cliente (quando a criptografia está habilitada)

cloud\_encryption\_keystring

Chave de criptografia de nuvem (quando a criptografia está habilitada)

storage\_configurationStorageConfigurationSettingsResponse·obrigatório

Mostrar atributos secundários

statusOne of "default", "in\_country\_storage\_enabled"·obrigatório

Status de configuração de armazenamento de dados

data\_localization\_regionstring

Região de localização de dados (quando o armazenamento no país está habilitado)

400

Requisição Inválida - Parâmetros de requisição inválidos

Tipo de conteúdo:application/json

403

Proibido - Modelo não aprovado ou permissões insuficientes

Tipo de conteúdo:application/json

## POST /{Version}/{Phone-Number-ID}/settings

Atualize várias configurações para um número de telefone do WhatsApp Business.

Você pode configurar configurações de chamada, configurações de alteração de identidade do usuário,

criptografia de carga e configurações de armazenamento de dados.

Apenas uma configuração de recurso pode ser especificada por solicitação.

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/settings

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/settings' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "calling": {
    "status": "enabled",
    "call_icon_visibility": "visible",
    "video": {
      "status": "enabled"
    }
  }
}'
```

```json
{
  "Settings updated successfully": {
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

Esquema:Must be one of: CallingSettingsRequest, UserIdentityChangeSettingsRequest, PayloadEncryptionSettingsRequest, StorageConfigurationSettingsRequest

Mostrar atributos secundários

Must be one of: CallingSettingsRequest, UserIdentityChangeSettingsRequest, PayloadEncryptionSettingsRequest, StorageConfigurationSettingsRequest

CallingSettingsRequest

Mostrar atributos secundários

callingCallingSettings·obrigatório

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Ativar ou desativar recurso de chamada

call\_icon\_visibilityOne of "visible", "hidden"

Controle a visibilidade do ícone de chamada

videoVideoSettings

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Ativar ou desativar chamadas de vídeo

sipSipSettings

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Ativar ou desativar chamadas SIP

srtp\_key\_exchange\_protocolOne of "DTLS-SRTP", "SDES-SRTP"

Protocolo de troca de chaves SRTP

UserIdentityChangeSettingsRequest

Mostrar atributos secundários

user\_identity\_changeUserIdentityChangeSettings·obrigatório

Mostrar atributos secundários

enabledboolean·obrigatório

Habilitar ou desabilitar notificações de alteração de identidade do usuário

PayloadEncryptionSettingsRequest

Mostrar atributos secundários

payload\_encryptionPayloadEncryptionSettings·obrigatório

Mostrar atributos secundários

statusOne of "enabled", "disabled"·obrigatório

Habilitar ou desabilitar criptografia de carga.

client\_encryption\_keystring

Chave pública codificada em Base64 para criptografia de carga (obrigatório ao habilitar criptografia)

StorageConfigurationSettingsRequest

Mostrar atributos secundários

storage\_configurationStorageConfigurationSettings·obrigatório

Mostrar atributos secundários

enabledboolean·obrigatório

Habilitar ou desabilitar configuração de armazenamento personalizado

regionstring

Região de armazenamento de dados

Respostas

Atualize várias configurações para um número de telefone do WhatsApp Business.

Você pode configurar configurações de chamada, configurações de alteração de identidade do usuário,

criptografia de carga e configurações de armazenamento de dados.

Apenas uma configuração de recurso pode ser especificada por solicitação.

200

Configurações atualizadas com sucesso

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

successboolean

400

Requisição Inválida - Parâmetros de requisição inválidos

Tipo de conteúdo:application/json

403

Proibido - Modelo não aprovado ou permissões insuficientes

Tipo de conteúdo:application/json

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