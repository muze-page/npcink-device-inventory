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
        enrich_macos_system_profiler(root, &value);
        root.insert("platformData".to_string(), value);
    }
    insert_empty_if_missing(root, "bios");
    insert_empty_if_missing(root, "baseboard");
    insert_empty_if_missing(root, "chassis");
    insert_empty_if_missing(root, "graphics");
}

#[cfg(target_os = "macos")]
fn enrich_macos_system_profiler(root: &mut Map<String, Value>, value: &Value) {
    let hardware = value
        .get("SPHardwareDataType")
        .and_then(Value::as_array)
        .and_then(|items| items.first())
        .and_then(Value::as_object);

    if let Some(hardware) = hardware {
        let machine_name = string_field(hardware, "machine_name");
        let machine_model = string_field(hardware, "machine_model");
        let model_number = string_field(hardware, "model_number");
        let serial_number = string_field(hardware, "serial_number");
        let platform_uuid = string_field(hardware, "platform_UUID");
        let chip_type = string_field(hardware, "chip_type");
        let physical_memory = string_field(hardware, "physical_memory");
        let boot_rom_version = string_field(hardware, "boot_rom_version");

        root.insert(
            "system".to_string(),
            json!({
                "manufacturer": "Apple",
                "model": machine_name,
                "version": model_number,
                "serial": serial_number,
                "uuid": platform_uuid,
                "sku": machine_model,
            }),
        );
        root.insert(
            "baseboard".to_string(),
            json!({
                "manufacturer": "Apple",
                "model": machine_model,
                "product": machine_name,
                "version": model_number,
                "serial": serial_number,
                "memMax": physical_memory,
                "chip": chip_type,
            }),
        );
        root.insert(
            "bios".to_string(),
            json!({
                "vendor": "Apple",
                "version": boot_rom_version,
                "serial": serial_number,
            }),
        );
    }

    if let Some(displays) = value.get("SPDisplaysDataType").and_then(Value::as_array) {
        let controllers = displays
            .iter()
            .map(|item| {
                let model = first_non_empty(&[string_value(item, "sppci_model"), string_value(item, "_name")]);
                json!({
                    "vendor": string_value(item, "spdisplays_vendor").replace("sppci_vendor_", ""),
                    "model": model,
                    "cores": string_value(item, "sppci_cores"),
                    "bus": string_value(item, "sppci_bus").replace("spdisplays_", ""),
                })
            })
            .collect::<Vec<_>>();

        let display_rows = displays
            .iter()
            .flat_map(|item| {
                item.get("spdisplays_ndrvs")
                    .and_then(Value::as_array)
                    .cloned()
                    .unwrap_or_default()
            })
            .map(|display| {
                let resolution = first_non_empty(&[
                    string_value(&display, "_spdisplays_pixels"),
                    string_value(&display, "_spdisplays_resolution"),
                ]);
                json!({
                    "model": string_value(&display, "_name"),
                    "resolution": resolution,
                    "retina": string_value(&display, "spdisplays_pixelresolution"),
                    "type": string_value(&display, "spdisplays_display_type").replace("spdisplays_", ""),
                    "main": string_value(&display, "spdisplays_main"),
                })
            })
            .collect::<Vec<_>>();

        root.insert(
            "graphics".to_string(),
            json!({
                "controllers": controllers,
                "displays": display_rows,
            }),
        );
    }
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

#[cfg(target_os = "macos")]
fn string_field(map: &Map<String, Value>, key: &str) -> String {
    map.get(key)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

#[cfg(target_os = "macos")]
fn string_value(value: &Value, key: &str) -> String {
    value
        .get(key)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

#[cfg(target_os = "macos")]
fn first_non_empty(values: &[String]) -> String {
    values
        .iter()
        .find(|value| !value.trim().is_empty())
        .cloned()
        .unwrap_or_default()
}
