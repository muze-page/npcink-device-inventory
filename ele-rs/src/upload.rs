use anyhow::{bail, Context, Result};
use reqwest::blocking::Client;
use serde::Serialize;
use serde_json::Value;
use std::time::Duration;

#[derive(Serialize)]
struct LegacySubmitBody<'a> {
    name: &'a str,
    password: &'a str,
    site: &'a str,
    data: String,
}

#[derive(Serialize)]
struct V2SubmitBody<'a> {
    name: &'a str,
    password: &'a str,
    data: &'a Value,
}

pub fn submit_v2(site: &str, name: &str, password: &str, data: &Value) -> Result<Value> {
    let body = V2SubmitBody {
        name,
        password,
        data,
    };
    submit_json(site, &body)
}

pub fn submit_legacy(site: &str, name: &str, password: &str, data: &Value) -> Result<Value> {
    let body = LegacySubmitBody {
        name,
        password,
        site,
        data: serde_json::to_string(data).context("failed to encode device data")?,
    };
    submit_json(site, &body)
}

fn submit_json<T: Serialize>(site: &str, body: &T) -> Result<Value> {
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .user_agent(format!(
            "magick-device-agent/{}",
            env!("CARGO_PKG_VERSION")
        ))
        .build()
        .context("failed to build HTTP client")?;

    let response = client
        .post(site)
        .json(&body)
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
