#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLUGIN_SLUG="npcink-device-inventory"
RELEASE_DIR="${ROOT_DIR}/release"
ZIP_PATH="${RELEASE_DIR}/${PLUGIN_SLUG}.zip"
CHECK_DIR="${RELEASE_DIR}/${PLUGIN_SLUG}"

cd "${ROOT_DIR}"
npm run build:release

test -f "${ZIP_PATH}"
rm -rf "${CHECK_DIR}"
unzip -q "${ZIP_PATH}" -d "${RELEASE_DIR}"
test -d "${CHECK_DIR}"

echo "${ZIP_PATH}"
