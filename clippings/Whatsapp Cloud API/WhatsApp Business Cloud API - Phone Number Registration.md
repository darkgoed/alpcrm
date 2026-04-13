---
title: "WhatsApp Business Cloud API - Phone Number Registration"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/phone-number-registration"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Business Cloud API - Registro de Número de Telefone

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/phone-number-registration/v23.0.md/)

API para registrar números de telefone do WhatsApp Business na plataforma da Cloud API.

Este endpoint permite que empresas registrem seus números de telefone para mensagens do WhatsApp Business,

habilitando a verificação em duas etapas e ativando o número de telefone para comunicações comerciais.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| POST | [/{Version}/{Phone-Number-ID}/register](#post-version-phone-number-id-register) |
| --- | --- |

Registre um número de telefone do WhatsApp Business para capacidades de mensagens e habilite a verificação em duas etapas. Este é um passo obrigatório antes de enviar mensagens por meio da API do WhatsApp Business Cloud.

Processo de Registro:

- O número de telefone deve estar no status NÃO VERIFICADO
- Forneça um PIN de 6 dígitos para verificação em duas etapas
- Opcionalmente, forneça dados de backup para migração de conta
- O registro ativa as capacidades de mensagens

Suporte à Migração:

Para migrar da API do WhatsApp Business local, inclua dados de backup com senha e informações de conta criptografadas.

Limitação de Taxa:

As tentativas de registro são limitadas por taxa para prevenir abusos. As limitações de taxa padrão da API do Graph se aplicam com restrições adicionais para os endpoints de registro.

Requisitos de Segurança:

- A verificação em duas etapas é obrigatória para todos os números registrados
- O PIN deve ser armazenado e gerenciado de forma segura pelo negócio
- O registro habilita a entrega de webhook e as capacidades de envio de mensagens

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/register

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/register' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "messaging_product": "whatsapp",
  "pin": "123456"
}'
```

```json
{
  "successful_registration": {
    "summary": "Successful registration",
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

O ID do número de telefone para registrar. Esse ID é fornecido quando o número de telefone é adicionado à sua Conta de Negócios do WhatsApp e pode ser encontrado no Gerenciador do WhatsApp.

Corpo da solicitaçãoObrigatório

Payload de solicitação de registro com PIN e dados de migração opcionais

Tipo de conteúdo:application/json

Esquema:WhatsAppBusinessPhoneNumberRegistrationRequest

Mostrar atributos secundários

WhatsAppBusinessPhoneNumberRegistrationRequest

messaging\_product"whatsapp"·obrigatório

Deve ser 'whatsapp' para indicar o produto de mensagens do WhatsApp Business

pinstring·obrigatório

PIN de 6 dígitos para configuração de verificação em duas etapas

backupWhatsAppBusinessAccountBackup

Backup de dados para migrar contas do WhatsApp Business existentes

Mostrar atributos secundários

passwordstring

Senha de backup para migração de conta

datastring

Dados de backup criptografados para migração de conta

tierV2TierName

Configuração de nível da API do WhatsApp Business

data\_localization\_regionWhatsAppDataLocalizationRegion

Região de localização de dados para armazenamento de mensagens (obsoleta a partir da v21+)

meta\_store\_retention\_minutesinteger \[min: 60, max: 60\]

Período de retenção de mensagens em minutos (obsoleto a partir da v21+)

Respostas

Registre um número de telefone do WhatsApp Business para capacidades de mensagens e habilite a verificação em duas etapas. Este é um passo obrigatório antes de enviar mensagens por meio da API do WhatsApp Business Cloud.

Processo de Registro:

- O número de telefone deve estar no status NÃO VERIFICADO
- Forneça um PIN de 6 dígitos para verificação em duas etapas
- Opcionalmente, forneça dados de backup para migração de conta
- O registro ativa as capacidades de mensagens

Suporte à Migração:

Para migrar da API do WhatsApp Business local, inclua dados de backup com senha e informações de conta criptografadas.

Limitação de Taxa:

As tentativas de registro são limitadas por taxa para prevenir abusos. As limitações de taxa padrão da API do Graph se aplicam com restrições adicionais para os endpoints de registro.

Requisitos de Segurança:

- A verificação em duas etapas é obrigatória para todos os números registrados
- O PIN deve ser armazenado e gerenciado de forma segura pelo negócio
- O registro habilita a entrega de webhook e as capacidades de envio de mensagens

200

Número de telefone do WhatsApp Business registrado com sucesso

Tipo de conteúdo:application/json

Esquema:WhatsAppBusinessPhoneNumberRegistrationResponse

Mostrar atributos secundários

WhatsAppBusinessPhoneNumberRegistrationResponse

successboolean·obrigatório

Indica se o registro foi bem-sucedido

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

Entidade Inprocessável - Não é possível registrar o número de telefone no estado atual

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