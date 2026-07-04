#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLUGIN_SLUG="npcink-device-inventory"
RELEASE_DIR="${ROOT_DIR}/release"
PACKAGE_DIR="${RELEASE_DIR}/${PLUGIN_SLUG}"
ZIP_PATH="${RELEASE_DIR}/${PLUGIN_SLUG}.zip"

cd "${ROOT_DIR}"
npm run build:release

test -d "${PACKAGE_DIR}"

echo "${ZIP_PATH}"
