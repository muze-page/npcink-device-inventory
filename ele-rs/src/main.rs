use anyhow::{bail, Context, Result};
use magick_device_agent::{collector, upload};
use std::env;

fn main() -> Result<()> {
    let args = env::args().skip(1).collect::<Vec<_>>();
    let command = args.first().map(String::as_str).unwrap_or("inspect");

    match command {
        "inspect" => inspect(&args[1..]),
        "stable-id" => stable_id(),
        "legacy-id" => legacy_id(),
        "submit" => submit(&args[1..]),
        "submit-legacy" => submit_legacy(&args[1..]),
        "help" | "--help" | "-h" => {
            print_help();
            Ok(())
        }
        other => bail!("unknown command: {other}"),
    }
}

fn inspect(args: &[String]) -> Result<()> {
    let pretty = args.iter().any(|arg| arg == "--pretty");
    let data = collector::collect_static_data()?;
    if pretty {
        println!("{}", serde_json::to_string_pretty(&data)?);
    } else {
        println!("{}", serde_json::to_string(&data)?);
    }
    Ok(())
}

fn legacy_id() -> Result<()> {
    let data = collector::collect_static_data()?;
    let id = collector::legacy_device_id(&data).context("missing uuid.hardware or uuid.macs[0]")?;
    println!("{id}");
    Ok(())
}

fn stable_id() -> Result<()> {
    let data = collector::collect_static_data()?;
    let id = collector::stable_device_id_v2(&data).context("missing stable device identity")?;
    println!("{id}");
    Ok(())
}

fn submit(args: &[String]) -> Result<()> {
    let site = required_flag(args, "--site")?;
    let name = required_flag(args, "--name")?;
    let password = required_flag(args, "--token").or_else(|_| required_flag(args, "--password"))?;
    let data = collector::collect_static_data()?;
    let response = upload::submit_v2(&site, &name, &password, &data)?;
    println!("{}", serde_json::to_string_pretty(&response)?);
    Ok(())
}

fn submit_legacy(args: &[String]) -> Result<()> {
    let site = required_flag(args, "--site")?;
    let name = required_flag(args, "--name")?;
    let password = required_flag(args, "--password")?;
    let data = collector::collect_static_data()?;
    let response = upload::submit_legacy(&site, &name, &password, &data)?;
    println!("{}", serde_json::to_string_pretty(&response)?);
    Ok(())
}

fn required_flag(args: &[String], name: &str) -> Result<String> {
    args.windows(2)
        .find(|pair| pair[0] == name)
        .map(|pair| pair[1].clone())
        .filter(|value| !value.trim().is_empty())
        .with_context(|| format!("missing required flag {name}"))
}

fn print_help() {
    println!(
        "Magick Device Agent\n\n\
Commands:\n\
  inspect [--pretty]    Print compatible hardware JSON\n\
  stable-id             Print v2 stable device id\n\
  legacy-id             Print md5(uuid.hardware + uuid.macs[0])\n\
  submit --site URL --name NAME --token TOKEN              Submit to v2 endpoint\n\
  submit-legacy --site URL --name NAME --password PASSWORD Submit to old endpoint\n"
    );
}
