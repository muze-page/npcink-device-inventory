#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.test.yml"
PROJECT_NAME="npcink-device-inventory-check-$$-${RANDOM}"
PLUGIN_CHECK_VERSION="${NPCINK_PLUGIN_CHECK_VERSION:-2.0.0}"
PLUGIN_ZIP="${ROOT_DIR}/release/npcink-device-inventory.zip"
SUBMISSION_ZIP="${ROOT_DIR}/sj/npcink-device-inventory.zip"
SUBMISSION_MANIFEST="${ROOT_DIR}/sj/package-manifest.json"
COMPOSE=(docker compose --project-name "${PROJECT_NAME}" --file "${COMPOSE_FILE}")

cleanup() {
  local status=$?
  trap - EXIT
  if [ "${status}" -ne 0 ]; then
    "${COMPOSE[@]}" logs --no-color || true
  fi
  if ! "${COMPOSE[@]}" down --volumes --remove-orphans >/dev/null; then
    echo "Docker cleanup failed for Compose project ${PROJECT_NAME}." >&2
    if [ "${status}" -eq 0 ]; then
      status=1
    fi
  fi
  exit "${status}"
}
trap cleanup EXIT

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for the isolated WordPress check." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but the daemon is not available." >&2
  exit 1
fi

echo "Building synchronized release and submission ZIPs..."
cd "${ROOT_DIR}"
npm run build:submission
if [ ! -f "${PLUGIN_ZIP}" ] || [ ! -f "${SUBMISSION_ZIP}" ] || [ ! -f "${SUBMISSION_MANIFEST}" ]; then
  echo "Release ZIP, submission ZIP, or submission manifest was not created." >&2
  exit 1
fi

node --input-type=module --eval '
  import { execFileSync } from "node:child_process";
  import { createHash } from "node:crypto";
  import { readFileSync, statSync } from "node:fs";
  const [releasePath, submissionPath, manifestPath] = process.argv.slice(1);
  const release = readFileSync(releasePath);
  const submission = readFileSync(submissionPath);
  if (!release.equals(submission)) {
    throw new Error("Release and submission ZIPs differ.");
  }
  const entries = execFileSync("unzip", ["-Z1", submissionPath], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const listing = execFileSync("unzip", ["-l", submissionPath], { encoding: "utf8" });
  const listedEntries = Array.from(
    listing.matchAll(/^\s*(\d+)\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/gm)
  );
  const actual = {
    sha256: createHash("sha256").update(submission).digest("hex"),
    entry_count: entries.length,
    file_count: entries.filter((entry) => !entry.endsWith("/")).length,
    uncompressed_bytes: listedEntries.reduce((total, match) => total + Number(match[1]), 0),
    compressed_bytes: statSync(submissionPath).size,
  };
  const expected = JSON.parse(readFileSync(manifestPath, "utf8")).package || {};
  for (const [field, value] of Object.entries(actual)) {
    if (expected[field] !== value) {
      throw new Error(`Submission manifest mismatch for ${field}: expected=${expected[field]} actual=${value}`);
    }
  }
  console.log(`Submission package synchronized: ${actual.sha256}`);
' "${PLUGIN_ZIP}" "${SUBMISSION_ZIP}" "${SUBMISSION_MANIFEST}"

echo "Starting isolated WordPress PHP 8.3 and MariaDB 11 services..."
"${COMPOSE[@]}" up --detach --wait database wordpress

run_wp() {
  "${COMPOSE[@]}" run --rm cli "$@"
}

echo "Installing WordPress and the release ZIP..."
run_wp core install \
  --url="http://wordpress" \
  --title="Npcink Device Inventory Docker Check" \
  --admin_user="npcink-e2e-admin" \
  --admin_password="npcink-e2e-password" \
  --admin_email="e2e@example.invalid" \
  --skip-email
run_wp plugin install /workspace/release/npcink-device-inventory.zip --activate

wordpress_version="$(run_wp core version)"
php_version="$(run_wp eval 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;')"
if [ "${php_version}" != "8.3" ]; then
  echo "Expected PHP 8.3, found ${php_version}." >&2
  exit 1
fi
echo "WordPress ${wordpress_version}, PHP ${php_version}."

echo "Installing official Plugin Check ${PLUGIN_CHECK_VERSION}..."
run_wp plugin install "https://downloads.wordpress.org/plugin/plugin-check.${PLUGIN_CHECK_VERSION}.zip" --activate
installed_plugin_check_version="$(run_wp plugin get plugin-check --field=version)"
if [ "${installed_plugin_check_version}" != "${PLUGIN_CHECK_VERSION}" ]; then
  echo "Expected Plugin Check ${PLUGIN_CHECK_VERSION}, found ${installed_plugin_check_version}." >&2
  exit 1
fi

echo "Running official Plugin Check against the installed release ZIP..."
plugin_check_output="$(run_wp plugin check npcink-device-inventory --format=table 2>&1)"
printf '%s\n' "${plugin_check_output}"
if ! grep -Fq "Checks complete. No errors found." <<<"${plugin_check_output}"; then
  echo "Plugin Check reported errors or warnings." >&2
  exit 1
fi

echo "Running the real backup restore rehearsal..."
run_wp eval '
  global $wpdb;
  $created = $wpdb->insert(
    $wpdb->prefix . "npcink_assets",
    array(
      "uuid" => wp_generate_uuid4(),
      "asset_type" => "custom",
      "asset_number" => "RESTORE-E2E-SENTINEL",
      "name" => "Cleanup scope sentinel"
    ),
    array("%s", "%s", "%s", "%s")
  );
  if ($created !== 1) {
    fwrite(STDERR, "Failed to create the cleanup scope sentinel.\n");
    exit(1);
  }
'
"${COMPOSE[@]}" run --rm \
  --env NPCINK_RESTORE_REHEARSAL_ROOT=/workspace \
  cli eval-file /workspace/scripts/wp-backup-restore-rehearsal.php
run_wp eval '
  global $wpdb;
  $table = $wpdb->prefix . "npcink_assets";
  $sentinel_id = $wpdb->get_var($wpdb->prepare(
    "SELECT id FROM {$table} WHERE asset_number = %s LIMIT 1",
    "RESTORE-E2E-SENTINEL"
  ));
  if (!$sentinel_id) {
    fwrite(STDERR, "Backup restore cleanup deleted an unrelated sentinel asset.\n");
    exit(1);
  }
  if ($wpdb->delete($table, array("id" => (int) $sentinel_id), array("%d")) !== 1) {
    fwrite(STDERR, "Failed to remove the cleanup scope sentinel.\n");
    exit(1);
  }
'

echo "Isolated Docker verification passed."
