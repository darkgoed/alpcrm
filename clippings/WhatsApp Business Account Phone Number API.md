---
title: "WhatsApp Business Account Phone Number API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-account-phone-number-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## API de Número de Telefone da Conta Comercial do WhatsApp

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/whatsapp-business-account-phone-number-api/v23.0.md/)

API para operações de números de telefone de contas de negócios do WhatsApp, incluindo gerenciamento de status, configuração de configurações, configuração de mensagens, configuração de webhook e gerenciamento de nome de exibição. Este endpoint fornece capacidades de gerenciamento abrangentes para números de telefone de contas de negócios do WhatsApp, permitindo que as empresas configurem o status do número de telefone, configurações de mensagens, pontos de extremidade de webhook e informações de perfil de negócios.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}](#get-version-phone-number-id) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}](#post-version-phone-number-id) |

## GET /{Version}/{Phone-Number-ID}

Recupere informações abrangentes sobre um número de telefone do WhatsApp Business usando seu ID exclusivo (CSID).

Este endpoint fornece o status do número de telefone, detalhes de verificação, métricas de qualidade e informações de configuração.

Informações Principais Retornadas:

- ID do número de telefone e formato de exibição
- Status de verificação e nome da empresa verificada
- Classificação de qualidade com base no desempenho de entrega de mensagens
- Status de verificação de código para verificação em duas etapas
- Status de certificação do nome de exibição (quando solicitado)

Sistema de Classificação de Qualidade:

A classificação de qualidade reflete como os destinatários estão recebendo mensagens desse número de telefone:

- VERDE: Alta qualidade - as mensagens estão sendo entregues e interagidas bem
- AMARELO: Qualidade média - alguns problemas de entrega ou interação detectados
- VERMELHO: Baixa qualidade - problemas significativos de entrega ou interação
- NA: Classificação de qualidade ainda não determinada (novos números de telefone)

Status do Nome de Exibição:

Ao solicitar o campo `name_status`, você receberá o status de certificação atual:

- APROVADO: Nome da empresa verificado e certificado disponível para download
- DISPONÍVEL\_SEM\_REVISÃO: Certificado pronto sem revisão adicional necessária
- NEGADO: Verificação do nome da empresa rejeitada
- EXPIRADO: Certificado existente expirou e precisa ser renovado
- PENDENTE\_DE\_REVISÃO: Solicitação de verificação do nome está em revisão
- NENHUM: Nenhum certificado ou solicitação de verificação existe

Status de Verificação de Código:

Indica o status de verificação em duas etapas:

- VERIFICADO: Número de telefone completou a verificação em duas etapas
- NÃO\_VERIFICADO: Verificação em duas etapas está pendente ou incompleta

Casos de Uso:

- Monitorar a qualidade e o desempenho de entrega do número de telefone
- Verificar o status de verificação e certificação
- Validar a configuração do número de telefone antes de enviar mensagens
- Recuperar informações de exibição para perfis de negócios
- Auditoria de conformidade e status do número de telefone

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "default_response": {
    "summary": "Default phone number information",
    "description": "Basic phone number details without additional fields",
    "value": {
      "id": "106853218861309",
      "display_phone_number": "+1 555-555-5555",
      "verified_name": "Jaspers Market",
      "quality_rating": "GREEN"
    }
  },
  "with_name_status": {
    "summary": "Phone number with display name status",
    "description": "Includes business name certification status",
    "value": {
      "id": "106853218861309",
      "display_phone_number": "+1 555-555-5555",
      "verified_name": "Jaspers Market",
      "quality_rating": "GREEN",
      "name_status": "AVAILABLE_WITHOUT_REVIEW"
    }
  },
  "with_verification_status": {
    "summary": "Phone number with code verification status",
    "description": "Includes two-step verification status",
    "value": {
      "id": "106853218861309",
      "display_phone_number": "+1 555-555-5555",
      "verified_name": "Jaspers Market",
      "quality_rating": "GREEN",
      "code_verification_status": "VERIFIED"
    }
  },
  "comprehensive_response": {
    "summary": "Full phone number information",
    "description": "All available fields included in response",
    "value": {
      "id": "106853218861309",
      "display_phone_number": "+1 555-555-5555",
      "verified_name": "Jaspers Market",
      "quality_rating": "GREEN",
      "name_status": "APPROVED",
      "code_verification_status": "VERIFIED"
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

Use a versão estável mais recente para obter o melhor desempenho e suporte a recursos.

Phone-Number-IDstring·obrigatório

O ID do número de telefone da sua Conta de Negócios do WhatsApp (CSID). Esse identificador único é atribuído quando você registra o número de telefone com a API do WhatsApp Business e pode ser encontrado no Gerenciador de Negócios do WhatsApp.

Query Parameters

fieldsstring

Lista separada por vírgulas de campos adicionais para incluir na resposta. Se não especificado,

somente os campos padrão (id, display\_phone\_number, verified\_name, quality\_rating) são retornados.

Campos Disponíveis:

- `name_status`: Status de certificação do nome de exibição para verificação de negócios
- `code_verification_status`: Status de verificação em duas etapas para o número de telefone

Valores de Campo:

Valores de name\_status:

- `APPROVED`: Nome do negócio aprovado, certificado disponível para download
- `AVAILABLE_WITHOUT_REVIEW`: Certificado pronto sem revisão adicional
- `DECLINED`: Verificação do nome do negócio rejeitada
- `EXPIRED`: Certificado expirado e precisa ser renovado
- `PENDING_REVIEW`: Verificação do nome em revisão
- `NONE`: Não há certificado ou solicitação de verificação

Valores de code\_verification\_status:

- `VERIFIED`: Número de telefone completou a verificação em duas etapas
- `UNVERIFIED`: Verificação em duas etapas pendente ou incompleta

Respostas

Recupere informações abrangentes sobre um número de telefone do WhatsApp Business usando seu ID exclusivo (CSID).

Este endpoint fornece o status do número de telefone, detalhes de verificação, métricas de qualidade e informações de configuração.

Informações Principais Retornadas:

- ID do número de telefone e formato de exibição
- Status de verificação e nome da empresa verificada
- Classificação de qualidade com base no desempenho de entrega de mensagens
- Status de verificação de código para verificação em duas etapas
- Status de certificação do nome de exibição (quando solicitado)

Sistema de Classificação de Qualidade:

A classificação de qualidade reflete como os destinatários estão recebendo mensagens desse número de telefone:

- VERDE: Alta qualidade - as mensagens estão sendo entregues e interagidas bem
- AMARELO: Qualidade média - alguns problemas de entrega ou interação detectados
- VERMELHO: Baixa qualidade - problemas significativos de entrega ou interação
- NA: Classificação de qualidade ainda não determinada (novos números de telefone)

Status do Nome de Exibição:

Ao solicitar o campo `name_status`, você receberá o status de certificação atual:

- APROVADO: Nome da empresa verificado e certificado disponível para download
- DISPONÍVEL\_SEM\_REVISÃO: Certificado pronto sem revisão adicional necessária
- NEGADO: Verificação do nome da empresa rejeitada
- EXPIRADO: Certificado existente expirou e precisa ser renovado
- PENDENTE\_DE\_REVISÃO: Solicitação de verificação do nome está em revisão
- NENHUM: Nenhum certificado ou solicitação de verificação existe

Status de Verificação de Código:

Indica o status de verificação em duas etapas:

- VERIFICADO: Número de telefone completou a verificação em duas etapas
- NÃO\_VERIFICADO: Verificação em duas etapas está pendente ou incompleta

Casos de Uso:

- Monitorar a qualidade e o desempenho de entrega do número de telefone
- Verificar o status de verificação e certificação
- Validar a configuração do número de telefone antes de enviar mensagens
- Recuperar informações de exibição para perfis de negócios
- Auditoria de conformidade e status do número de telefone

200

Recuperou com sucesso as informações do número de telefone. A resposta inclui detalhes básicos do número de telefone e quaisquer campos adicionais solicitados por meio do parâmetro `fields`.

Tipo de conteúdo:application/json

Esquema:PhoneNumberInfo

Mostrar atributos secundários

PhoneNumberInfo

idstring

O ID associado ao número de telefone

display\_phone\_numberstring

A representação de string do número de telefone

verified\_namestring

O nome verificado associado ao número de telefone

quality\_ratingOne of "GREEN", "YELLOW", "RED", "NA"

A classificação de qualidade do número de telefone com base em como as mensagens foram recebidas pelos destinatários nos últimos dias.

- VERDE: Alta Qualidade
- AMARELO: Qualidade Média
- VERMELHO: Baixa Qualidade
- NÃO DISPONÍVEL: Qualidade não foi determinada

code\_verification\_statusOne of "VERIFIED", "UNVERIFIED"

O status de verificação em duas etapas para o número de telefone, indicando se o número completou a verificação em duas etapas.

- VERIFICADO: O número de telefone completou a verificação em duas etapas
- NÃO VERIFICADO: A verificação em duas etapas está pendente ou incompleta

name\_statusOne of "APPROVED", "AVAILABLE\_WITHOUT\_REVIEW", "DECLINED", "EXPIRED", "PENDING\_REVIEW", "NONE"

O status de um nome de exibição associado a um número de telefone específico.

- APROVADO: O nome foi aprovado. Você pode baixar seu certificado agora.
- DISPONÍVEL\_SEM\_REVISÃO: O certificado para o telefone está disponível e o nome de exibição está pronto para uso sem revisão.
- NEGADO: O nome não foi aprovado. Você não pode baixar seu certificado.
- EXPIRADO: Seu certificado expirou e não pode mais ser baixado.
- EM\_REVISÃO: Sua solicitação de nome está em revisão. Você não pode baixar seu certificado.
- NENHUM: Nenhum certificado está disponível.

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

## POST /{Version}/{Phone-Number-ID}

Atualize o status e a configuração de um número de telefone de uma Conta de Negócios do WhatsApp.

Este endpoint oferece suporte à gestão completa de números de telefone, incluindo atualizações de status,

configuração de webhook, configurações de segurança e gerenciamento de perfil de negócios.

Operações Suportadas:

- Atualizar o status de conexão entre a Conta de Negócios do WhatsApp e o número de telefone
- Configurar endpoints de webhook para notificações de entrega de mensagens
- Configurar verificação em duas etapas e notificações de segurança
- Atualizar nomes de exibição para verificação de nome
- Configurar visibilidade de pesquisa e configurações de privacidade
- Definir nome de usuário para a Conta de Negócios do WhatsApp
- Substituir URIs de callback de webhook para notificações de mensagens

Requisitos de Lógica de Negócios:

- O aplicativo deve estar vinculado à Conta de Negócios do WhatsApp
- A assinatura de webhook deve existir antes de configurar substituições de URI de callback
- A verificação de URI de callback é realizada para URLs externas
- URLs internas são permitidas para ambientes de desenvolvimento

Limitação de Taxa:

A limitação de taxa de uso do caso de uso do WhatsApp se aplica. Use lógica de retry apropriada com backoff exponencial.

Validações de Segurança:

- Validação de vinculação de aplicativo à WABA é aplicada
- Verificação de URI de callback de webhook é necessária para URLs externas
- Verificações de sistema de integração de negócios para onboarding de bot de IA
- Verificações de capacidade para acesso de aplicativos de primeira parte

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "connection_status": "CONNECTED"
}'
```

```json
{
  "message_sent": {
    "summary": "Message sent successfully",
    "value": {
      "messaging_product": "whatsapp",
      "contacts": {
        "0": {
          "input": "+1234567890",
          "wa_id": "1234567890"
        }
      },
      "messages": {
        "0": {
          "id": "wamid.HBgLMTY3NzE4NDM4NjAVAgARGBI5QTRCMEM4RjA2NzY4RTlBNAA="
        }
      }
    }
  },
  "settings_updated": {
    "summary": "Settings updated successfully",
    "value": {
      "success": true
    }
  },
  "phone_registered": {
    "summary": "Phone number registered successfully",
    "value": {
      "success": true
    }
  },
  "code_verified": {
    "summary": "Verification code verified successfully",
    "value": {
      "success": true
    }
  },
  "two_step_verification_set": {
    "summary": "Two-step verification code set successfully",
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

O ID do número de telefone da sua Conta de Negócios do WhatsApp (CSID). Esse ID é fornecido quando você registra o número de telefone e pode ser encontrado no Gerenciador de Negócios do WhatsApp.

Corpo da solicitaçãoOpcional

Parâmetros de configuração para atualizar o status e as configurações do número de telefone.

Todos os parâmetros são opcionais e podem ser combinados em uma única solicitação.

Tipo de conteúdo:application/json

Esquema:PhoneNumberStatusUpdateRequest

Mostrar atributos secundários

PhoneNumberStatusUpdateRequest

connection\_statusWhatsAppBusinessAccountToNumberStatus

Status de conexão entre a Conta de Negócios do WhatsApp e o número de telefone

webhook\_urlstring (uri)

URL do Webhook para receber notificações de mensagens

whatsapp\_business\_api\_dataWhatsAppBusinessApiData

Dados de configuração da API do WhatsApp Business

Mostrar atributos secundários

pinstring

PIN de verificação em duas etapas (pode ser uma string vazia)

show\_security\_notificationsboolean

Se mostrar notificações de segurança

notify\_user\_change\_numberboolean

Se notificar os usuários ao alterar o número

pinstring

PIN de verificação em duas etapas (pode ser uma string vazia)

search\_visibilityWAAPIBusinessGlobalSearchStateStatus

Status de visibilidade de pesquisa para a Conta de Negócios do WhatsApp

webhook\_configurationWebhookConfiguration

Configurações de configuração de webhook

Mostrar atributos secundários

override\_callback\_uristring (uri)·obrigatório

Substituir URI de retorno de chamada para notificações de webhook (pode ser uma string vazia)

verify\_tokenstring

Token usado para verificar solicitações de webhook

new\_display\_namestring

Novo nome de exibição para solicitação de verificação de nome

usernamestring

Nome de usuário para a Conta de Negócios do WhatsApp

Respostas

Atualize o status e a configuração de um número de telefone de uma Conta de Negócios do WhatsApp.

Este endpoint oferece suporte à gestão completa de números de telefone, incluindo atualizações de status,

configuração de webhook, configurações de segurança e gerenciamento de perfil de negócios.

Operações Suportadas:

- Atualizar o status de conexão entre a Conta de Negócios do WhatsApp e o número de telefone
- Configurar endpoints de webhook para notificações de entrega de mensagens
- Configurar verificação em duas etapas e notificações de segurança
- Atualizar nomes de exibição para verificação de nome
- Configurar visibilidade de pesquisa e configurações de privacidade
- Definir nome de usuário para a Conta de Negócios do WhatsApp
- Substituir URIs de callback de webhook para notificações de mensagens

Requisitos de Lógica de Negócios:

- O aplicativo deve estar vinculado à Conta de Negócios do WhatsApp
- A assinatura de webhook deve existir antes de configurar substituições de URI de callback
- A verificação de URI de callback é realizada para URLs externas
- URLs internas são permitidas para ambientes de desenvolvimento

Limitação de Taxa:

A limitação de taxa de uso do caso de uso do WhatsApp se aplica. Use lógica de retry apropriada com backoff exponencial.

Validações de Segurança:

- Validação de vinculação de aplicativo à WABA é aplicada
- Verificação de URI de callback de webhook é necessária para URLs externas
- Verificações de sistema de integração de negócios para onboarding de bot de IA
- Verificações de capacidade para acesso de aplicativos de primeira parte

200

Operação concluída com sucesso

Tipo de conteúdo:application/json

Esquema:Must be one of: MessageResponse, SuccessResponse

Mostrar atributos secundários

Must be one of: MessageResponse, SuccessResponse

MessageResponse

Resposta ao enviar uma mensagem

Mostrar atributos secundários

messaging\_product"whatsapp"·obrigatório

Serviço de mensagens

contactsarray of ContactResponse·obrigatório

Informações de contato

Mostrar atributos secundários

contacts\[\]ContactResponse

Mostrar atributos secundários

inputstring·obrigatório

Digite o número de telefone

wa\_idstring

ID do WhatsApp

messagesarray of MessageResponseItem·obrigatório

Informações da mensagem

Mostrar atributos secundários

messages\[\]MessageResponseItem

Mostrar atributos secundários

idstring·obrigatório

ID da Mensagem

SuccessResponse

Resposta de sucesso genérica

Mostrar atributos secundários

successboolean·obrigatório

Status de sucesso da operação

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