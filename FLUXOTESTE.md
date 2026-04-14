  Flow 1 — Menu Principal
                                                                                                                                                                               {
    "name": "menu_principal",                                                                                                                                                
    "triggerType": "new_conversation",                                                                                                                                       
    "isActive": true,                                                                                                                                                            "nodes": [
      {                                                                                                                                                                      
        "clientId": "n1",                                                                                                                                                    
        "type": "send_interactive",
        "order": 0,                                                                                                                                                                  "config": {
          "interactiveType": "button",                                                                                                                                       
          "body": "👋 Olá! Este é um fluxo de teste do CRM.\nEscolha uma opção abaixo:",                                                                                     
          "footer": "Teste CRM WhatsApp v1",                                                                                                                                 
          "buttons": [                                                                                                                                                                   { "id": "btn_texto",  "title": "Texto" },                                                                                                                        
            { "id": "btn_imagem", "title": "Imagem" },                                                                                                                                   { "id": "btn_fluxo",  "title": "Fluxo" }
          ]                                                                                                                                                                  
        }
      }
    ],                                                                                                                                                                           "edges": []
  }                                                                                                                                                                          
  
  ---
  Flow 2 — Resposta Texto

  {
    "name": "resp_texto",
    "triggerType": "button_reply",                                                                                                                                               "triggerValue": "btn_texto",
    "isActive": true,                                                                                                                                                        
    "nodes": [
      {
        "clientId": "n1",
        "type": "message",
        "order": 0,
        "config": { "content": "✅ Você escolheu TESTE DE TEXTO.\nMensagem funcionando corretamente." }                                                                      
      },                                                                                                                                                                           {                                                                                                                                                                      
        "clientId": "n2",                                                                                                                                                    
        "type": "send_interactive",
        "order": 1,
        "config": {
          "interactiveType": "button",
          "body": "O que deseja fazer?",
          "buttons": [                                                                                                                                                                   { "id": "btn_voltar", "title": "Menu Inicial" }
          ]                                                                                                                                                                          }
      }                                                                                                                                                                      
    ],
    "edges": [
      { "fromClientId": "n1", "toClientId": "n2" }
    ]
  }

  ---
  Flow 3 — Resposta Imagem
                                                                                                                                                                               {
    "name": "resp_imagem",                                                                                                                                                   
    "triggerType": "button_reply",
    "triggerValue": "btn_imagem",
    "isActive": true,
    "nodes": [
      {
        "clientId": "n1",                                                                                                                                                            "type": "message",
        "order": 0,                                                                                                                                                          
        "config": { "content": "📸 Enviando imagem de teste...\n[url da imagem aqui]" }
      },                                                                                                                                                                           {
        "clientId": "n2",                                                                                                                                                    
        "type": "send_interactive",
        "order": 1,
        "config": {                                                                                                                                                                    "interactiveType": "button",
          "body": "O que deseja fazer?",                                                                                                                                     
          "buttons": [
            { "id": "btn_voltar", "title": "Menu Inicial" }
          ]                                                                                                                                                                          }
      }                                                                                                                                                                      
    ],
    "edges": [
      { "fromClientId": "n1", "toClientId": "n2" }
    ]
  }

  ▎ Obs sobre imagem: o nó message envia só texto. O sistema ainda não tem nó send_media. A imagem pode ser a URL no corpo do texto, ou você precisa adicionar um              ▎ FlowNodeType novo (send_media). Preciso implementar.
                                                                                                                                                                             
  ---
  Flow 4 — Submenu

  {
    "name": "resp_fluxo",
    "triggerType": "button_reply",
    "triggerValue": "btn_fluxo",
    "isActive": true,                                                                                                                                                            "nodes": [
      {                                                                                                                                                                      
        "clientId": "n1",
        "type": "send_interactive",
        "order": 0,
        "config": {
          "interactiveType": "button",
          "body": "🔁 Submenu de testes avançados.\nEscolha uma ação:",
          "footer": "Navegação interna",                                                                                                                                               "buttons": [
            { "id": "btn_voltar",    "title": "Menu Inicial" },                                                                                                              
            { "id": "btn_finalizar", "title": "Finalizar" }                                                                                                                            ]
        }                                                                                                                                                                    
      }
    ],
    "edges": []
  }

  ---
  Flow 5 — Finalizar
                                                                                                                                                                               {
    "name": "resp_finalizar",                                                                                                                                                
    "triggerType": "button_reply",
    "triggerValue": "btn_finalizar",
    "isActive": true,
    "nodes": [
      {                                                                                                                                                                              "clientId": "n1",
        "type": "message",                                                                                                                                                   
        "order": 0,
        "config": { "content": "🚪 Atendimento finalizado.\nObrigado por testar o sistema!" }
      }                                                                                                                                                                          ],
    "edges": []                                                                                                                                                              
  }

  ▎ Encerramento: não existe nó close_conversation hoje. O flow completa normalmente (isBotActive = false). Se quiser que a conversa mude de status para closed, precisa de    ▎ um novo FlowNodeType. Preciso implementar!
                                                                                                                                                                             
  ---
  Flow 6 — Voltar ao menu

  {
    "name": "resp_voltar",
    "triggerType": "button_reply",
    "triggerValue": "btn_voltar",                                                                                                                                                "isActive": true,
    "nodes": [                                                                                                                                                               
      {
        "clientId": "n1",
        "type": "send_interactive",
        "order": 0,
        "config": {                                                                                                                                                                    "interactiveType": "button",
          "body": "👋 Menu principal:",                                                                                                                                      
          "footer": "Teste CRM WhatsApp v1",
          "buttons": [                                                                                                                                                                   { "id": "btn_texto",  "title": "Texto" },
            { "id": "btn_imagem", "title": "Imagem" },                                                                                                                       
            { "id": "btn_fluxo",  "title": "Fluxo" }
          ]                                                                                                                                                                          }
      }                                                                                                                                                                      
    ],
    "edges": []
  }