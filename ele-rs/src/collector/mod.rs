use anyhow::Result;
use chrono::Utc;
use local_ip_address::list_afinet_netifas;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::net::IpAddr;
use sysinfo::{Disks, Networks, System};

mod platform;

pub fn collect_static_data() -> Result<Value> {
    let mut system = System::new_all();
    system.refresh_all();

    let disks = Disks::new_with_refreshed_list();
    let networks = Networks::new_with_refreshed_list();
    let network_ips = network_ip_map();
    let macs = collect_macs(&networks, &network_ips);
    let hardware_uuid = platform::hardware_uuid().unwrap_or_else(|| fallback_hardware_uuid(&macs));

    let mut root = Map::new();
    root.insert("os".to_string(), collect_os());
    root.insert("cpu".to_string(), collect_cpu(&system));
    root.insert("mem".to_string(), collect_memory(&system));
    root.insert("memLayout".to_string(), collect_mem_layout(&system));
    root.insert("system".to_string(), collect_system(&hardware_uuid));
    root.insert("diskLayout".to_string(), collect_disks(&disks));
    root.insert("fsSize".to_string(), collect_fs_size(&disks));
    root.insert("net".to_string(), collect_networks(&networks, &network_ips));
    root.insert(
        "uuid".to_string(),
        json!({
            "hardware": hardware_uuid,
            "macs": macs,
        }),
    );
    root.insert(
        "collector".to_string(),
        json!({
            "name": env!("CARGO_PKG_NAME"),
            "version": env!("CARGO_PKG_VERSION"),
            "runtime": "rust",
            "schema": "systeminformation-staticdata-compatible-v1",
            "collected_at": Utc::now().to_rfc3339(),
        }),
    );

    platform::enrich(&mut root);

    Ok(Value::Object(root))
}

pub fn legacy_device_id(data: &Value) -> Option<String> {
    let hardware = data.pointer("/uuid/hardware")?.as_str()?;
    let mac = data.pointer("/uuid/macs/0")?.as_str()?;
    if hardware.is_empty() || mac.is_empty() {
        return None;
    }
    Some(format!("{:x}", md5::compute(format!("{hardware}{mac}"))))
}

pub fn stable_device_id_v2(data: &Value) -> Option<String> {
    let candidates = [
        (
            "hardware_uuid",
            data.pointer("/uuid/hardware").and_then(Value::as_str),
        ),
        (
            "system_uuid",
            data.pointer("/system/uuid").and_then(Value::as_str),
        ),
        (
            "system_serial",
            data.pointer("/system/serial").and_then(Value::as_str),
        ),
        (
            "baseboard_serial",
            data.pointer("/baseboard/serial").and_then(Value::as_str),
        ),
        ("bios_serial", data.pointer("/bios/serial").and_then(Value::as_str)),
    ];

    for (kind, value) in candidates {
        if let Some(value) = value.and_then(normalize_identity_value) {
            return Some(stable_id_from_source(kind, &value));
        }
    }

    let mac = data
        .pointer("/uuid/macs")
        .and_then(Value::as_array)
        .and_then(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .find_map(normalize_identity_mac)
        });
    if let Some(mac) = mac {
        return Some(stable_id_from_source("primary_mac", &mac));
    }

    None
}

fn stable_id_from_source(kind: &str, value: &str) -> String {
    let source = format!("{kind}:{value}");
    let digest = Sha256::digest(source.as_bytes());
    let full = format!("{:x}", digest);
    format!("v2-{}", &full[..29])
}

fn normalize_identity_value(value: &str) -> Option<String> {
    let value = value.trim().to_lowercase();
    if value.is_empty() {
        return None;
    }
    let invalid = [
        "0",
        "00000000",
        "00000000-0000-0000-0000-000000000000",
        "03000200-0400-0500-0006-000700080009",
        "default string",
        "none",
        "null",
        "not specified",
        "not available",
        "not present",
        "unknown",
        "to be filled by o.e.m.",
        "not filled by o.e.m.",
        "system serial number",
    ];
    if invalid.contains(&value.as_str()) {
        return None;
    }
    Some(value)
}

fn normalize_identity_mac(value: &str) -> Option<String> {
    let value = value.trim().to_lowercase();
    if value.is_empty() || value == "00:00:00:00:00:00" || value == "ff:ff:ff:ff:ff:ff" {
        return None;
    }
    Some(value)
}

fn collect_os() -> Value {
    json!({
        "arch": std::env::consts::ARCH,
        "platform": std::env::consts::OS,
        "hostname": System::host_name().unwrap_or_default(),
        "fqdn": System::host_name().unwrap_or_default(),
        "distro": System::long_os_version().or_else(System::name).unwrap_or_default(),
        "kernel": System::kernel_version().unwrap_or_default(),
        "release": System::os_version().unwrap_or_default(),
    })
}

fn collect_cpu(system: &System) -> Value {
    let first = system.cpus().first();
    json!({
        "brand": first.map(|cpu| cpu.brand()).unwrap_or_default(),
        "vendor": first.map(|cpu| cpu.vendor_id()).unwrap_or_default(),
        "speed": first.map(|cpu| cpu.frequency()).unwrap_or_default(),
        "cores": system.cpus().len(),
        "physicalCores": system.physical_core_count().unwrap_or(system.cpus().len()),
        "processors": 1,
    })
}

fn collect_memory(system: &System) -> Value {
    let used_memory = system.total_memory().saturating_sub(system.available_memory());
    let used_swap = system.total_swap().saturating_sub(system.free_swap());
    json!({
        "total": system.total_memory(),
        "free": system.free_memory(),
        "available": system.available_memory(),
        "used": used_memory,
        "swapTotal": system.total_swap(),
        "swapFree": system.free_swap(),
        "swapUsed": used_swap,
    })
}

fn collect_mem_layout(system: &System) -> Value {
    let total = system.total_memory();
    if total == 0 {
        return Value::Array(Vec::new());
    }

    Value::Array(vec![json!({
        "bank": if cfg!(target_os = "macos") { "Unified Memory" } else { "" },
        "size": total,
        "type": if cfg!(target_os = "macos") { "Unified" } else { "" },
        "clockSpeed": 0,
        "formFactor": "",
        "manufacturer": if cfg!(target_os = "macos") { "Apple" } else { "" },
        "serialNum": "",
        "partNum": "",
    })])
}

fn collect_system(hardware_uuid: &str) -> Value {
    json!({
        "manufacturer": "",
        "model": "",
        "version": "",
        "serial": "",
        "uuid": hardware_uuid,
        "sku": "",
    })
}

fn collect_disks(disks: &Disks) -> Value {
    Value::Array(
        disks
            .list()
            .iter()
            .filter(|disk| is_asset_disk_mount(&disk.mount_point().to_string_lossy()))
            .map(|disk| {
                json!({
                    "name": disk.name().to_string_lossy(),
                    "device": disk.name().to_string_lossy(),
                    "type": format!("{:?}", disk.kind()),
                    "fsType": disk.file_system().to_string_lossy(),
                    "mount": disk.mount_point().to_string_lossy(),
                    "size": disk.total_space(),
                })
            })
            .collect(),
    )
}

fn collect_fs_size(disks: &Disks) -> Value {
    Value::Array(
        disks
            .list()
            .iter()
            .map(|disk| {
                json!({
                    "fs": disk.mount_point().to_string_lossy(),
                    "type": disk.file_system().to_string_lossy(),
                    "size": disk.total_space(),
                    "used": disk.total_space().saturating_sub(disk.available_space()),
                    "available": disk.available_space(),
                    "mount": disk.mount_point().to_string_lossy(),
                })
            })
            .collect(),
    )
}

fn is_asset_disk_mount(mount: &str) -> bool {
    if cfg!(target_os = "macos") {
        return mount == "/";
    }
    !mount.is_empty()
}

fn collect_networks(networks: &Networks, ips: &BTreeMap<String, Vec<IpAddr>>) -> Value {
    let mut default_assigned = false;
    let mut rows = Vec::new();

    for (iface, data) in networks.iter() {
        let (ip4, ip6) = iface_ips(iface, ips);
        let internal = is_internal_iface(iface, &ip4, &ip6);
        let virtual_iface = is_virtual_iface(iface);
        let has_ip = has_routable_ip(&ip4, &ip6);
        let default = !default_assigned && has_ip && !internal && !virtual_iface;
        if default {
            default_assigned = true;
        }

        rows.push(json!({
            "iface": iface,
            "ifaceName": iface,
            "ip4": ip4,
            "ip6": ip6,
            "mac": data.mac_address().to_string(),
            "default": default,
            "internal": internal,
            "virtual": virtual_iface,
            "operstate": if data.total_received() > 0 || data.total_transmitted() > 0 { "up" } else { "unknown" },
        }));
    }

    Value::Array(rows)
}

fn collect_macs(networks: &Networks, ips: &BTreeMap<String, Vec<IpAddr>>) -> Vec<String> {
    let mut primary = Vec::new();
    let mut secondary = Vec::new();

    for (iface, data) in networks.iter() {
        let mac = data.mac_address().to_string().to_lowercase();
        if mac != "00:00:00:00:00:00" && mac != "ff:ff:ff:ff:ff:ff" {
            let (ip4, ip6) = iface_ips(iface, ips);
            let active = has_routable_ip(&ip4, &ip6)
                && !is_internal_iface(iface, &ip4, &ip6)
                && !is_virtual_iface(iface);
            if active {
                primary.push(mac);
            } else {
                secondary.push(mac);
            }
        }
    }

    let mut seen = BTreeSet::new();
    let selected = if primary.is_empty() {
        secondary
    } else {
        primary
    };

    selected
        .into_iter()
        .filter(|mac| seen.insert(mac.clone()))
        .collect()
}

fn iface_ips(iface: &str, ips: &BTreeMap<String, Vec<IpAddr>>) -> (String, String) {
    let iface_ips = ips.get(iface).cloned().unwrap_or_default();
    let ip4 = iface_ips
        .iter()
        .find_map(|ip| match ip {
            IpAddr::V4(value) => Some(value.to_string()),
            IpAddr::V6(_) => None,
        })
        .unwrap_or_default();
    let ip6 = iface_ips
        .iter()
        .find_map(|ip| match ip {
            IpAddr::V4(_) => None,
            IpAddr::V6(value) => Some(value.to_string()),
        })
        .unwrap_or_default();
    (ip4, ip6)
}

fn network_ip_map() -> BTreeMap<String, Vec<IpAddr>> {
    let mut map = BTreeMap::new();
    if let Ok(entries) = list_afinet_netifas() {
        for (iface, ip) in entries {
            map.entry(iface).or_insert_with(Vec::new).push(ip);
        }
    }
    map
}

fn fallback_hardware_uuid(macs: &[String]) -> String {
    let host = System::host_name().unwrap_or_default();
    let first_mac = macs.first().cloned().unwrap_or_default();
    format!("{:x}", md5::compute(format!("{host}|{first_mac}")))
}

fn is_internal_iface(iface: &str, ip4: &str, ip6: &str) -> bool {
    let lower = iface.to_ascii_lowercase();
    lower == "lo"
        || lower == "lo0"
        || ip4.starts_with("127.")
        || ip6 == "::1"
}

fn has_routable_ip(ip4: &str, ip6: &str) -> bool {
    (!ip4.is_empty() && !ip4.starts_with("127."))
        || (!ip6.is_empty() && ip6 != "::1" && !ip6.to_ascii_lowercase().starts_with("fe80:"))
}

fn is_virtual_iface(iface: &str) -> bool {
    let lower = iface.to_ascii_lowercase();
    if ["anpi", "ap", "awdl", "bridge", "gif", "llw", "p2p", "stf", "utun"]
        .iter()
        .any(|prefix| lower.starts_with(prefix))
    {
        return true;
    }

    ["virtual", "vmware", "vbox", "docker"]
        .iter()
        .any(|needle| lower.contains(needle))
}
