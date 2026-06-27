fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").expect("missing CARGO_MANIFEST_DIR");
    let preset_path = std::path::Path::new(&manifest_dir).join("agent-preset.local.json");
    println!("cargo:rerun-if-changed={}", preset_path.display());

    if let Ok(raw) = std::fs::read_to_string(&preset_path) {
        let compact = raw.lines().map(str::trim).collect::<String>();
        println!("cargo:rustc-env=NPCINK_AGENT_PRESET={compact}");
    }

    tauri_build::build()
}
