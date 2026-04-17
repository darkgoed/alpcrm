#!/bin/bash
# Rollback do último deploy.
#
# Uso:
#   ./rollback.sh           -> reverte para o release anterior
#   ./rollback.sh <ts>      -> reverte para releases/<ts>
#   ./rollback.sh --list    -> lista releases disponíveis

set -e
set -o pipefail

ROOT_DIR="/var/www/crm-whatsapp"
RELEASES_DIR="${ROOT_DIR}/releases"

if [ ! -d "${RELEASES_DIR}" ]; then
  echo "ERRO: ${RELEASES_DIR} não existe. Nada para reverter."
  exit 1
fi

if [ "${1:-}" = "--list" ]; then
  cd "${RELEASES_DIR}"
  ls -1t | while read -r ts; do
    commit="desconhecido"
    [ -f "${ts}/commit" ] && commit="$(cat "${ts}/commit")"
    echo "${ts}  ${commit}"
  done
  exit 0
fi

TARGET="${1:-}"
if [ -z "${TARGET}" ]; then
  TARGET="$(ls -1t "${RELEASES_DIR}" | head -n 1 || true)"
fi

if [ -z "${TARGET}" ] || [ ! -d "${RELEASES_DIR}/${TARGET}" ]; then
  echo "ERRO: release '${TARGET}' não encontrado em ${RELEASES_DIR}"
  echo "Use: $0 --list"
  exit 1
fi

RELEASE_DIR="${RELEASES_DIR}/${TARGET}"
echo "==> Rollback para release ${TARGET}"

if [ -f "${RELEASE_DIR}/commit" ]; then
  TARGET_COMMIT="$(cat "${RELEASE_DIR}/commit")"
  echo "==> Resetando git para commit ${TARGET_COMMIT}"
  cd "${ROOT_DIR}"
  git reset --hard "${TARGET_COMMIT}"
fi

if [ -d "${RELEASE_DIR}/backend/dist" ]; then
  echo "==> Restaurando backend/dist"
  rm -rf "${ROOT_DIR}/backend/dist"
  cp -a "${RELEASE_DIR}/backend/dist" "${ROOT_DIR}/backend/dist"
fi

if [ -d "${RELEASE_DIR}/frontend/.next" ]; then
  echo "==> Restaurando frontend/.next"
  rm -rf "${ROOT_DIR}/frontend/.next"
  cp -a "${RELEASE_DIR}/frontend/.next" "${ROOT_DIR}/frontend/.next"
fi

echo "==> Restart PM2"
pm2 restart all

echo "==> Rollback concluído para ${TARGET}"
