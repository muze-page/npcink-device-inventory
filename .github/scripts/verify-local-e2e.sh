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
      $admins = get_users(array("role" => "administrator", "number" => 1, "fields" => "ID"));
      if (!empty($admins)) {
          wp_set_current_user((int) $admins[0]);
      }
      rest_get_server();
      $request = new WP_REST_Request("DELETE", "/npcink/v1/client-tokens/" . getenv("WP_E2E_TOKEN_ID"));
      $request->set_param("id", getenv("WP_E2E_TOKEN_ID"));
      rest_do_request($request);
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
    $admins = get_users(array("role" => "administrator", "number" => 1, "fields" => "ID"));
    if (empty($admins)) {
        fwrite(STDERR, "No administrator user found\n");
        exit(1);
    }
    wp_set_current_user((int) $admins[0]);
    rest_get_server();
    $request = new WP_REST_Request("POST", "/npcink/v1/client-tokens");
    $request->set_header("content-type", "application/json");
    $request->set_body(wp_json_encode(array("name" => "Local E2E")));
    $response = rest_do_request($request);
    $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;
    if (!is_array($data) || empty($data["data"]["id"]) || empty($data["data"]["secret"])) {
        fwrite(STDERR, "Failed to generate client token\n");
        exit(1);
    }
    echo "mda_" . $data["data"]["id"] . "_" . $data["data"]["secret"];
  '
)"

if [[ ! "${TOKEN}" =~ ^mda_[a-z0-9]{12}_[a-f0-9]{64}$ ]]; then
  echo "Generated authorization code has an unexpected format." >&2
  exit 1
fi
TOKEN_ID="$(echo "${TOKEN}" | cut -d _ -f 2)"

echo "Submitting a signed v3 device observation..."
pushd "${ROOT_DIR}/ele-rs" >/dev/null
cargo check >/dev/null
STABLE_ID="$(cargo run --quiet -- stable-id)"
SUBMIT_RESPONSE="$(
  cargo run --quiet -- submit \
    --site "${SITE_URL%/}" \
    --note "${DEVICE_NOTE}" \
    --token "${TOKEN}"
)"
popd >/dev/null

echo "${SUBMIT_RESPONSE}"

echo "Verifying stored v3 observation shape in WordPress..."
WP_E2E_STABLE_ID="${STABLE_ID}" wp --path="${WP_PATH}" eval '
  global $wpdb;
  $stable_id = getenv("WP_E2E_STABLE_ID");
  $identities = $wpdb->prefix . "npcink_asset_identities";
  $observations = $wpdb->prefix . "npcink_asset_observations";
  $asset_id = $wpdb->get_var($wpdb->prepare(
      "SELECT asset_id FROM {$identities} WHERE identity_type = %s AND identity_value = %s LIMIT 1",
      "stable_device_id_v2",
      $stable_id
  ));
  if (!$asset_id) {
      fwrite(STDERR, "Uploaded asset identity was not found: {$stable_id}\n");
      exit(1);
  }
  $row = $wpdb->get_row($wpdb->prepare(
      "SELECT schema_version, summary_json, hardware_json, raw_json FROM {$observations} WHERE asset_id = %d ORDER BY id DESC LIMIT 1",
      $asset_id
  ), ARRAY_A);
  if (!$row) {
      fwrite(STDERR, "Uploaded observation was not found for asset {$asset_id}\n");
      exit(1);
  }
  $raw = json_decode($row["raw_json"], true);
  if ((int) $row["schema_version"] !== 3 || !is_array($raw) || empty($raw["_npcink_device"]) || empty($raw["asset"])) {
      fwrite(STDERR, "Stored observation is not v3 normalized data\n");
      exit(1);
  }
  echo "Verified v3 asset {$asset_id} for stable id {$stable_id}\n";
'

echo "Local e2e verification passed."
