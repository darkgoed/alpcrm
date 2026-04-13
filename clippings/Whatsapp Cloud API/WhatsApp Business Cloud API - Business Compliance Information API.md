---
title: "WhatsApp Business Cloud API - Business Compliance Information API"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/business-compliance-information-api"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

Esse conteúdo foi traduzido automaticamente. [Mostrar original](#)

## WhatsApp Business Cloud API - API de Informações de Conformidade Comercial

Copiar para LLM

[Ver como Markdown](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/business-compliance-information-api/v23.0.md/)

Recuperar informações de conformidade da conta do WhatsApp Business para requisitos regulamentares.

Retorna detalhes da entidade empresarial, status de registro e informações de contato

para oficiais de reclamações e atendimento ao cliente (principalmente para empresas com sede na Índia).

Este endpoint permite que as empresas recuperem informações de conformidade abrangentes, incluindo detalhes da entidade, status de registro e informações de contato necessárias para fins de conformidade regulamentar.

## URL base

https://graph.facebook.com

## Pontos de extremidade

| GET | [/{Version}/{Phone-Number-ID}/business\_compliance\_info](#get-version-phone-number-id-business-compliance-info) |
| --- | --- |
| POST | [/{Version}/{Phone-Number-ID}/business\_compliance\_info](#post-version-phone-number-id-business-compliance-info) |

## GET /{Version}/{Phone-Number-ID}/business\_compliance\_info

Recuperar informações de conformidade empresarial abrangentes para um número de telefone de conta de negócios do WhatsApp,

incluindo detalhes da entidade, status de registro e informações de contato necessárias para conformidade regulamentar.

Casos de Uso:

- Recuperar informações de conformidade empresarial para relatórios regulamentares
- Verificar o status de registro da entidade empresarial e detalhes de contato
- Acessar informações do oficial de reclamações e atendimento ao cliente
- Suportar auditorias de conformidade e processos de verificação regulamentar

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Armazenamento em Cache:

As informações de conformidade podem ser armazenadas em cache por períodos moderados, mas devem ser atualizadas regularmente

para garantir a precisão para fins regulamentares. Implemente estratégias de invalidação de cache apropriadas.

### Sintaxe da solicitação

**GET** /{Version}/{Phone-Number-ID}/business\_compliance\_info

Testar

```shell
curl --request GET \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/business_compliance_info' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

```json
{
  "complete_compliance_info": {
    "summary": "Complete compliance information with all details",
    "value": {
      "data": {
        "0": {
          "whatsapp_business_account_id": "1234567890123456",
          "messaging_product": "whatsapp",
          "entity_name": "Lucky Shrub Private Limited",
          "entity_type": "Partnership",
          "entity_type_custom": "",
          "is_registered": true,
          "grievance_officer_details": {
            "name": "Chandravati P.",
            "email": "chandravati@luckyshrub.com",
            "mobile_number": "+913854559033",
            "landline_number": "+913857614343"
          },
          "customer_care_details": {
            "email": "support@luckyshrub.com",
            "mobile_number": "+913854559033",
            "landline_number": "+913857614343"
          }
        }
      }
    }
  },
  "minimal_compliance_info": {
    "summary": "Minimal compliance information for unregistered business",
    "value": {
      "data": {
        "0": {
          "whatsapp_business_account_id": "2345678901234567",
          "messaging_product": "whatsapp",
          "entity_name": "",
          "entity_type": "",
          "entity_type_custom": "",
          "is_registered": false,
          "grievance_officer_details": "",
          "customer_care_details": ""
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

O ID do número de telefone da sua Conta de Negócios do WhatsApp. Esse ID pode ser encontrado no Gerenciador de Negócios do WhatsApp ou por meio de APIs de gerenciamento de números de telefone.

Query Parameters

fieldsstring

Lista separada por vírgulas dos campos a serem incluídos na resposta. Se não especificado, os campos padrão serão retornados. Campos disponíveis: messaging\_product, entity\_name, entity\_type, entity\_type\_custom, is\_registered, grievance\_officer\_details, customer\_care\_details

Respostas

Recuperar informações de conformidade empresarial abrangentes para um número de telefone de conta de negócios do WhatsApp,

incluindo detalhes da entidade, status de registro e informações de contato necessárias para conformidade regulamentar.

Casos de Uso:

- Recuperar informações de conformidade empresarial para relatórios regulamentares
- Verificar o status de registro da entidade empresarial e detalhes de contato
- Acessar informações do oficial de reclamações e atendimento ao cliente
- Suportar auditorias de conformidade e processos de verificação regulamentar

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Armazenamento em Cache:

As informações de conformidade podem ser armazenadas em cache por períodos moderados, mas devem ser atualizadas regularmente

para garantir a precisão para fins regulamentares. Implemente estratégias de invalidação de cache apropriadas.

200

Informações de conformidade empresarial recuperadas com sucesso

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

dataarray of BusinessComplianceInfo

Mostrar atributos secundários

data\[\]BusinessComplianceInfo

Informações de conformidade e detalhes regulamentares da Conta de Negócios do WhatsApp

Mostrar atributos secundários

whatsapp\_business\_account\_idstring·obrigatório

Identificador único para a Conta de Negócios do WhatsApp

messaging\_product"whatsapp"

Identificador do produto de mensagens, sempre 'whatsapp' para WhatsApp Business

entity\_namestring

Nome legal da entidade empresarial

entity\_typestring

Tipo de entidade empresarial (por exemplo, Parceria, Empresa de Responsabilidade Limitada, etc.)

Mostrar atributos secundários

entity\_type\_customstring

Descrição do tipo de entidade personalizado quando os tipos padrão não se aplicam

is\_registeredboolean

Se a entidade empresarial está oficialmente registrada junto às autoridades reguladoras

grievance\_officer\_detailsGrievanceOfficerDetails

Informações de contato do encarregado de tratamento de reclamações

Mostrar atributos secundários

namestring

Nome completo do oficial de reclamações

emailstring (email)

Endereço de e-mail para contato do oficial de reclamações

mobile\_numberstring

Número de telefone celular do encarregado de atendimento de reclamações (com código de país)

landline\_numberstring

Número de telefone fixo do encarregado de atendimento de reclamações (com código de país)

customer\_care\_detailsCustomerCareDetails

Informações de contato para atendimento ao cliente e suporte

Mostrar atributos secundários

emailstring (email)

Endereço de e-mail para contato com atendimento ao cliente

mobile\_numberstring

Número de telefone celular para atendimento ao cliente (com código de país)

landline\_numberstring

Número de telefone fixo para atendimento ao cliente (com código de país)

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

## POST /{Version}/{Phone-Number-ID}/business\_compliance\_info

Criar ou atualizar informações de conformidade comercial abrangentes para um número de telefone de conta de negócios do WhatsApp,

incluindo detalhes da entidade, status de registro e informações de contato necessárias para conformidade regulamentar.

Casos de Uso:

- Definir informações de conformidade comercial para relatórios regulamentares
- Atualizar status e detalhes de registro da entidade comercial
- Configurar informações de contato do oficial de reclamações e atendimento ao cliente
- Garantir a precisão dos dados de conformidade para fins regulamentares
- Suportar a configuração de conformidade para novas operações comerciais

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Regras de Validação:

- `entity_name` é obrigatório e deve ter entre 2 e 128 caracteres
- `entity_type` é obrigatório e deve ser um valor de enumeração de tipo de entidade válido
- `entity_type_custom` é obrigatório quando `entity_type` for "Outro"
- `entity_type_custom` não pode ser usado com tipos de entidade diferentes de "Outro"
- `is_registered` só pode ser usado com tipos de entidade "Outro" ou "Parceria"
- `grievance_officer_details` é obrigatório com informações de contato completas
- `customer_care_details` é obrigatório com informações de contato
- Números de telefone devem estar no formato internacional válido com código de país
- Endereços de e-mail devem estar no formato válido e ter menos de 128 caracteres

### Sintaxe da solicitação

**POST** /{Version}/{Phone-Number-ID}/business\_compliance\_info

Testar

```shell
curl --request POST \
  --url 'https://graph.facebook.com/{Version}/{Phone-Number-ID}/business_compliance_info' \
  --header 'Authorization: Bearer <Token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "messaging_product": "whatsapp",
  "entity_name": "Lucky Shrub Private Limited",
  "entity_type": "PARTNERSHIP",
  "is_registered": true,
  "grievance_officer_details": {
    "name": "Chandravati P.",
    "email": "chandravati@luckyshrub.com",
    "mobile_number": "+913854559033",
    "landline_number": "+913857614343"
  },
  "customer_care_details": {
    "email": "support@luckyshrub.com",
    "mobile_number": "+913854559033",
    "landline_number": "+913857614343"
  }
}'
```

```json
{
  "successful_update": {
    "summary": "Successful compliance information update",
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

O ID do número de telefone da sua Conta de Negócios do WhatsApp. Esse ID pode ser encontrado no Gerenciador de Negócios do WhatsApp ou por meio de APIs de gerenciamento de números de telefone.

Corpo da solicitaçãoObrigatório

Tipo de conteúdo:application/json

Esquema:BusinessComplianceInfoUpdateRequest

Mostrar atributos secundários

BusinessComplianceInfoUpdateRequest

messaging\_product"whatsapp"·obrigatório

Identificador do produto de mensagens, deve ser 'whatsapp'

entity\_namestring·obrigatório

Nome legal da entidade empresarial

entity\_typeBusinessEntityType·obrigatório

Tipo de entidade empresarial para fins de conformidade

Mostrar atributos secundários

entity\_type\_customstring

Descrição do tipo de entidade personalizada quando entity\_type é "OUTRO". Obrigatório para o tipo de entidade OUTRO.

is\_registeredboolean

Se a entidade empresarial está oficialmente registrada com as autoridades reguladoras. Somente pode ser usado com os tipos de entidade "OUTRO" ou "PARCERIA".

grievance\_officer\_detailsGrievanceOfficerUpdateDetails·obrigatório

Informações de contato do oficial de reclamações designado

Mostrar atributos secundários

namestring·obrigatório

Nome completo do oficial de reclamações

emailstring (email)·obrigatório

Endereço de e-mail para contato do oficial de reclamações

mobile\_numberstring

Número de telefone celular do encarregado de atendimento de reclamações (com código de país)

landline\_numberstring

Número de telefone fixo do encarregado de reclamações (com código de país)

customer\_care\_detailsCustomerCareUpdateDetails·obrigatório

Informações de contato para atendimento ao cliente e suporte

Mostrar atributos secundários

emailstring (email)·obrigatório

Endereço de e-mail para contato com atendimento ao cliente

mobile\_numberstring

Número de telefone celular para atendimento ao cliente (com código de país)

landline\_numberstring

Número de telefone fixo para atendimento ao cliente (com código de país)

Respostas

Criar ou atualizar informações de conformidade comercial abrangentes para um número de telefone de conta de negócios do WhatsApp,

incluindo detalhes da entidade, status de registro e informações de contato necessárias para conformidade regulamentar.

Casos de Uso:

- Definir informações de conformidade comercial para relatórios regulamentares
- Atualizar status e detalhes de registro da entidade comercial
- Configurar informações de contato do oficial de reclamações e atendimento ao cliente
- Garantir a precisão dos dados de conformidade para fins regulamentares
- Suportar a configuração de conformidade para novas operações comerciais

Limitação de Taxa:

As limitações de taxa padrão da API do Graph se aplicam. Use lógica de repetição apropriada com backoff exponencial.

Regras de Validação:

- `entity_name` é obrigatório e deve ter entre 2 e 128 caracteres
- `entity_type` é obrigatório e deve ser um valor de enumeração de tipo de entidade válido
- `entity_type_custom` é obrigatório quando `entity_type` for "Outro"
- `entity_type_custom` não pode ser usado com tipos de entidade diferentes de "Outro"
- `is_registered` só pode ser usado com tipos de entidade "Outro" ou "Parceria"
- `grievance_officer_details` é obrigatório com informações de contato completas
- `customer_care_details` é obrigatório com informações de contato
- Números de telefone devem estar no formato internacional válido com código de país
- Endereços de e-mail devem estar no formato válido e ter menos de 128 caracteres

200

Informações de conformidade empresarial atualizadas com sucesso

Tipo de conteúdo:application/json

Esquema:object

Mostrar atributos secundários

successboolean·obrigatório

Indicates whether the compliance information was successfully updated

400

Requisição Inválida - Parâmetros inválidos ou erros de validação

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