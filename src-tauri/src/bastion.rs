//! Native SSH bastion lifecycle for the desktop application.
//!
//! The service launches the local OpenSSH client with a dynamic forward. It
//! never sends credentials on the command line: authentication must use an
//! SSH agent or an identity file supplied by the user.

use std::{
    fs,
    fs::OpenOptions,
    net::TcpListener,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

const PROFILE_FILE: &str = "bastion-profile.json";
const LOG_FILE: &str = "bastion-ssh.log";

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BastionProfile {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub socks_port: u16,
    pub identity_file: Option<String>,
    pub known_hosts_file: Option<String>,
    pub ssh_executable: Option<String>,
}

#[derive(Debug, Default)]
struct BastionRuntime {
    process: Option<Child>,
    started_at: Option<u64>,
    last_exit_code: Option<i32>,
}

#[derive(Default)]
pub struct BastionState {
    runtime: Mutex<BastionRuntime>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BastionStatus {
    pub profile: Option<BastionProfile>,
    pub process_status: String,
    pub pid: Option<u32>,
    pub socks_endpoint: Option<String>,
    pub started_at: Option<u64>,
    pub last_exit_code: Option<i32>,
    pub log_path: Option<String>,
}

#[tauri::command]
pub fn get_bastion_profile(app: AppHandle) -> Result<Option<BastionProfile>, String> {
    load_profile(&app)
}

#[tauri::command]
pub fn save_bastion_profile(
    app: AppHandle,
    mut profile: BastionProfile,
) -> Result<BastionProfile, String> {
    validate_profile(&mut profile)?;
    let path = profile_path(&app)?;
    fs::write(
        path,
        serde_json::to_vec_pretty(&profile)
            .map_err(|error| format!("Could not encode bastion profile: {error}"))?,
    )
    .map_err(|error| format!("Could not save bastion profile: {error}"))?;
    Ok(profile)
}

#[tauri::command]
pub fn get_bastion_status(
    app: AppHandle,
    state: State<'_, BastionState>,
) -> Result<BastionStatus, String> {
    let profile = load_profile(&app)?;
    status_from_runtime(&app, &state, profile)
}

#[tauri::command]
pub fn connect_bastion(
    app: AppHandle,
    state: State<'_, BastionState>,
) -> Result<BastionStatus, String> {
    let profile = load_profile(&app)?.ok_or(
        "No bastion profile is saved. Save a host, username, and SOCKS port before connecting.",
    )?;
    validate_connect_inputs(&profile)?;
    ensure_socks_port_is_available(profile.socks_port)?;

    let mut runtime = state
        .runtime
        .lock()
        .map_err(|_| "Bastion process state is unavailable")?;
    let previous_status = runtime
        .process
        .as_mut()
        .map(|process| process.try_wait())
        .transpose()
        .map_err(|error| format!("Could not inspect the existing bastion process: {error}"))?;
    match previous_status {
        Some(None) => {
            return Err(
                "A bastion OpenSSH process is already running. Disconnect it before reconnecting."
                    .to_string(),
            );
        }
        Some(Some(status)) => {
            runtime.last_exit_code = status.code();
            runtime.started_at = None;
            runtime.process = None;
        }
        None => {}
    }

    let executable = resolve_ssh_executable(&profile)?;
    let log_path = log_path(&app)?;
    let stdout = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|error| format!("Could not open the bastion log file: {error}"))?;
    let stderr = stdout
        .try_clone()
        .map_err(|error| format!("Could not prepare the bastion log file: {error}"))?;

    let mut child = Command::new(executable)
        .args(ssh_arguments(&profile))
        .stdin(Stdio::null())
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr))
        .spawn()
        .map_err(|error| format!("Could not start OpenSSH: {error}"))?;

    thread::sleep(Duration::from_millis(250));
    if let Some(exit_status) = child
        .try_wait()
        .map_err(|error| format!("Could not inspect the new bastion process: {error}"))?
    {
        runtime.last_exit_code = exit_status.code();
        return Err(format!(
            "OpenSSH exited before the SOCKS proxy started (exit code {}). See {}.",
            exit_status.code().map_or_else(|| "unknown".to_string(), |code| code.to_string()),
            log_path.display()
        ));
    }

    runtime.started_at = Some(unix_time_ms()?);
    runtime.last_exit_code = None;
    runtime.process = Some(child);
    status_from_locked_runtime(&log_path, &mut runtime, Some(profile))
}

#[tauri::command]
pub fn disconnect_bastion(
    app: AppHandle,
    state: State<'_, BastionState>,
) -> Result<BastionStatus, String> {
    let profile = load_profile(&app)?;
    let log_path = log_path(&app)?;
    let mut runtime = state
        .runtime
        .lock()
        .map_err(|_| "Bastion process state is unavailable")?;

    if let Some(mut process) = runtime.process.take() {
        process
            .kill()
            .map_err(|error| format!("Could not stop the bastion OpenSSH process: {error}"))?;
        let status = process
            .wait()
            .map_err(|error| format!("Could not wait for the bastion OpenSSH process: {error}"))?;
        runtime.last_exit_code = status.code();
    }
    runtime.started_at = None;
    status_from_locked_runtime(&log_path, &mut runtime, profile)
}

fn status_from_runtime(
    app: &AppHandle,
    state: &BastionState,
    profile: Option<BastionProfile>,
) -> Result<BastionStatus, String> {
    let log_path = log_path(app)?;
    let mut runtime = state
        .runtime
        .lock()
        .map_err(|_| "Bastion process state is unavailable")?;
    status_from_locked_runtime(&log_path, &mut runtime, profile)
}

fn status_from_locked_runtime(
    log_path: &Path,
    runtime: &mut BastionRuntime,
    profile: Option<BastionProfile>,
) -> Result<BastionStatus, String> {
    let mut pid = None;
    let mut process_status = "stopped".to_string();

    let process_state = runtime
        .process
        .as_mut()
        .map(|process| process.try_wait().map(|status| (process.id(), status)))
        .transpose()
        .map_err(|error| format!("Could not inspect the bastion OpenSSH process: {error}"))?;
    match process_state {
        Some((process_id, None)) => {
            process_status = "running".to_string();
            pid = Some(process_id);
        }
        Some((_, Some(exit_status))) => {
            runtime.last_exit_code = exit_status.code();
            runtime.started_at = None;
            runtime.process = None;
        }
        None => {}
    }

    let socks_endpoint = profile
        .as_ref()
        .map(|current| format!("socks5://127.0.0.1:{}", current.socks_port));
    Ok(BastionStatus {
        profile,
        process_status,
        pid,
        socks_endpoint,
        started_at: runtime.started_at,
        last_exit_code: runtime.last_exit_code,
        log_path: Some(log_path.display().to_string()),
    })
}

fn load_profile(app: &AppHandle) -> Result<Option<BastionProfile>, String> {
    let path = profile_path(app)?;
    if !path.exists() {
        return Ok(None);
    }
    let contents =
        fs::read_to_string(path).map_err(|error| format!("Could not read bastion profile: {error}"))?;
    let profile = serde_json::from_str(&contents)
        .map_err(|error| format!("Saved bastion profile is invalid: {error}"))?;
    Ok(Some(profile))
}

fn profile_path(app: &AppHandle) -> Result<PathBuf, String> {
    app_config_dir(app).map(|directory| directory.join(PROFILE_FILE))
}

fn log_path(app: &AppHandle) -> Result<PathBuf, String> {
    app_config_dir(app).map(|directory| directory.join(LOG_FILE))
}

fn app_config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Could not resolve the application config directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Could not create the application config directory: {error}"))?;
    Ok(directory)
}

fn validate_profile(profile: &mut BastionProfile) -> Result<(), String> {
    profile.name = profile.name.trim().to_string();
    profile.host = profile.host.trim().to_string();
    profile.username = profile.username.trim().to_string();
    validate_token("Bastion name", &profile.name, false)?;
    validate_token("Bastion host", &profile.host, true)?;
    validate_token("Bastion username", &profile.username, true)?;
    if profile.port == 0 || profile.socks_port == 0 {
        return Err("Bastion and SOCKS ports must be between 1 and 65535.".to_string());
    }
    Ok(())
}

fn validate_connect_inputs(profile: &BastionProfile) -> Result<(), String> {
    if let Some(identity_file) = &profile.identity_file {
        if !identity_file.trim().is_empty() && !Path::new(identity_file).is_file() {
            return Err(format!("Identity file does not exist: {identity_file}"));
        }
    }
    if let Some(known_hosts_file) = &profile.known_hosts_file {
        if !known_hosts_file.trim().is_empty() && !Path::new(known_hosts_file).is_file() {
            return Err(format!("Known-hosts file does not exist: {known_hosts_file}"));
        }
    }
    Ok(())
}

fn validate_token(label: &str, value: &str, reject_leading_dash: bool) -> Result<(), String> {
    if value.is_empty() {
        return Err(format!("{label} is required."));
    }
    if value.chars().any(char::is_whitespace) || value.chars().any(char::is_control) {
        return Err(format!("{label} cannot contain whitespace or control characters."));
    }
    if reject_leading_dash && value.starts_with('-') {
        return Err(format!("{label} cannot start with a dash."));
    }
    Ok(())
}

fn ensure_socks_port_is_available(port: u16) -> Result<(), String> {
    TcpListener::bind(("127.0.0.1", port))
        .map(drop)
        .map_err(|error| format!("SOCKS port {port} is unavailable: {error}"))
}

fn resolve_ssh_executable(profile: &BastionProfile) -> Result<PathBuf, String> {
    if let Some(configured_path) = profile
        .ssh_executable
        .as_deref()
        .filter(|path| !path.trim().is_empty())
    {
        let path = PathBuf::from(configured_path);
        if path.is_file() {
            return Ok(path);
        }
        return Err(format!("Configured OpenSSH executable does not exist: {configured_path}"));
    }

    #[cfg(target_os = "windows")]
    {
        let bundled = PathBuf::from(r"C:\Windows\System32\OpenSSH\ssh.exe");
        if bundled.is_file() {
            return Ok(bundled);
        }
        Err(
            "OpenSSH was not found at C:\\Windows\\System32\\OpenSSH\\ssh.exe. Configure an OpenSSH executable in the bastion profile."
                .to_string(),
        )
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(PathBuf::from("ssh"))
    }
}

fn ssh_arguments(profile: &BastionProfile) -> Vec<String> {
    let mut arguments = vec![
        "-N".to_string(),
        "-D".to_string(),
        format!("127.0.0.1:{}", profile.socks_port),
        "-p".to_string(),
        profile.port.to_string(),
        "-l".to_string(),
        profile.username.clone(),
        "-o".to_string(),
        "BatchMode=yes".to_string(),
        "-o".to_string(),
        "StrictHostKeyChecking=yes".to_string(),
        "-o".to_string(),
        "ExitOnForwardFailure=yes".to_string(),
        "-o".to_string(),
        "ServerAliveInterval=30".to_string(),
        "-o".to_string(),
        "ServerAliveCountMax=3".to_string(),
        "-o".to_string(),
        "ConnectTimeout=15".to_string(),
    ];
    if let Some(identity_file) = profile
        .identity_file
        .as_deref()
        .filter(|path| !path.trim().is_empty())
    {
        arguments.extend(["-i".to_string(), identity_file.to_string()]);
    }
    if let Some(known_hosts_file) = profile
        .known_hosts_file
        .as_deref()
        .filter(|path| !path.trim().is_empty())
    {
        arguments.extend([
            "-o".to_string(),
            format!("UserKnownHostsFile={known_hosts_file}"),
        ]);
    }
    arguments.push(profile.host.clone());
    arguments
}

fn unix_time_ms() -> Result<u64, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .map_err(|error| format!("System clock is before the Unix epoch: {error}"))
}

#[cfg(test)]
mod tests {
    use super::{ssh_arguments, validate_profile, BastionProfile};

    fn profile() -> BastionProfile {
        BastionProfile {
            name: "Primary".to_string(),
            host: "bastion.example.com".to_string(),
            port: 22,
            username: "netops".to_string(),
            socks_port: 1080,
            identity_file: Some("C:\\Keys\\id_ed25519".to_string()),
            known_hosts_file: Some("C:\\Keys\\known_hosts".to_string()),
            ssh_executable: None,
        }
    }

    #[test]
    fn creates_a_strict_dynamic_forward_command() {
        let arguments = ssh_arguments(&profile());
        assert!(arguments.windows(2).any(|pair| pair == ["-D", "127.0.0.1:1080"]));
        assert!(arguments
            .windows(2)
            .any(|pair| pair == ["-o", "StrictHostKeyChecking=yes"]));
        assert_eq!(arguments.last(), Some(&"bastion.example.com".to_string()));
    }

    #[test]
    fn rejects_an_unsafe_host() {
        let mut invalid = profile();
        invalid.host = "-oProxyCommand=bad".to_string();
        assert!(validate_profile(&mut invalid).is_err());
    }
}
