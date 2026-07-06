#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WP_PATH="${WP_PATH:-}"
WP_CLI_BIN="${WP_CLI_BIN:-}"
WP_CLI_PHP="${WP_CLI_PHP:-}"
WP_CLI_PHP_INI="${WP_CLI_PHP_INI:-}"

run_wp() {
  if [ -n "${WP_CLI_PHP}" ]; then
    if [ -n "${WP_CLI_PHP_INI}" ]; then
      "${WP_CLI_PHP}" -c "${WP_CLI_PHP_INI}" "${WP_CLI_BIN}" --path="${WP_PATH}" "$@"
    else
      "${WP_CLI_PHP}" "${WP_CLI_BIN}" --path="${WP_PATH}" "$@"
    fi
  else
    "${WP_CLI_BIN}" --path="${WP_PATH}" "$@"
  fi
}

if [ -z "${WP_CLI_BIN}" ]; then
  WP_CLI_BIN="$(command -v wp || true)"
fi

if [ -z "${WP_CLI_BIN}" ] || [ ! -x "${WP_CLI_BIN}" ]; then
  echo "WP-CLI is required for backup restore rehearsal." >&2
  exit 1
fi

if [ -z "${WP_PATH}" ]; then
  echo "Set WP_PATH=/path/to/local/wordpress before running backup restore rehearsal." >&2
  exit 1
fi

if [ ! -d "${WP_PATH}" ]; then
  echo "WordPress path not found: ${WP_PATH}" >&2
  exit 1
fi

echo "Running JSON backup restore rehearsal against ${WP_PATH}..."
NPCINK_RESTORE_REHEARSAL_ROOT="${ROOT_DIR}" run_wp eval-file "${ROOT_DIR}/scripts/wp-backup-restore-rehearsal.php"
echo "Backup restore rehearsal passed."
