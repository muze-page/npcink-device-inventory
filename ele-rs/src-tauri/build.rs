fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("missing CARGO_MANIFEST_DIR");
    let preset_path = std::path::Path::new(&manifest_dir).join("agent-preset.local.json");
    println!("cargo:rerun-if-changed={}", preset_path.display());

    if let Ok(raw) = std::fs::read_to_string(&preset_path) {
        validate_preset(&raw, &preset_path);
        let compact = raw.lines().map(str::trim).collect::<String>();
        println!("cargo:rustc-env=NPCINK_AGENT_PRESET={compact}");
    }

    tauri_build::build()
}

fn validate_preset(raw: &str, path: &std::path::Path) {
    let value: serde_json::Value = serde_json::from_str(raw)
        .unwrap_or_else(|error| panic!("invalid JSON in {}: {error}", path.display()));
    let upload_endpoint = string_field(&value, "uploadEndpoint");
    let site_url = string_field(&value, "siteUrl");
    let token_value = string_field(&value, "tokenValue");
    let token_id = string_field(&value, "tokenId");
    let token_secret = string_field(&value, "tokenSecret");

    if upload_endpoint.is_empty() && site_url.is_empty() {
        panic!(
            "{} must include uploadEndpoint or siteUrl for preset packaging",
            path.display()
        );
    }

    if token_value.is_empty() && (token_id.is_empty() || token_secret.is_empty()) {
        panic!(
            "{} must include tokenValue, or both tokenId and tokenSecret",
            path.display()
        );
    }
}

fn string_field(value: &serde_json::Value, key: &str) -> String {
    value
        .get(key)
        .and_then(serde_json::Value::as_str)
        .unwrap_or("")
        .trim()
        .to_string()
}
