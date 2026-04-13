# WhatsApp Cloud API — Configuração

## Credenciais

| Campo | Valor |
|---|---|
| Phone Number ID | `1056323037564482` |
| WABA ID | `1474638544389432` |
| Access Token | `EAARZCQoklTbUBRP8ZAZC8DF4EkBykvRPO3bcAyEMilzV1jfaoQ7Armq2BuxzIV7JildDZCyGDbBxLWfC5b2vQjabRMt2Pkd7VcuvcXYuk98g44WxhsI0uQwQpB2ZCe0wiOpqVzrosYDp76ZBgyc10fZAmvfMxwZBXCIDstZARwigUJ0qZB6ijAn6GHZAc3u78wKg3zDD5t2WE42LAihMWwG0T7xS9y2a8bwMyt1h1spprzxHCIBbeBEUllWrnOJGOrPYZAmP4KPzUqkpxjJdoMDScqhSwgVzOjIZD` |
| App Token (Meta dashboard) | `b3546ba371b768b57faa7ed3eb48f54a` |
| Webhook URL | `https://crm.alpdash.com.br/api/whatsapp/webhook` |
| Verify Token | `crm_verify_token` |

## Observações

- O **Access Token** é temporário (~24h). Substituir por System User Token permanente no Meta Business Suite.
- O **Verify Token** (`crm_verify_token`) está configurado em `backend/.env` e é usado na verificação GET do webhook.
- O app subscrito no WABA é **AlpCRM** (`1265823652335029`).
