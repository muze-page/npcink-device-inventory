#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WP_PATH="${WP_PATH:-}"
SITE_URL="${SITE_URL:-}"
DEVICE_NOTE="${DEVICE_NOTE:-HMAC验收}"
TOKEN_ID=""

cleanup() {
  if [ -n "${TOKEN_ID}" ]; then
    WP_E2E_TOKEN_ID="${TOKEN_ID}" wp --path="${WP_PATH}" eval '
      $request = new WP_REST_Request("DELETE", "/npcink/v1/admin/client-token/" . getenv("WP_E2E_TOKEN_ID"));
      $request->set_param("id", getenv("WP_E2E_TOKEN_ID"));
      DEMA_Admin_Interface_API::admin_revoke_client_token($request);
    ' >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if ! command -v wp >/dev/null 2>&1; then
  echo "WP-CLI is required for local e2e verification." >&2
  exit 1
fi

if [ -z "${WP_PATH}" ] || [ -z "${SITE_URL}" ]; then
  echo "Set WP_PATH and SITE_URL before running local e2e verification." >&2
  exit 1
fi

if [ ! -d "${WP_PATH}" ]; then
  echo "WordPress path not found: ${WP_PATH}" >&2
  echo "Set WP_PATH=/path/to/local/wp and retry." >&2
  exit 1
fi

if [ ! -d "${ROOT_DIR}/ele-rs" ]; then
  echo "Missing ele-rs desktop uploader source." >&2
  exit 1
fi

echo "Generating a temporary local upload authorization code..."
TOKEN="$(
  wp --path="${WP_PATH}" eval '
    $response = DEMA_Admin_Interface_API::admin_generate_client_token(new WP_REST_Request("POST", "/npcink/v1/admin/client-token"));
    $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;
    if (!is_array($data) || empty($data["token"])) {
        fwrite(STDERR, "Failed to generate client token\n");
        exit(1);
    }
    echo $data["token"];
  '
)"

if [[ ! "${TOKEN}" =~ ^mda_[a-f0-9]{12}_[a-f0-9]{48}$ ]]; then
  echo "Generated authorization code has an unexpected format." >&2
  exit 1
fi
TOKEN_ID="$(echo "${TOKEN}" | cut -d _ -f 2)"

echo "Submitting a signed v2 device upload..."
pushd "${ROOT_DIR}/ele-rs" >/dev/null
cargo check >/dev/null
STABLE_ID="$(cargo run --quiet -- stable-id)"
SUBMIT_RESPONSE="$(
  cargo run --quiet -- submit \
    --site "${SITE_URL%/}/wp-json/npcink/v1/device-post-data-v2" \
    --note "${DEVICE_NOTE}" \
    --token "${TOKEN}"
)"
popd >/dev/null

echo "${SUBMIT_RESPONSE}"

echo "Verifying stored v2 data shape in WordPress..."
WP_E2E_STABLE_ID="${STABLE_ID}" wp --path="${WP_PATH}" eval '
  global $wpdb;
  $uuid = getenv("WP_E2E_STABLE_ID");
  $table = $wpdb->prefix . "npcink_device_pc";
  $row = $wpdb->get_row($wpdb->prepare("SELECT uuid, name, data FROM {$table} WHERE uuid = %s", $uuid), ARRAY_A);
  if (!$row) {
      fwrite(STDERR, "Uploaded row was not found: {$uuid}\n");
      exit(1);
  }
  $data = json_decode($row["data"], true);
  if (!is_array($data) || empty($data["_npcink_device"]) || empty($data["asset"]) || !array_key_exists("raw", $data)) {
      fwrite(STDERR, "Stored row is not v2 normalized data\n");
      exit(1);
  }
  if (($data["asset"]["identity"]["stable_device_id_v2"] ?? "") !== $uuid) {
      fwrite(STDERR, "Stored stable_device_id_v2 does not match row uuid\n");
      exit(1);
  }
  echo "Verified v2 row: {$uuid}\n";
'

echo "Local e2e verification passed."
