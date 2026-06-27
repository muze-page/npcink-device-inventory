use anyhow::{Context, Result};
use npcink_device_agent::{collector, upload};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(default)]
struct AgentConfig {
    site: String,
    name: String,
    token: String,
    preset_locked: bool,
    preset_label: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(default)]
struct AgentPreset {
    #[serde(rename = "siteUrl")]
    site_url: String,
    #[serde(rename = "uploadEndpoint")]
    upload_endpoint: String,
    #[serde(rename = "tokenValue")]
    token_value: String,
    #[serde(rename = "tokenId")]
    token_id: String,
    #[serde(rename = "tokenSecret")]
    token_secret: String,
    #[serde(rename = "tokenName")]
    token_name: String,
}

#[derive(Debug, Serialize)]
struct DeviceSnapshot {
    data: Value,
    stable_device_id_v2: String,
}

#[tauri::command]
fn get_saved_config() -> Result<AgentConfig, String> {
    read_config().map_err(|error| error.to_string())
}

#[tauri::command]
fn save_config(config: AgentConfig) -> Result<(), String> {
    write_config(config).map_err(|error| error.to_string())
}

#[tauri::command]
fn collect_device_snapshot() -> Result<DeviceSnapshot, String> {
    let data = collector::collect_static_data().map_err(|error| error.to_string())?;
    let stable_device_id_v2 = collector::stable_device_id_v2(&data).unwrap_or_default();
    Ok(DeviceSnapshot {
        data,
        stable_device_id_v2,
    })
}

#[tauri::command]
fn submit_device_data(mut config: AgentConfig) -> Result<Value, String> {
    apply_build_preset(&mut config);
    validate_config(&config)?;
    let data = collector::collect_static_data().map_err(|error| error.to_string())?;
    upload::submit_v3(&config.site, &config.name, &config.token, &data)
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_saved_config,
            save_config,
            collect_device_snapshot,
            submit_device_data
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Npcink Device Agent");
}

fn validate_config(config: &AgentConfig) -> Result<(), String> {
    if config.site.trim().is_empty() {
        return Err("请填写站点地址或 v3 接口地址".to_string());
    }
    if config.token.is_empty() {
        return Err("请填写上传授权码".to_string());
    }
    Ok(())
}

fn read_config() -> Result<AgentConfig> {
    let path = config_path()?;
    if !path.exists() {
        let mut config = AgentConfig::default();
        apply_build_preset(&mut config);
        return Ok(config);
    }
    let raw = fs::read_to_string(&path)
        .with_context(|| format!("failed to read config {}", path.display()))?;
    let mut config: AgentConfig = serde_json::from_str(&raw).context("failed to parse config")?;
    apply_build_preset(&mut config);
    Ok(config)
}

fn write_config(mut config: AgentConfig) -> Result<()> {
    apply_build_preset(&mut config);
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("failed to create config dir {}", parent.display()))?;
    }
    let raw = serde_json::to_string_pretty(&config).context("failed to encode config")?;
    fs::write(&path, raw).with_context(|| format!("failed to write config {}", path.display()))
}

fn apply_build_preset(config: &mut AgentConfig) {
    if let Some(preset) = build_preset() {
        config.site = if preset.upload_endpoint.trim().is_empty() {
            preset.site_url
        } else {
            preset.upload_endpoint
        };
        config.token = if preset.token_value.trim().is_empty() {
            format!("mda_{}_{}", preset.token_id, preset.token_secret)
        } else {
            preset.token_value
        };
        config.preset_locked = true;
        config.preset_label = if preset.token_name.trim().is_empty() {
            preset.token_id
        } else {
            preset.token_name
        };
    }
}

fn build_preset() -> Option<AgentPreset> {
    let raw = option_env!("NPCINK_AGENT_PRESET")?.trim();
    if raw.is_empty() {
        return None;
    }
    serde_json::from_str(raw).ok()
}

fn config_path() -> Result<PathBuf> {
    let base = dirs::config_dir().context("failed to resolve config dir")?;
    Ok(base.join("npcink-device-agent").join("config.json"))
}
