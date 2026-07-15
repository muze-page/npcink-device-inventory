use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

pub(crate) const APP_DIR_NAME: &str = "npcink-device-agent";

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(default)]
pub(crate) struct AgentConfig {
    pub(crate) site: String,
    pub(crate) name: String,
    pub(crate) token: String,
    pub(crate) preset_label: String,
}

pub(crate) fn validate_config(config: &AgentConfig) -> Result<(), String> {
    if config.site.trim().is_empty() {
        return Err("请填写站点地址或设备上传接口地址".to_string());
    }
    if config.token.is_empty() {
        return Err("请填写上传授权码".to_string());
    }
    Ok(())
}

pub(crate) fn read_config() -> Result<AgentConfig> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(AgentConfig::default());
    }
    let raw = fs::read_to_string(&path)
        .with_context(|| format!("failed to read config {}", path.display()))?;
    serde_json::from_str(&raw).context("failed to parse config")
}

pub(crate) fn write_config(config: AgentConfig) -> Result<()> {
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("failed to create config dir {}", parent.display()))?;
        restrict_directory_permissions(parent)?;
    }
    let raw = serde_json::to_string_pretty(&config).context("failed to encode config")?;
    let mut options = fs::OpenOptions::new();
    options.create(true).truncate(true).write(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(&path)
        .with_context(|| format!("failed to open config {}", path.display()))?;
    file.write_all(raw.as_bytes())
        .with_context(|| format!("failed to write config {}", path.display()))?;
    file.sync_all()
        .with_context(|| format!("failed to sync config {}", path.display()))?;
    restrict_file_permissions(&path)
}

fn config_path() -> Result<PathBuf> {
    let base = dirs::config_dir().context("failed to resolve config dir")?;
    Ok(base.join(APP_DIR_NAME).join("config.json"))
}

#[cfg(unix)]
fn restrict_directory_permissions(path: &Path) -> Result<()> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o700))
        .with_context(|| format!("failed to restrict config dir {}", path.display()))
}

#[cfg(not(unix))]
fn restrict_directory_permissions(_path: &Path) -> Result<()> {
    Ok(())
}

#[cfg(unix)]
fn restrict_file_permissions(path: &Path) -> Result<()> {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o600))
        .with_context(|| format!("failed to restrict config {}", path.display()))
}

#[cfg(not(unix))]
fn restrict_file_permissions(_path: &Path) -> Result<()> {
    Ok(())
}
