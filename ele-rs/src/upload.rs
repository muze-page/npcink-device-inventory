use anyhow::{bail, Context, Result};
use hmac::{Hmac, Mac};
use rand::{distributions::Alphanumeric, Rng};
use reqwest::blocking::Client;
use reqwest::header::CONTENT_TYPE;
use serde::Serialize;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

pub fn submit_v2(site: &str, name: &str, password: &str, data: &Value) -> Result<Value> {
    if let Some(token) = parse_client_token(password)? {
        let body = serde_json::json!({
            "name": name,
            "data": data,
        });
        return submit_json_hmac(site, &body, &token);
    }

    bail!("新版上传接口必须使用后台生成的上传授权码");
}

fn submit_json_hmac<T: Serialize>(site: &str, body: &T, token: &ClientToken) -> Result<Value> {
    let body_json = serde_json::to_string(body).context("failed to encode submit body")?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .context("system time is before unix epoch")?
        .as_secs()
        .to_string();
    let nonce: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    let body_digest = Sha256::digest(body_json.as_bytes());
    let key_digest = Sha256::digest(token.secret.as_bytes());
    let body_hash = hex_encode(&body_digest);
    let key_hash = hex_encode(&key_digest);
    let signing_payload = format!("{timestamp}\n{nonce}\n{body_hash}");

    let mut mac =
        HmacSha256::new_from_slice(key_hash.as_bytes()).context("failed to prepare HMAC key")?;
    mac.update(signing_payload.as_bytes());
    let signature = format!("sha256={}", hex_encode(mac.finalize().into_bytes().as_slice()));

    send_json(
        site,
        body_json,
        vec![
            ("x-magick-device-token-id", token.id.clone()),
            ("x-magick-device-timestamp", timestamp),
            ("x-magick-device-nonce", nonce),
            ("x-magick-device-signature", signature),
        ],
    )
}

fn send_json(site: &str, body_json: String, headers: Vec<(&'static str, String)>) -> Result<Value> {
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .user_agent(format!(
            "magick-device-agent/{}",
            env!("CARGO_PKG_VERSION")
        ))
        .build()
        .context("failed to build HTTP client")?;

    let mut request = client
        .post(site)
        .header(CONTENT_TYPE, "application/json")
        .body(body_json);

    for (name, value) in headers {
        request = request.header(name, value);
    }

    let response = request
        .send()
        .with_context(|| format!("failed to submit device data to {site}"))?;

    let status = response.status();
    let text = response.text().context("failed to read submit response")?;
    let parsed = serde_json::from_str::<Value>(&text).unwrap_or_else(|_| Value::String(text));

    if !status.is_success() {
        bail!("submit failed with status {status}: {parsed}");
    }

    Ok(parsed)
}

#[derive(Debug)]
struct ClientToken {
    id: String,
    secret: String,
}

fn parse_client_token(value: &str) -> Result<Option<ClientToken>> {
    let value = value.trim();
    if !value.starts_with("mda_") {
        return Ok(None);
    }

    let parts = value.split('_').collect::<Vec<_>>();
    if parts.len() != 3 || parts[1].is_empty() || parts[2].is_empty() {
        bail!("上传授权码格式不正确，请从后台重新复制");
    }

    Ok(Some(ClientToken {
        id: parts[1].to_string(),
        secret: parts[2].to_string(),
    }))
}

fn hex_encode(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push(HEX[(byte >> 4) as usize] as char);
        out.push(HEX[(byte & 0x0f) as usize] as char);
    }
    out
}
