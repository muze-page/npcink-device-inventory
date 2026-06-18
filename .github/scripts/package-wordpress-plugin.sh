#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLUGIN_SLUG="magick-device-manage"
RELEASE_DIR="${ROOT_DIR}/release"
PACKAGE_DIR="${RELEASE_DIR}/${PLUGIN_SLUG}"
ZIP_PATH="${RELEASE_DIR}/${PLUGIN_SLUG}-plugin.zip"

rm -rf "${PACKAGE_DIR}" "${ZIP_PATH}"
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

require_path "magick-device-manage.php"
require_path "uninstall.php"
require_path "index.php"
copy_path "README.md"
copy_path "README.en.md"
copy_path "README.txt"
copy_path "LICENSE"
copy_path "LICENSE.txt"
require_path "admin"
require_path "includes"
require_path "languages"
require_path "vite-admin/dist"
require_path "vite-search/dist"

find "${PACKAGE_DIR}" -name ".DS_Store" -delete
find "${PACKAGE_DIR}" -type d -name "node_modules" -prune -exec rm -rf {} +

mkdir -p "${RELEASE_DIR}"
(
  cd "${RELEASE_DIR}"
  zip -qr "${ZIP_PATH}" "${PLUGIN_SLUG}"
)

echo "${ZIP_PATH}"
