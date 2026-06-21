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
    write_config(&config).map_err(|error| error.to_string())
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
fn submit_device_data(config: AgentConfig) -> Result<Value, String> {
    validate_config(&config)?;
    let data = collector::collect_static_data().map_err(|error| error.to_string())?;
    upload::submit_v2(&config.site, &config.name, &config.token, &data)
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
        return Err("请填写 v2 接口地址".to_string());
    }
    if config.token.is_empty() {
        return Err("请填写上传授权码".to_string());
    }
    Ok(())
}

fn read_config() -> Result<AgentConfig> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(AgentConfig::default());
    }
    let raw = fs::read_to_string(&path)
        .with_context(|| format!("failed to read config {}", path.display()))?;
    serde_json::from_str(&raw).context("failed to parse config")
}

fn write_config(config: &AgentConfig) -> Result<()> {
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("failed to create config dir {}", parent.display()))?;
    }
    let raw = serde_json::to_string_pretty(config).context("failed to encode config")?;
    fs::write(&path, raw).with_context(|| format!("failed to write config {}", path.display()))
}

fn config_path() -> Result<PathBuf> {
    let base = dirs::config_dir().context("failed to resolve config dir")?;
    Ok(base.join("npcink-device-agent").join("config.json"))
}
