#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLUGIN_SLUG="npcink-device-inventory"
RELEASE_DIR="${ROOT_DIR}/release"
PACKAGE_DIR="${RELEASE_DIR}/${PLUGIN_SLUG}"
ZIP_PATH="${RELEASE_DIR}/${PLUGIN_SLUG}.zip"

cd "${ROOT_DIR}"
node scripts/build-release-package.mjs

rm -rf "${PACKAGE_DIR}"
unzip -q "${ZIP_PATH}" -d "${RELEASE_DIR}"

echo "${ZIP_PATH}"
