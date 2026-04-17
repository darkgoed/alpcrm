#!/bin/bash
# Deploy script com suporte a rollback.
#
# Registra cada deploy em releases/<timestamp>/ com:
#   - backend/dist      (artefato Nest compilado)
#   - frontend/.next    (build Next otimizado)
#   - commit            (hash git no momento do deploy)
#
# Mantém os 10 releases mais recentes. Usa ./rollback.sh para reverter.

set -e
set -o pipefail

ROOT_DIR="/var/www/crm-whatsapp"
RELEASES_DIR="${ROOT_DIR}/releases"
KEEP_RELEASES=10
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}"

mkdir -p "${RELEASES_DIR}"

echo "==> Deploy iniciado: ${TIMESTAMP}"

cd "${ROOT_DIR}"
CURRENT_COMMIT="$(git rev-parse HEAD)"
echo "==> Commit atual: ${CURRENT_COMMIT}"

# 1) Snapshot do release anterior (o que está rodando agora) — só copia se existir build.
if [ -d "${ROOT_DIR}/backend/dist" ] || [ -d "${ROOT_DIR}/frontend/.next" ]; then
  mkdir -p "${RELEASE_DIR}/backend" "${RELEASE_DIR}/frontend"
  if [ -d "${ROOT_DIR}/backend/dist" ]; then
    cp -a "${ROOT_DIR}/backend/dist" "${RELEASE_DIR}/backend/dist"
  fi
  if [ -d "${ROOT_DIR}/frontend/.next" ]; then
    cp -a "${ROOT_DIR}/frontend/.next" "${RELEASE_DIR}/frontend/.next"
  fi
  echo "${CURRENT_COMMIT}" > "${RELEASE_DIR}/commit"
  echo "==> Snapshot salvo em ${RELEASE_DIR}"
else
  echo "==> Nenhum build anterior para snapshot (primeiro deploy)"
fi

# 2) Build
echo "==> Build BACKEND"
cd "${ROOT_DIR}/backend"
npm run build

echo "==> Build FRONTEND"
cd "${ROOT_DIR}/frontend"
npm run build

# 3) Restart
echo "==> Restart PM2"
pm2 restart all

# 4) Limpa releases antigos
cd "${RELEASES_DIR}"
ls -1t | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
  [ -n "${old}" ] && rm -rf "${RELEASES_DIR}/${old}"
done

echo "==> Concluído. Para reverter: ${ROOT_DIR}/rollback.sh"
