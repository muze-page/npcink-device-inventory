use serde_json::{json, Map, Value};
use std::process::Command;

pub(crate) fn enrich(root: &mut Map<String, Value>) {
    enrich_impl(root);
}

pub(crate) fn hardware_uuid() -> Option<String> {
    hardware_uuid_impl()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

#[cfg(target_os = "windows")]
fn enrich_impl(root: &mut Map<String, Value>) {
    if let Some(value) = powershell_json("Get-CimInstance Win32_BIOS | Select-Object Manufacturer,SMBIOSBIOSVersion,SerialNumber,ReleaseDate") {
        root.insert("bios".to_string(), value);
    }
    if let Some(value) = powershell_json("Get-CimInstance Win32_BaseBoard | Select-Object Manufacturer,Product,SerialNumber,Version") {
        root.insert("baseboard".to_string(), value);
    }
    if let Some(value) = powershell_json("Get-CimInstance Win32_SystemEnclosure | Select-Object Manufacturer,SerialNumber,ChassisTypes") {
        root.insert("chassis".to_string(), value);
    }
    if let Some(value) = powershell_json("Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM,VideoProcessor,DriverVersion") {
        root.insert("graphics".to_string(), json!({ "controllers": value }));
    }
    insert_empty_if_missing(root, "bios");
    insert_empty_if_missing(root, "baseboard");
    insert_empty_if_missing(root, "chassis");
    insert_empty_if_missing(root, "graphics");
}

#[cfg(target_os = "macos")]
fn enrich_impl(root: &mut Map<String, Value>) {
    if let Some(value) = command_json("system_profiler", &["-json", "SPHardwareDataType", "SPDisplaysDataType"]) {
        root.insert("platformData".to_string(), value);
    }
    insert_empty_if_missing(root, "bios");
    insert_empty_if_missing(root, "baseboard");
    insert_empty_if_missing(root, "chassis");
    insert_empty_if_missing(root, "graphics");
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn enrich_impl(root: &mut Map<String, Value>) {
    insert_empty_if_missing(root, "bios");
    insert_empty_if_missing(root, "baseboard");
    insert_empty_if_missing(root, "chassis");
    insert_empty_if_missing(root, "graphics");
}

#[cfg(target_os = "windows")]
fn hardware_uuid_impl() -> Option<String> {
    powershell_scalar("(Get-CimInstance Win32_ComputerSystemProduct).UUID")
}

#[cfg(target_os = "macos")]
fn hardware_uuid_impl() -> Option<String> {
    let output = command_text("ioreg", &["-rd1", "-c", "IOPlatformExpertDevice"])?;
    output.lines().find_map(|line| {
        let line = line.trim();
        if !line.contains("IOPlatformUUID") {
            return None;
        }
        line.split('=')
            .nth(1)
            .map(|value| value.trim().trim_matches('"').to_string())
    })
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn hardware_uuid_impl() -> Option<String> {
    None
}

#[cfg(target_os = "windows")]
fn powershell_json(command: &str) -> Option<Value> {
    let wrapped = format!("{command} | ConvertTo-Json -Compress");
    command_json("powershell", &["-NoProfile", "-Command", &wrapped])
}

#[cfg(target_os = "windows")]
fn powershell_scalar(command: &str) -> Option<String> {
    command_text("powershell", &["-NoProfile", "-Command", command])
}

fn command_json(program: &str, args: &[&str]) -> Option<Value> {
    let text = command_text(program, args)?;
    serde_json::from_str(&text).ok()
}

fn command_text(program: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(program).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8(output.stdout).ok()
}

fn insert_empty_if_missing(root: &mut Map<String, Value>, key: &str) {
    if !root.contains_key(key) {
        root.insert(key.to_string(), json!({}));
    }
}
