#!/bin/bash

set -e  # para o script ao dar erro
set -o pipefail

echo "==> Build BACKEND"
cd /var/www/crm-whatsapp/backend
npm run build

echo "==> Build FRONTEND"
cd /var/www/crm-whatsapp/frontend
npm run build

echo "==> Restart PM2"
pm2 restart all

echo "==> Concluído com sucesso"
