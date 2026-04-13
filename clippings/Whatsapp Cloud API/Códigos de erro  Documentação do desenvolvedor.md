---
title: "Códigos de erro | Documentação do desenvolvedor"
source: "https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes"
author:
published:
created: 2026-04-13
description:
tags:
  - "clippings"
---
WhatsApp Business Platform

## Códigos de erro

Updated: 6 de abr de 2026

A API de Nuvem é desenvolvida na Graph API. Caso não saiba como lidar com as respostas de erro da Graph API, consulte a documentação [Como solucionar erros da Graph API](https://developers.facebook.com/docs/graph-api/guides/error-handling).

Em geral, recomendamos desenvolver a lógica de tratamento de erros do app em torno de valores `code` e propriedades da carga `details`. Essas propriedades e valores são um indicador mais confiável do erro subjacente.

Os títulos de código, que não têm uma propriedade dedicada nas cargas de respostas de erro de API, são incluídos como parte do valor `message`. No entanto, não recomendamos que você dependa deles na lógica de como lidar com erros, pois eles podem estar obsoletos.

**Recebimento de erros síncronos e assíncronos**

Os erros da API de Nuvem são retornados como resposta da Graph API de modo síncrono, via Webhook de forma assíncrona ou pelos dois métodos.

Ao trabalhar com a API de Nuvem, recomendamos monitorar tanto a resposta da Graph API quanto o webhook `messages` para a solução de erros. Se tiver assinado o campo `messages` do webhook, você receberá notificações dos tipos de erros assíncronos compatíveis quando eles ocorrerem.

Os erros da API de Nuvem podem aparecer nos seguintes objetos de webhook:

- `entry.changes.value.errors`
- `entry.changes.value.messages.errors`

**Sintaxe de resposta a erros**

```
{
  "error": {
    "message": "<MESSAGE>",
    "type": "<TYPE>",
    "code": <CODE>,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "<DETAILS>"
    },
    "error_subcode": <ERROR_SUBCODE>,
    "fbtrace_id": "<FBTRACE_ID>"
  }
}
```

| Propriedade | Tipo de valor | Descrição |
| --- | --- | --- |
| `code` | Número inteiro | Código de erro. Recomendamos desenvolver o tratamento de erros do app em torno de códigos de erro em vez de subcódigos ou códigos de status da resposta HTTP. |
| `details` | String | Descrição do erro e do motivo mais provável. Também pode conter informações sobre como resolver o erro. Por exemplo, qual parâmetro é inválido ou quais valores são aceitáveis. |
| `error_subcode` | Número inteiro | **Obsoleto. Não será retornado em respostas da versão 16.0 ou posteriores.**     Subcódigo da Graph API. Nem todas as respostas incluirão um subcódigo. Por isso, recomendamos que você desenvolva a própria lógica de como lidar com erros em relação ao valor `code` e à propriedade `details`. |
| `fbtrace_id` | String |  |
| `message` | String | Combinação do código de erro e do título. Por exemplo: `(#130429) Rate limit hit`. |
| `messaging_product` | String | Produto de mensagens. Será sempre a string `whatsapp` para respostas da API de Nuvem. |
| `type` | String | Tipo de erro. |

## Exemplo de resposta

```
{
  "error": {
    "message": "(#130429) Rate limit hit",
    "type": "OAuthException",
    "code": 130429,
    "error_data": {
        "messaging_product": "whatsapp",
        "details": "Cloud API message throughput has been reached."
    },
    "error_subcode": 2494055,
    "fbtrace_id": "Az8or2yhqkZfEZ-_4Qn_Bam"
  }
}
```

| Código | Detalhes | Possíveis motivos e soluções | Código de status HTTP |
| --- | --- | --- | --- |
| `0`  AuthException | Não foi possível autenticar o usuário do app. | Geralmente, isso significa que o token de acesso incluído expirou, foi invalidado ou que o usuário do app alterou uma configuração para impedir que todos os apps acessem os dados dele. Recomendamos que você [gere um novo token de acesso](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens). | `401`  Não autorizado |
| `3`  Método da API | Indica um problema que envolve recursos ou permissões. | Use o [depurador de token de acesso](https://developers.facebook.com/tools/debug/accesstoken) para verificar se as permissões necessárias foram concedidas ao seu app pelo ponto de extremidade. Consulte [Erros de autenticação e autorização](https://developers.facebook.com/documentation/business-messaging/whatsapp/support#authentication-authorization). | `500`  Erro interno do servidor |
| `10`  Permissão negada | A permissão não foi concedida ou foi removida. | Use o [depurador de token de acesso](https://developers.facebook.com/tools/debug/accesstoken) para verificar se as permissões necessárias foram concedidas ao seu app pelo ponto de extremidade.  Para o WhatsApp Flows com ponto de extremidade: verifique se o número de telefone usado para [definir a chave pública da empresa](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/whatsapp-business-encryption#set-business-public-key) está na lista de permissões.  Verifique os requisitos de qualificação da API que você está tentando acessar. Se você não tiver acesso aos pontos de extremidade, receberá esse código de erro. | `403`  Proibido |
| `190`  O token de acesso expirou | O token de acesso expirou. | Obtenha um novo [token de acesso](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens). | `401`  Não autorizado |
| `200-299`  Permissão da API | A permissão não foi concedida ou foi removida. | Use o [depurador de token de acesso](https://developers.facebook.com/tools/debug/accesstoken) para verificar se as permissões necessárias foram concedidas ao seu app pelo ponto de extremidade. Consulte [Erros de autenticação e autorização](https://developers.facebook.com/documentation/business-messaging/whatsapp/support#authentication-authorization). | `403`  Proibido |

| Código | Detalhes | Possíveis motivos e soluções | Código de status HTTP |
| --- | --- | --- | --- |
| `368`  Bloqueado temporariamente por violações de políticas | A conta do WhatsApp Business associada ao app foi restringida ou desabilitada por violar uma política da plataforma. | Consulte o documento [Aplicação das políticas](https://developers.facebook.com/documentation/business-messaging/whatsapp/policy-enforcement) para saber mais sobre as violações das políticas e como solucioná-las. | `403`  Proibido |
| `130497`  A conta comercial está impedida de enviar mensagens a usuários neste país. | A conta do WhatsApp Business está impedida de enviar mensagens para usuários em determinados países. |  | `403`  Proibido |
| `131031`  A conta foi bloqueada | A conta do WhatsApp Business associada ao app foi restringida ou desabilitada por violar uma política da plataforma ou não foi possível verificar os dados incluídos no pedido em relação ao conjunto de dados na conta do WhatsApp Business (por exemplo, o pin de duas etapas incluído no pedido está incorreto). | Consulte o documento [Aplicação das políticas](https://developers.facebook.com/documentation/business-messaging/whatsapp/policy-enforcement) para saber mais sobre as violações das políticas e como solucioná-las.   Você também pode usar a [API de Status de Integridade](https://developers.facebook.com/documentation/business-messaging/whatsapp/support/health-status), que pode fornecer mais insights sobre os motivos para o bloqueio da conta. | `403`  Proibido |

| Erro | Descrição | Solução possível |
| --- | --- | --- |
| `2388040` – limite de caracteres excedido | Um campo do modelo excedeu o limite máximo de caracteres permitido. | Verifique a mensagem de erro para ver detalhes específicos sobre o campo afetado e os limites de caracteres correspondentes. |
| `2388047` – o formato do cabeçalho da mensagem está incorreto | O cabeçalho da mensagem contém formatação inválida. | Verifique a mensagem de erro para ver detalhes sobre a formatação válida. |
| `2388072` – formato do corpo da mensagem incorreto | O corpo da mensagem contém formatação inválida. | Verifique a mensagem de erro para ver detalhes sobre a formatação válida. |
| `2388073` – o formato do rodapé da mensagem está incorreto | O rodapé da mensagem contém formatação inválida. | Verifique a mensagem de erro para ver detalhes sobre a formatação válida. |
| `2388293` – a proporção entre palavras e parâmetros excede o limite | Esse modelo contém muitas variáveis para sua extensão. Reduza o número de variáveis ou aumente a extensão da mensagem. | Verifique a mensagem de erro para ver detalhes sobre a formatação válida. |
| `2388299` – parâmetros iniciais ou finais não permitidos | As variáveis não podem estar no início ou no fim do modelo. | Verifique a mensagem de erro para ver detalhes sobre a formatação válida. |

| Erro | Descrição | Solução possível |
| --- | --- | --- |
| `2388019 ` – limite de modelo de mensagem excedido | Você excedeu o máximo de modelos de mensagem permitidos para esta conta do WhatsApp Business. | Uma conta do WhatsApp Business pode ter até 250 modelos de mensagem. Consulte [Limites de modelos](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview#template-limits). |

| Erro | Descrição | Solução possível |
| --- | --- | --- |
| `2388012` – o número já existe na sua lista de números de telefone. | O número de telefone que você está tentando migrar já está presente na sua conta do WhatsApp. | Tente novamente com um número de telefone que ainda não esteja presente na sua conta do WhatsApp. |
| `2388091`, `2388093` – o número de telefone não está qualificado para receber/verificar um código de registro porque não está sendo migrado. | As APIs de verificação de propriedade do telefone não estão disponíveis para esse caso de uso. | [Registre e verifique o número](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/registering-phone-numbers). |
| `2388103` – não é possível migrar o número de telefone. | Os webhooks não foram configurados para a conta de destino do WhatsApp Business. | [Assine webhooks para seu app](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview) na conta do WhatsApp Business de destino. |
| `2388103` – adicione esse número de telefone à sua conta do WhatsApp | Esse número de telefone pode ser adicionado diretamente e não requer o uso de APIs de migração de telefone. | [Registre e verifique o número](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/registering-phone-numbers). |
| `2388103` – o nome registrado deve estar presente e aprovado. | O número de telefone comercial deve ter um nome de exibição aprovado (`name_status` é `APPROVED`) e não pode ter pedidos de alteração de nome de exibição pendentes. | O [nome de exibição](https://developers.facebook.com/documentation/business-messaging/whatsapp/display-names) do seu número de telefone comercial precisa ser aprovado. |
| `2388103` – a conta do WhatsApp em que o número de telefone está registrado não está configurada corretamente. | A conta do WhatsApp Business de origem e a opção "enviar mensagem em nome de" devem ser aprovadas. | A conta do WhatsApp Business pode estar usando o [modelo de propriedade "Em nome de", que agora está obsoleto](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/obo-model-deprecation).  Entrar em contato com o suporte. |
| `2388103` – sua conta do WhatsApp não tem uma conta de pagamento. | Sua conta do WhatsApp deve ter uma linha de crédito ativa para que você possa enviar mensagens após a migração. |  |
| `2388103` – ocorreu um erro ao migrar o número de telefone. | Ocorreu um erro ao migrar seu número de telefone. | Tente novamente mais tarde. Se isso não funcionar, [entre em contato com o suporte](https://developers.facebook.com/documentation/business-messaging/whatsapp/support). |
| `2388103` – esse número de telefone pertence a uma conta diferente do Gerenciador de Negócios. | As contas do WhatsApp Business de origem e destino devem representar a mesma empresa. | [Migre o número de telefone](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/support/migrating-phone-numbers-among-solution-partners-programmatically) para uma conta do WhatsApp Business que envia mensagens para a mesma empresa que a conta do WhatsApp Business de origem. |
| `2388103` – sua conta do WhatsApp precisa ser aprovada | Para que você possa migrar números de telefone, a conta do WhatsApp Business de destino precisa ser aprovada. |  |
| `2388103` – o pedido "Mensagens para" da sua conta do WhatsApp deve ser aprovado | O cliente precisa aprovar o pedido "Mensagens para" da conta do WhatsApp Business de destino. | Peça ao cliente para aceitar seu pedido de "Mensagens para" no Meta Business Suite. |
| `2494100` – a conta está no modo de manutenção. | O número de telefone comercial está em modo de manutenção. | Tente novamente dentro de alguns minutos. |

| Erro | Descrição | Solução possível |
| --- | --- | --- |
| `200005` – insights sobre o modelo indisponíveis | Os insights sobre o modelo ainda não estão disponíveis para esta conta do WhatsApp Business. | No momento, não é possível habilitar insights sobre o modelo para esta conta do WhatsApp Business. |
| `200006` – não é possível desabilitar insights sobre o modelo | Operação inválida. Depois de habilitados, os insights sobre o modelo não poderão ser desabilitados. | Depois de habilitados para uma conta do WhatsApp Business, os insights sobre o modelo não podem ser desabilitados. |
| `200007` – insights sobre o modelo não habilitados | Os insights sobre o modelo não foram habilitados para esta conta do WhatsApp Business | Para habilitar os insights sobre o modelo, consulte [Como confirmar as análises de modelos](https://developers.facebook.com/documentation/business-messaging/whatsapp/analytics#confirming-template-analytics). |

| Erro | Descrição | Solução possível |
| --- | --- | --- |
| `2593079`  Insights sobre o modelo indisponíveis | Esta WABA já foi marcada para migração para uma identificação de solução diferente | O modelo de propriedade da conta OBO está [obsoleto](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/obo-model-deprecation). Entre em contato com o suporte para obter ajuda. |
| `2593085`  Conta do WhatsApp Business inválida para mobilidade OBO | A WABA não é qualificada para transferência de propriedade do tipo OBO. Os motivos possíveis são os seguintes:  - A WABA já pertence ao cliente comercial (ou seja, já usa o modelo de compartilhamento da WABA). - O cliente comercial ainda não aceitou o pedido de OBO no Meta Business Suite. | Informamos que o modelo de propriedade da conta OBO está [obsoleto](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/obo-model-deprecation). Entre em contato com o suporte para obter ajuda. |

| Código | Detalhes | Possíveis motivos e soluções | Código de status HTTP |
| --- | --- | --- | --- |
| `2593107`  Limite de pedidos de sincronização excedido | O número máximo de chamadas para a API de sincronização para este número de telefone foi excedido. | Só é possível chamar esse ponto de extremidade uma vez para sincronizar os contatos do número de telefone empresarial e uma vez para sincronizar o histórico de mensagens. Consulte [Como integrar usuários do app de negócios](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users#synchronizing-whatsapp-business-app-data).  Desfaça a integração do cliente empresarial e depois refaça o processo de integração dele. | `400`  Solicitação incorreta |
| `2593108`  Pedido de sincronização feito fora do intervalo de tempo permitido | O pedido de sincronização só pode ser feito em até 24 horas depois da integração | Só é possível iniciar a sincronização dos contatos e do histórico de mensagens de um usuário integrado do app WhatsApp Business dentro de 24 horas depois da integração do usuário. Consulte [Como integrar usuários do app de negócios](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users#synchronizing-whatsapp-business-app-data).  Desfaça a integração do usuário e depois refaça o processo de integração dele. | `400`  Solicitação incorreta |

| Código | Detalhes | Possíveis motivos e soluções | Código de status HTTP |
| --- | --- | --- | --- |
| `4`  Quantidade excessiva de chamadas à API | O app atingiu o limite da taxa de chamadas de API. | Carregue o app no [Painel de Apps](https://developers.facebook.com/apps) e veja a seção **Limite de volume do app** para conferir se o [limite de volume](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#wa-biz-api) foi atingido. Em caso afirmativo, tente novamente mais tarde ou reduza a frequência ou a quantidade de consultas da API que o app está fazendo. | `400`  Solicitação incorreta |
| `80007`  Problemas com limite de volume | A conta do WhatsApp Business atingiu o limite de volume. | Consulte os [Limites de volume](https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform#rate-limits) da conta do WhatsApp Business. Tente novamente mais tarde ou reduza a frequência ou a quantidade de consultas da API que o app está fazendo. | `400`  Solicitação incorreta |
| `130429`  Limite de volume atingido | A taxa de transferência de dados de mensagens da API de Nuvem foi atingida. | O app atingiu o limite da taxa de transferência da API. Consulte [Taxa de transferência de dados](https://developers.facebook.com/documentation/business-messaging/whatsapp/throughput). Tente novamente mais tarde ou reduza a frequência com que o app envia mensagens. | `400`  Solicitação incorreta |
| `131048`  Limite de taxa de spam atingido | Falha ao enviar a mensagem devido a um limite de envios que podem ser feitos deste número de telefone. É possível que muitas mensagens anteriores tenham sido bloqueadas ou marcadas como spam. | Verifique seu status de qualidade no Gerenciador do WhatsApp. Consulte [Limites de modelo](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview#template-limits) e [Qualidade do modelo](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-quality). | `400`  Solicitação incorreta |
| `131056`  Limite de volume de emparelhamento atingido (conta comercial, conta de consumidor) | Foram enviadas muitas mensagens do número de telefone do remetente para o mesmo número de telefone do destinatário em um curto período. | Aguarde e realize novamente a operação se quiser enviar mensagens para o mesmo número de telefone. Você ainda pode enviar mensagens para um número diferente sem esperar | `400`  Solicitação incorreta |
| `133016`  Limite de taxa de registro/exclusão de contas excedido | O registro ou a exclusão do registro falhou porque foram feitas muitas tentativas neste número de telefone em um curto período de tempo | O número de telefone comercial está sendo bloqueado porque atingiu o limite de tentativas de registro/cancelamento do registro. Tente novamente assim que o número for desbloqueado. Consulte a seção "Limitações" no documento [Registro](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration). | `400`  Solicitação incorreta |

| Código | Detalhes | Possíveis motivos e soluções | Código de status HTTP |
| --- | --- | --- | --- |
| `1`  API desconhecida | Pedido inválido ou possível erro do servidor. |  | `400`  Solicitação incorreta |
| `2`  Serviço de API | Há um erro temporário por inatividade ou sobrecarga. |  | `503`  Serviço indisponível |
| `33`  Valor do parâmetro não é válido | O número de telefone comercial foi excluído. | Verifique se o número de telefone comercial está correto. | `400`  Solicitação incorreta |
| `100`  Parâmetro inválido | O pedido incluía um ou mais parâmetros incompatíveis ou escritos de forma errada. | Consulte a referência do ponto de extremidade para determinar quais parâmetros são compatíveis e como são escritos.  Para o WhatsApp Flows com ponto de extremidade: ao configurar a chave pública da empresa, verifique se ela é uma [chave RSA pública e válida de 2.048 bits no formato PEM](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/whatsapp-business-encryption#gen).  Verifique se não há incompatibilidade entre o ID do número de telefone que você [está registrando](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/registering-phone-numbers) e outro armazenado anteriormente.  Verifique se o parâmetro está dentro de qualquer restrição de tamanho para o tipo. | `400`  Solicitação incorreta |
| `130472`  O número do usuário faz parte de um experimento | A mensagem não foi enviada como parte de um [experimento](https://developers.facebook.com/documentation/business-messaging/whatsapp/support/experiments). | Consulte [Experimento de mensagem de marketing](https://developers.facebook.com/documentation/business-messaging/whatsapp/support/experiments#marketing-message-experiment). | `400`  Solicitação incorreta |
| `131000`  Ocorreu um erro | Falha ao enviar a mensagem devido a um erro desconhecido. |  | `500`  Erro interno do servidor |
| `131005`  Acesso negado | A permissão não foi concedida ou foi removida. | Use o [depurador de token de acesso](https://developers.facebook.com/tools/debug/accesstoken) para verificar se as permissões necessárias foram concedidas ao seu app pelo ponto de extremidade. Consulte [Erros de autenticação e autorização](https://developers.facebook.com/documentation/business-messaging/whatsapp/support#authentication-authorization). | `403`  Proibido |
| `131008`  O parâmetro obrigatório está ausente | Falta um parâmetro obrigatório no pedido. | Consulte a referência do ponto de extremidade para determinar quais parâmetros são necessários. | `400`  Solicitação incorreta |
| `131009`  Valor do parâmetro não é válido | Um ou mais valores de parâmetros são inválidos. | Consulte a referência do ponto de extremidade para determinar quais valores são compatíveis com cada parâmetro. Confira a documentação [Números de telefone](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers) para saber como adicionar um número a uma conta do WhatsApp Business. | `400`  Solicitação incorreta |
| `131016`  Serviço indisponível | Um serviço está temporariamente indisponível. |  | `500`  Erro interno do servidor |
| `131021`  O destinatário não pode ser o remetente | O número de telefone do destinatário e do remetente é o mesmo. | Envie uma mensagem para um número de telefone diferente daquele do remetente. | `400`  Solicitação incorreta |
| `131026`  A mensagem não pode ser entregue | Não foi possível entregar a mensagem. Os motivos podem ser os seguintes:  - O número de telefone do destinatário não está registrado no WhatsApp. - O destinatário não aceitou os novos Termos de Serviço e a nova Política de Privacidade. - O destinatário está usando uma versão antiga do WhatsApp. É preciso usar as seguintes versões do WhatsApp (ou posteriores): 	- Android: 2.21.15.15 		- SMBA: 2.21.15.15 		- iOS: 2.21.170.4 		- SMBI: 2.21.170.4 		- KaiOS: 2.2130.10 		- Web: 2.2132.6 | Usando um método de comunicação diferente do WhatsApp, peça ao usuário do WhatsApp para fazer o seguinte:  - Confirmar se é possível enviar uma mensagem para seu número de telefone do WhatsApp Business. - Confirmar se nossos Termos de Serviço mais recentes foram aceitos (caso contrário, será necessário acessar **Configurações** > **Ajuda**, ou **Configurações** > **Informações sobre o app**, para aceitá-los) - Atualizar para a versão mais recente do cliente do WhatsApp. | `400`  Solicitação incorreta |
| `131037`  O nome de exibição do número fornecido pelo WhatsApp precisa ser aprovado antes que a mensagem possa ser enviada. | O número de telefone comercial [555](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview#555-business-phone-numbers) usado para enviar o pedido não tem um [nome de exibição](https://developers.facebook.com/docs/whatsapp/display-names) aprovado. |  | `400`  Solicitação incorreta |
| `131042`  Qualificação da empresa – problema com o pagamento | Ocorreu um erro relacionado à forma de pagamento. |  | `400`  Solicitação incorreta |
| `131045`  Certificado incorreto | Ocorreu uma falha ao enviar a mensagem devido a um erro de registro do número de telefone. | [Registre o número de telefone](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration) e tente novamente. | `500`  Erro interno do servidor |
| `131047`  Mensagem de reengajamento | Mais de 24 horas se passaram desde que o destinatário respondeu pela última vez ao número do remetente. | Envie um [modelo de mensagem](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview) ao destinatário. | `400`  Solicitação incorreta |
| `131049`  A Meta escolheu não entregar a mensagem. | Essa mensagem não foi entregue para manter o engajamento saudável do ecossistema. | Se você receber esse código de erro e suspeitar que seja devido ao limite, espere pelo menos 24 horas antes de reenviar a mensagem de modelo. Fazer isso só resultará em outra resposta de erro, já que o limite pode estar em vigor em diferentes períodos.  Consulte [Limites de mensagem de modelo de marketing por usuário](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits) para mais informações. | `400`  Solicitação incorreta |
| `131050`  O usuário não recebe mais mensagens de marketing. | Não é possível entregar a mensagem. O destinatário interrompeu o recebimento de mensagens de marketing da sua empresa no WhatsApp. | Não tente enviar mensagens novamente, já que elas não serão recebidas por este usuário. Para receber uma notificação sempre que um usuário do WhatsApp interromper ou retomar o recebimento de mensagens de modelo de marketing da sua empresa, assine o [webhook user\_preferences](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/user_preferences). | `400`  Solicitação incorreta |
| `131051`  Tipo de mensagem não compatível | O tipo de mensagem não é compatível. | Consulte [Mensagens](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#message-types) para ver os tipos de mensagem compatíveis antes de tentar novamente. | `400`  Solicitação incorreta |
| `131052`  Erro de download de mídia | Não foi possível baixar a mídia enviada pelo usuário. | Não foi possível baixar mídias incluídas na mensagem do usuário do WhatsApp. Para saber mais, consulte o valor `error.error_data.details` em webhooks de **mensagens** disparados quando esta mensagem foi recebida.  Peça ao usuário do WhatsApp para enviar o arquivo de mídia usando um método que não seja o WhatsApp. | `400`  Solicitação incorreta |
| `131053`  Erro de carregamento de mídia | Não foi possível carregar a mídia usada na mensagem. | Não foi possível carregar a mídia por um ou mais motivos, por exemplo, um tipo de mídia não compatível.  Para saber mais, consulte o valor `error.error_data.details` em webhooks de **mensagens** disparados quando houver falha no envio desta mensagem.  Recomendamos que você inspecione os arquivos de mídia que estão causando erros e confirme se eles são realmente compatíveis. Por exemplo, no UNIX, é possível usar a inspeção de arquivos por meio da linha de comando para determinar o tipo MIME:  `file -I rejected-file.mov`  Você pode então confirmar se o seu tipo MIME é compatível. Consulte [Tipos de mídia compatíveis](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media#supported-media-types). | `400`  Solicitação incorreta |
| `131057`  Conta em modo de manutenção | A conta comercial está em modo de manutenção | A conta do WhatsApp Business está em modo de manutenção. Talvez a conta esteja passando por uma atualização da [taxa de transferência de dados](https://developers.facebook.com/documentation/business-messaging/whatsapp/throughput). | `500`  Solicitação incorreta |
| `131063`  Modelos de marketing desabilitados para a API de Nuvem | Seu modelo é categorizado como Marketing, mas os modelos de marketing estão desabilitados na sua configuração da API de Nuvem. | A empresa definiu `disable_marketing_messages_on_cloud_api` como `true` na conta do WhatsApp Business. Para enviar esse modelo, use o ponto de extremidade da [API de Mensagens de Marketing para WhatsApp](https://developers.facebook.com/documentation/business-messaging/whatsapp/marketing-messages/send-marketing-messages) `/marketing_messages` ou [reabilite os modelos de marketing na API de Nuvem](https://developers.facebook.com/documentation/business-messaging/whatsapp/marketing-messages/send-marketing-messages#re-enable-marketing-messages-on-cloud-api) definindo `disable_marketing_messages_on_cloud_api` como `false`. | `400`  Solicitação incorreta |
| `132000`  Incompatibilidade na contagem de parâmetros do modelo | O número de valores de parâmetros variáveis incluídos no pedido não corresponde ao número de parâmetros variáveis definidos no modelo. | Consulte o documento [Modelos](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview#parameter-formats) para saber mais sobre parâmetros e garantir que o pedido inclua valores para todos os parâmetros exigidos pelo modelo. | `400`  Solicitação incorreta |
| `132001`  Modelo não existe | O modelo não existe no idioma especificado ou não foi aprovado. | Verifique se o modelo foi aprovado e se o nome e a localidade do idioma estão corretos. Consulte o documento [Modelos](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview) para saber mais sobre modelos. | `404`  Não encontrado |
| `132005`  Texto hidratado do modelo longo demais | O texto traduzido é longo demais. | Consulte o Gerenciador do WhatsApp para verificar se o seu modelo foi traduzido. Consulte o documento [Qualidade do modelo](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-quality) para saber como verificar o status do seu modelo. | `400`  Solicitação incorreta |
| `132007`  Política de caracteres do formato do modelo violada | O conteúdo do modelo viola uma política do WhatsApp. | Para saber mais sobre os possíveis motivos de violação, consulte o documento [Análise do modelo](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-review). | `400`  Solicitação incorreta |
| `132012`  Incompatibilidade no formato do parâmetro do modelo | Os valores de parâmetros variáveis foram formatados incorretamente. | Os valores de parâmetros variáveis incluídos no pedido não estão usando o formato especificado no modelo. Consulte o documento [Modelos](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview#parameter-formats) para saber mais sobre parâmetros e formatos de modelos. | `400`  Solicitação incorreta |
| `132015`  Modelo pausado | O modelo foi pausado por [baixa qualidade](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-quality) e não pode ser enviado em mensagens. | [Edite o modelo](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-management#edit-templates) para melhorar a qualidade e tente novamente após a aprovação. | `400`  Solicitação incorreta |
| `132016`  Modelo desabilitado | O modelo foi pausado muitas vezes por [baixa qualidade](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-quality) e foi desabilitado de forma permanente. | Crie um modelo novo com conteúdo diferente. | `400`  Solicitação incorreta |
| `132068`  O flow está bloqueado | O flow está no estado bloqueado. | Corrija o flow | `400`  Solicitação incorreta |
| `132069`  O flow é limitado | O flow está no estado limitado e 10 mensagens usando esse flow já foram enviadas na última hora. | Corrija o flow | `400`  Solicitação incorreta |
| `133000`  Cancelamento do registro incompleto | Uma tentativa anterior de cancelamento do registro falhou. | [Exclua o registro](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration#deregister-phone) do número novamente antes de [registrá-lo](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration). | `500`  Erro interno do servidor |
| `133004`  Servidor temporariamente indisponível | O servidor está temporariamente indisponível. |  | `503`  Serviço indisponível |
| `133005`  Incompatibilidade do PIN na confirmação em duas etapas | O PIN de confirmação em duas etapas está incorreto. | Verifique se o PIN incluído no pedido está correto.  Para redefinir o PIN, desative a confirmação em duas etapas e defina um novo PIN. Veja [Confirmação em duas etapas](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers#two-step-verification). | `400`  Solicitação incorreta |
| `133006`  É necessária uma nova verificação do número de telefone | O número de telefone precisa ser verificado antes do registro. | [Verifique e registre o número de telefone](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/registering-phone-numbers). | `400`  Solicitação incorreta |
| `133008`  Muitas tentativas do PIN de confirmação em duas etapas | Ocorreram muitas tentativas do PIN de confirmação em duas etapas para este número de telefone. | Tente novamente após o período especificado no valor de resposta `details`. | `400`  Solicitação incorreta |
| `133009`  Tentativa muito rápida do PIN de confirmação em duas etapas | O PIN de confirmação em duas etapas foi inserido muito rapidamente. | Consulte o valor da resposta `details` antes de tentar novamente. | `400`  Solicitação incorreta |
| `133010`  Número de telefone não registrado | O número de telefone não está registrado na Plataforma do WhatsApp Business. | [Registre o número de telefone](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration) e tente novamente. | `400`  Solicitação incorreta |
| `133015`  Aguarde alguns minutos antes de tentar registrar o número de telefone | O número de telefone que você está tentando registrar foi excluído recentemente e a exclusão ainda não foi concluída. | Espere 5 minutos antes de tentar novamente. | `400`  Solicitação incorreta |
| `134011`  Os Termos de Serviço do Pagamentos no WhatsApp não foram aceitos | O envio da mensagem falhou porque a aceitação dos Termos de Serviço do Pagamentos no WhatsApp por esta conta do WhatsApp Business está pendente. | Aceite os Termos de Serviço do Pagamentos no WhatsApp usando o link fornecido na mensagem de erro antes de tentar novamente. | `400`  Solicitação incorreta |
| `135000`  Erro genérico do usuário | Falha ao enviar a mensagem devido a um erro desconhecido com seus parâmetros de pedido. | Consulte a [referência](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview) do ponto de extremidade para determinar se a consulta ao ponto de extremidade está sendo feita com a sintaxe correta. Entre em contato com o [suporte ao cliente](https://developers.facebook.com/support/) se continuar a receber esse erro na resposta. | `400`  Solicitação incorreta |

A API de MM do WhatsApp usa os mesmos códigos de erro que a API de Nuvem, com algumas adições listadas abaixo.

### Exemplo

```
{
  "error": {
    "message": "(#100) Invalid parameter",
    "type": "OAuthException",
    "code": 100,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "Message must be a template message."
    },
    "fbtrace_id": "Ak6nxJSySLEJz32Ps-QiZ1t"
  }
}
```

### Códigos

| Código | Mensagem | Detalhes | Possíveis motivos e soluções | HTTP   status   código |
| --- | --- | --- | --- | --- |
| `100` | `(#100) Invalid parameter` | `Message must be a template message.` | Você está tentando enviar uma mensagem sem modelo. O tipo de mensagem deve ser `template`. Tente novamente usando um modelo de marketing. | 400 Solicitação inválida |
| `131009` | `(#131009) Parameter value is not valid` | `One or more parameter values are invalid.` | Você pode estar usando um parâmetro inválido. Verifique se você está usando um [parâmetro válido](https://developers.facebook.com/documentation/business-messaging/whatsapp/marketing-messages/send-marketing-messages) e tente novamente.  A sincronização de anúncios pode estar incompleta. Aguarde dez minutos e tente novamente. Se o problema persistir, entre em contato com o suporte. | 400 Solicitação inválida |
| `131055` | `(#131055) Method not allowed` | `Only marketing template messages are supported` | É possível que você tenha tentado enviar uma mensagem sem modelo ou usando um modelo de autenticação ou utilidade. Experimente enviar novamente usando um modelo de mensagem de marketing. | 400 Solicitação inválida |
| `134100` | `(#134100) Only marketing messages supported` | `You're only able to send marketing messages on this API.` | *Disponível na versão 23.0 da API Graph.*  Você está tentando enviar um modelo de utilidade ou autenticação. Somente modelos categorizados como `MARKETING` são compatíveis. | 400 Solicitação inválida |
| `134101` | `(#134101) Your template is still syncing` | `When you send a message from a template, the template syncing process can take up to 10 minutes to complete. Wait a few minutes, and then try sending your message again.` | *Disponível na versão 23.0 da API Graph.*  Você está tentando enviar um modelo criado recentemente antes de concluir a sincronização de anúncios. A sincronização de anúncios pode levar até dez minutos. Aguarde dez minutos e tente novamente. | 400 Solicitação inválida |
| `134102` | `(#134102) Template unavailable for use` | `Please check your eligibility status to ensure you are onboarded or contact Meta's customer support.` |  | 500 - Erro de servidor interno |
| `132018` | `(#132018) Template validation error` | `There's an issue with the parameters in your template.` | Analise os erros, atualize os parâmetros conforme necessário e reenvie sua mensagem usando um modelo configurado corretamente. | 400 Solicitação inválida |
| `1752041` | `(#1752041) Duplicate Request` | `Duplicate Request is thrown when a client has already been invited to onboard by any partner.` | Cada cliente empresarial pode ter apenas um pedido de integração. Somente o primeiro parceiro que chamar a API de intenção poderá enviar o pedido com sucesso. Quando um cliente é integrado, todas as contas do WhatsApp Business qualificadas são incluídas no processo de forma automática.  Se você receber um erro indicando que o pedido de integração já foi feito, não será necessária nenhuma ação adicional, pois todas as contas do WhatsApp Business qualificadas desse cliente serão integradas automaticamente. | 400 Solicitação inválida |

Você achou esta página útil?