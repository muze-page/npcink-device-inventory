#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLUGIN_SLUG="npcink-device-manage"
RELEASE_DIR="${ROOT_DIR}/release"
PACKAGE_DIR="${RELEASE_DIR}/${PLUGIN_SLUG}"
ZIP_PATH="${RELEASE_DIR}/${PLUGIN_SLUG}.zip"
LEGACY_ZIP_PATH="${RELEASE_DIR}/${PLUGIN_SLUG}-plugin.zip"

rm -rf "${PACKAGE_DIR}" "${ZIP_PATH}" "${LEGACY_ZIP_PATH}"
mkdir -p "${PACKAGE_DIR}"

copy_path() {
  local source="$1"
  if [ -e "${ROOT_DIR}/${source}" ]; then
    mkdir -p "${PACKAGE_DIR}/$(dirname "${source}")"
    cp -R "${ROOT_DIR}/${source}" "${PACKAGE_DIR}/${source}"
  fi
}

require_path() {
  local source="$1"
  if [ ! -e "${ROOT_DIR}/${source}" ]; then
    echo "Missing required package path: ${source}" >&2
    exit 1
  fi
  copy_path "${source}"
}

require_path "npcink-device-manage.php"
require_path "uninstall.php"
require_path "index.php"
copy_path "README.txt"
copy_path "LICENSE"
copy_path "LICENSE.txt"
require_path "admin"
require_path "includes"
require_path "languages"
require_path "vite-admin/dist"
require_path "vite-admin/src"
require_path "vite-admin/index.html"
require_path "vite-admin/package.json"
require_path "vite-admin/package-lock.json"
require_path "vite-admin/tsconfig.json"
require_path "vite-admin/tsconfig.node.json"
require_path "vite-admin/vite.config.ts"
require_path "vite-search/dist"
require_path "vite-search/src"
require_path "vite-search/index.html"
require_path "vite-search/package.json"
require_path "vite-search/package-lock.json"
require_path "vite-search/tsconfig.json"
require_path "vite-search/tsconfig.node.json"
require_path "vite-search/vite.config.ts"

find "${PACKAGE_DIR}" -name ".DS_Store" -delete
find "${PACKAGE_DIR}" -type d -name "node_modules" -prune -exec rm -rf {} +

if [ ! -s "${PACKAGE_DIR}/README.txt" ]; then
  echo "README.txt is required for WordPress.org packages and cannot be empty." >&2
  exit 1
fi

plugin_version="$(
  sed -nE 's/^[[:space:]]*\*[[:space:]]*Version:[[:space:]]*([^[:space:]]+).*/\1/p' \
    "${PACKAGE_DIR}/${PLUGIN_SLUG}.php" | head -1
)"
stable_tag="$(
  sed -nE 's/^Stable tag:[[:space:]]*([^[:space:]]+).*/\1/p' \
    "${PACKAGE_DIR}/README.txt" | head -1
)"
if [ -z "${plugin_version}" ] || [ -z "${stable_tag}" ] || [ "${plugin_version}" != "${stable_tag}" ]; then
  echo "Plugin Version and README.txt Stable tag must match. Version=${plugin_version:-missing}, Stable tag=${stable_tag:-missing}" >&2
  exit 1
fi

for forbidden_path in \
  ".git" \
  ".github" \
  "ele" \
  "ele-rs" \
  "release" \
  "vite-admin/node_modules" \
  "vite-search/node_modules"
do
  if [ -e "${PACKAGE_DIR}/${forbidden_path}" ]; then
    echo "Forbidden package path found: ${forbidden_path}" >&2
    exit 1
  fi
done

if find "${PACKAGE_DIR}" -name ".DS_Store" -o -name ".env" -o -name "*.map" | grep -q .; then
  echo "Forbidden generated artifact found in package." >&2
  exit 1
fi

if find "${PACKAGE_DIR}" -type f \( \
  -name "淘宝.png" -o \
  -name "拼多多.png" -o \
  -name "京东.png" -o \
  -name "美团.png" -o \
  -name "闲鱼.png" -o \
  -name "抖音.png" -o \
  -name "支付宝支付.png" -o \
  -name "微信支付.png" -o \
  -name "银行卡支付.png" \
\) | grep -q .; then
  echo "Forbidden platform/payment image asset found in package." >&2
  find "${PACKAGE_DIR}" -type f \( \
    -name "淘宝.png" -o \
    -name "拼多多.png" -o \
    -name "京东.png" -o \
    -name "美团.png" -o \
    -name "闲鱼.png" -o \
    -name "抖音.png" -o \
    -name "支付宝支付.png" -o \
    -name "微信支付.png" -o \
    -name "银行卡支付.png" \
  \) >&2
  exit 1
fi

if LC_ALL=C grep -RInE "Access-Control-Allow-Origin:[[:space:]]*\\*|password=9527|password:[[:space:]]*[\"']9527[\"']|x-npcink-password.*9527" "${PACKAGE_DIR}" >/dev/null; then
  echo "Forbidden demo secret or wildcard CORS found in package." >&2
  LC_ALL=C grep -RInE "Access-Control-Allow-Origin:[[:space:]]*\\*|password=9527|password:[[:space:]]*[\"']9527[\"']|x-npcink-password.*9527" "${PACKAGE_DIR}" >&2
  exit 1
fi

mkdir -p "${RELEASE_DIR}"
(
  cd "${RELEASE_DIR}"
  zip -qr "${ZIP_PATH}" "${PLUGIN_SLUG}"
)

echo "${ZIP_PATH}"
