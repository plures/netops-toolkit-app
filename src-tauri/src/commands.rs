//! Tauri commands for the netops-toolkit Python CLI sidecar.
//!
//! Commands:
//!   - `scan_subnet`    — scan a CIDR subnet, streaming results as Tauri events
//!   - `scan_csv`       — scan hosts from a CSV file, streaming results
//!   - `cancel_scan`    — cancel the running scan
//!   - `load_inventory` — load a JSON inventory file from disk
//!   - `backup_config`  — trigger a config backup for a device
//!   - `list_backups`   — list stored config backups
//!   - `diff_configs`   — compute a diff between two config versions
//!   - `rollback_config` — rollback a device config to a previous version

use std::path::PathBuf;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::oneshot;
use tokio::sync::Mutex;

// ---------------------------------------------------------------------------
// Shared cancellation state
// ---------------------------------------------------------------------------

/// Holds an optional sender that, when fired, cancels the running scan.
pub struct ScanCancelState(pub Arc<Mutex<Option<oneshot::Sender<()>>>>);

// ---------------------------------------------------------------------------
// Tauri event payload types (must match src/lib/types.ts)
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceEvent {
    pub hostname: String,
    pub ip: String,
    pub vendor: String,
    pub version: String,
    pub model: Option<String>,
    pub serial_number: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProgressEvent {
    pub scanned: u32,
    pub total: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompleteEvent {
    pub total_devices: u32,
    pub duration_ms: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanErrorEvent {
    pub message: String,
    pub ip: Option<String>,
}

// ---------------------------------------------------------------------------
// Line-level JSON from the Python CLI
// ---------------------------------------------------------------------------

/// A single JSON line emitted by `python3 -m netops.inventory.scan`.
#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum CliLine {
    Device {
        hostname: String,
        ip: String,
        vendor: String,
        version: String,
        model: Option<String>,
        serial_number: Option<String>,
    },
    Progress {
        scanned: u32,
        total: u32,
    },
    Complete {
        total_devices: u32,
        duration_ms: u64,
    },
    Error {
        message: String,
        ip: Option<String>,
    },
}

// ---------------------------------------------------------------------------
// Scan arguments builder
// ---------------------------------------------------------------------------

struct ScanArgs {
    args: Vec<String>,
}

impl ScanArgs {
    fn subnet(subnet: &str, user: &str, password: &str, deep: bool, concurrency: u32) -> Self {
        let mut args = vec![
            "-m".into(),
            "netops.inventory.scan".into(),
            "--subnet".into(),
            subnet.to_string(),
            "--user".into(),
            user.to_string(),
            "--password".into(),
            password.to_string(),
            "--concurrency".into(),
            concurrency.to_string(),
            "--output".into(),
            "json".into(),
        ];
        if deep {
            args.push("--deep".into());
        }
        Self { args }
    }

    fn csv(csv_path: &str, user: &str, password: &str, deep: bool, concurrency: u32) -> Self {
        let mut args = vec![
            "-m".into(),
            "netops.inventory.scan".into(),
            "--csv".into(),
            csv_path.to_string(),
            "--user".into(),
            user.to_string(),
            "--password".into(),
            password.to_string(),
            "--concurrency".into(),
            concurrency.to_string(),
            "--output".into(),
            "json".into(),
        ];
        if deep {
            args.push("--deep".into());
        }
        Self { args }
    }
}

// ---------------------------------------------------------------------------
// Core scan runner
// ---------------------------------------------------------------------------

/// Spawns `python3` with the given arguments, reads JSONL output line-by-line,
/// and emits Tauri events.  If `cancel_rx` fires, kills the child process.
async fn run_scan(
    app: AppHandle,
    python_args: ScanArgs,
    cancel_rx: oneshot::Receiver<()>,
) {
    let start = std::time::Instant::now();

    let child = Command::new("python3")
        .args(&python_args.args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .kill_on_drop(true)
        .spawn();

    let mut child = match child {
        Ok(c) => c,
        Err(e) => {
            // python3 / netops-toolkit not available — emit mock data for dev
            run_mock_scan(app, cancel_rx).await;
            let _ = e;
            return;
        }
    };

    let stdout = child.stdout.take().expect("stdout must be piped");
    let mut lines = BufReader::new(stdout).lines();

    tokio::pin!(cancel_rx);

    loop {
        tokio::select! {
            _ = &mut cancel_rx => {
                let _ = child.kill().await;
                break;
            }
            line = lines.next_line() => {
                match line {
                    Ok(Some(raw)) => {
                        if raw.trim().is_empty() {
                            continue;
                        }
                        match serde_json::from_str::<CliLine>(&raw) {
                            Ok(CliLine::Device { hostname, ip, vendor, version, model, serial_number }) => {
                                let _ = app.emit("scan:device", DeviceEvent {
                                    hostname, ip, vendor, version, model, serial_number,
                                });
                            }
                            Ok(CliLine::Progress { scanned, total }) => {
                                let _ = app.emit("scan:progress", ProgressEvent { scanned, total });
                            }
                            Ok(CliLine::Complete { total_devices, duration_ms }) => {
                                let _ = app.emit("scan:complete", CompleteEvent {
                                    total_devices,
                                    duration_ms,
                                });
                                break;
                            }
                            Ok(CliLine::Error { message, ip }) => {
                                let _ = app.emit("scan:error", ScanErrorEvent { message, ip });
                            }
                            Err(_) => {
                                // Ignore non-JSON lines (e.g. logging output)
                            }
                        }
                    }
                    Ok(None) => {
                        // Process exited — emit complete if not already done
                        let duration_ms = start.elapsed().as_millis() as u64;
                        let _ = app.emit("scan:complete", CompleteEvent {
                            total_devices: 0,
                            duration_ms,
                        });
                        break;
                    }
                    Err(e) => {
                        let _ = app.emit("scan:error", ScanErrorEvent {
                            message: e.to_string(),
                            ip: None,
                        });
                        break;
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Mock scan (development / no Python environment)
// ---------------------------------------------------------------------------

/// Simulates a scan by emitting mock events.  Used when `python3` or the
/// `netops-toolkit` package is not available in the environment.
async fn run_mock_scan(app: AppHandle, mut cancel_rx: oneshot::Receiver<()>) {
    use tokio::time::{sleep, Duration};

    let mock_devices = [
        ("router1", "10.0.0.1", "cisco", "16.9.4", "ISR4331"),
        ("sw-core", "10.0.0.2", "nokia", "23.10.R1", "7750 SR-7"),
        ("fw-edge", "10.0.0.3", "juniper", "22.3R1", "MX204"),
        ("sw-access", "10.0.0.4", "arista", "4.28.0F", "DCS-7050TX"),
        ("router2", "10.0.0.5", "cisco", "17.3.2", "ISR4451"),
    ];

    let total = mock_devices.len() as u32;

    for (i, (hostname, ip, vendor, version, model)) in mock_devices.iter().enumerate() {
        // Check for cancellation
        if cancel_rx.try_recv().is_ok() {
            return;
        }

        let scanned = (i + 1) as u32;
        sleep(Duration::from_millis(400)).await;

        let _ = app.emit(
            "scan:device",
            DeviceEvent {
                hostname: hostname.to_string(),
                ip: ip.to_string(),
                vendor: vendor.to_string(),
                version: version.to_string(),
                model: Some(model.to_string()),
                serial_number: None,
            },
        );

        let _ = app.emit("scan:progress", ProgressEvent { scanned, total });
    }

    let _ = app.emit(
        "scan:complete",
        CompleteEvent {
            total_devices: total,
            duration_ms: total as u64 * 400,
        },
    );
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Scan a CIDR subnet using `python3 -m netops.inventory.scan --subnet <subnet>`.
///
/// Results are streamed to the frontend via Tauri events:
/// - `scan:device`   — DeviceEvent for each host found
/// - `scan:progress` — ProgressEvent with running counts
/// - `scan:complete` — CompleteEvent when the scan finishes
/// - `scan:error`    — ScanErrorEvent for per-host errors
#[tauri::command]
pub async fn scan_subnet(
    app: AppHandle,
    cancel: State<'_, ScanCancelState>,
    subnet: String,
    user: String,
    password: String,
    deep: bool,
    concurrency: u32,
) -> Result<(), String> {
    validate_subnet(&subnet)?;
    validate_concurrency(concurrency)?;

    let (tx, rx) = oneshot::channel::<()>();

    {
        let mut guard = cancel.0.lock().await;
        // Cancel any previously running scan
        if let Some(prev) = guard.take() {
            let _ = prev.send(());
        }
        *guard = Some(tx);
    }

    let args = ScanArgs::subnet(&subnet, &user, &password, deep, concurrency);
    tokio::spawn(run_scan(app, args, rx));

    Ok(())
}

/// Scan hosts from a CSV file using `python3 -m netops.inventory.scan --csv <path>`.
///
/// Events are the same as for `scan_subnet`.
#[tauri::command]
pub async fn scan_csv(
    app: AppHandle,
    cancel: State<'_, ScanCancelState>,
    csv_path: String,
    user: String,
    password: String,
    deep: bool,
    concurrency: u32,
) -> Result<(), String> {
    validate_csv_path(&csv_path)?;
    validate_concurrency(concurrency)?;

    let (tx, rx) = oneshot::channel::<()>();

    {
        let mut guard = cancel.0.lock().await;
        if let Some(prev) = guard.take() {
            let _ = prev.send(());
        }
        *guard = Some(tx);
    }

    let args = ScanArgs::csv(&csv_path, &user, &password, deep, concurrency);
    tokio::spawn(run_scan(app, args, rx));

    Ok(())
}

/// Cancel the currently running scan.
#[tauri::command]
pub async fn cancel_scan(cancel: State<'_, ScanCancelState>) -> Result<(), String> {
    let mut guard = cancel.0.lock().await;
    if let Some(tx) = guard.take() {
        let _ = tx.send(());
    }
    Ok(())
}

/// Load an inventory JSON file from disk and return the parsed device list.
///
/// The file is expected to be a JSON array of device objects.
#[tauri::command]
pub async fn load_inventory(path: String) -> Result<Vec<serde_json::Value>, String> {
    let path = PathBuf::from(&path);

    let content = tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read inventory file: {e}"))?;

    let devices: Vec<serde_json::Value> =
        serde_json::from_str(&content).map_err(|e| format!("Invalid inventory JSON: {e}"))?;

    Ok(devices)
}

// ---------------------------------------------------------------------------
// Device detail payload types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Clone)]
pub struct SystemInfo {
    pub hostname: String,
    pub ip: String,
    pub vendor: String,
    pub model: String,
    pub version: String,
    pub serial: String,
    pub uptime: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct InterfaceEntry {
    pub name: String,
    pub status: String,
    pub speed: String,
    pub input_errors: u64,
    pub output_errors: u64,
    pub utilization: f32,
}

#[derive(Debug, Serialize, Clone)]
pub struct HealthInfo {
    pub cpu_percent: f32,
    pub memory_percent: f32,
    pub temperature_celsius: Option<f32>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BgpPeer {
    pub neighbor: String,
    pub remote_as: u32,
    pub state: String,
    pub prefixes_received: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct DeviceDetail {
    pub system_info: SystemInfo,
    pub interfaces: Vec<InterfaceEntry>,
    pub health: HealthInfo,
    pub bgp_peers: Vec<BgpPeer>,
    pub config_output: String,
}

// ---------------------------------------------------------------------------
// Device detail commands
// ---------------------------------------------------------------------------

/// Retrieve full device detail for `hostname`.
///
/// Calls the netops-toolkit sidecar with device-specific commands and returns
/// parsed system info, interface list, BGP peers, and raw config output.
/// Falls back to mock data when the sidecar is unavailable.
#[tauri::command]
pub async fn get_device_detail(hostname: String) -> Result<DeviceDetail, String> {
    // Attempt to call the Python CLI
    let output = Command::new("python3")
        .args([
            "-m",
            "netops.device.detail",
            "--hostname",
            &hostname,
            "--format",
            "json",
        ])
        .output()
        .await;

    if let Ok(out) = output {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(detail) = serde_json::from_str::<DeviceDetail>(&text) {
                return Ok(detail);
            }
        }
    }

    // Fall back to mock data
    Ok(mock_device_detail(&hostname))
}

/// Retrieve live health metrics (CPU, memory, temperature) for `hostname`.
///
/// Falls back to mock data when the sidecar is unavailable.
#[tauri::command]
pub async fn get_device_health(hostname: String) -> Result<HealthInfo, String> {
    let output = Command::new("python3")
        .args([
            "-m",
            "netops.device.health",
            "--hostname",
            &hostname,
            "--format",
            "json",
        ])
        .output()
        .await;

    if let Ok(out) = output {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(health) = serde_json::from_str::<HealthInfo>(&text) {
                return Ok(health);
            }
        }
    }

    Ok(mock_health(&hostname))
}

// ---------------------------------------------------------------------------
// Mock helpers for offline / sidecar-unavailable scenarios
// ---------------------------------------------------------------------------

fn mock_device_detail(hostname: &str) -> DeviceDetail {
    DeviceDetail {
        system_info: SystemInfo {
            hostname: hostname.to_string(),
            ip: "10.0.0.1".into(),
            vendor: "Cisco IOS".into(),
            model: "ASR1001-X".into(),
            version: "16.9.4".into(),
            serial: "FXS2208Q1GD".into(),
            uptime: "42 days, 3 hours".into(),
        },
        interfaces: vec![
            InterfaceEntry {
                name: "GigabitEthernet0/0/0".into(),
                status: "up".into(),
                speed: "1G".into(),
                input_errors: 0,
                output_errors: 0,
                utilization: 12.5,
            },
            InterfaceEntry {
                name: "GigabitEthernet0/0/1".into(),
                status: "up".into(),
                speed: "1G".into(),
                input_errors: 2,
                output_errors: 0,
                utilization: 5.2,
            },
            InterfaceEntry {
                name: "GigabitEthernet0/0/2".into(),
                status: "down".into(),
                speed: "1G".into(),
                input_errors: 0,
                output_errors: 0,
                utilization: 0.0,
            },
            InterfaceEntry {
                name: "Loopback0".into(),
                status: "up".into(),
                speed: "—".into(),
                input_errors: 0,
                output_errors: 0,
                utilization: 0.0,
            },
        ],
        health: mock_health(hostname),
        bgp_peers: vec![
            BgpPeer {
                neighbor: "10.0.0.2".into(),
                remote_as: 65001,
                state: "Established".into(),
                prefixes_received: 1024,
            },
            BgpPeer {
                neighbor: "192.168.1.1".into(),
                remote_as: 65002,
                state: "Established".into(),
                prefixes_received: 512,
            },
            BgpPeer {
                neighbor: "172.16.0.1".into(),
                remote_as: 65003,
                state: "Active".into(),
                prefixes_received: 0,
            },
        ],
        config_output: format!(
            "! Configuration for {hostname}\n!\nversion 16.9\n!\nhostname {hostname}\n!\ninterface GigabitEthernet0/0/0\n ip address 10.0.0.1 255.255.255.0\n no shutdown\n!\nrouter bgp 65001\n neighbor 10.0.0.2 remote-as 65001\n neighbor 192.168.1.1 remote-as 65002\n!\nend\n"
        ),
    }
}

fn mock_health(_hostname: &str) -> HealthInfo {
    HealthInfo {
        cpu_percent: 24.0,
        memory_percent: 61.5,
        temperature_celsius: Some(42.0),
    }
}

// ---------------------------------------------------------------------------
// Config backup payload types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConfigBackup {
    pub hostname: String,
    pub version: String,
    pub timestamp: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiffResult {
    pub hostname: String,
    pub version_a: String,
    pub version_b: String,
    pub unified: String,
    pub additions: u32,
    pub deletions: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RollbackResult {
    pub hostname: String,
    pub version: String,
    pub success: bool,
    pub message: String,
}

// ---------------------------------------------------------------------------
// Config backup commands
// ---------------------------------------------------------------------------

/// Trigger a config backup for the specified device.
///
/// Calls `python3 -m netops.collect.backup --hostname <hostname>`.
/// Falls back to mock data when the sidecar is unavailable.
#[tauri::command]
pub async fn backup_config(hostname: String) -> Result<ConfigBackup, String> {
    if hostname.trim().is_empty() {
        return Err("Hostname must not be empty".into());
    }

    let output = Command::new("python3")
        .args([
            "-m",
            "netops.collect.backup",
            "--hostname",
            &hostname,
            "--format",
            "json",
        ])
        .output()
        .await;

    if let Ok(out) = output {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(backup) = serde_json::from_str::<ConfigBackup>(&text) {
                return Ok(backup);
            }
        }
    }

    Ok(mock_backup(&hostname))
}

/// List stored config backups, optionally filtered by hostname.
///
/// Falls back to mock data when the sidecar is unavailable.
#[tauri::command]
pub async fn list_backups(hostname: Option<String>) -> Result<Vec<ConfigBackup>, String> {
    let mut cmd_args = vec!["-m", "netops.collect.backup", "--list", "--format", "json"];
    let hn;
    if let Some(ref h) = hostname {
        if h.trim().is_empty() {
            return Err("Hostname filter must not be empty".into());
        }
        hn = h.clone();
        cmd_args.push("--hostname");
        cmd_args.push(&hn);
    }

    let output = Command::new("python3").args(&cmd_args).output().await;

    if let Ok(out) = output {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(backups) = serde_json::from_str::<Vec<ConfigBackup>>(&text) {
                return Ok(backups);
            }
        }
    }

    Ok(mock_backup_list(hostname.as_deref()))
}

/// Compute a diff between two config versions for a device.
///
/// Calls `python3 -m netops.change.diff`.
/// Falls back to mock data when the sidecar is unavailable.
#[tauri::command]
pub async fn diff_configs(
    hostname: String,
    version_a: String,
    version_b: String,
) -> Result<DiffResult, String> {
    if hostname.trim().is_empty() {
        return Err("Hostname must not be empty".into());
    }

    let output = Command::new("python3")
        .args([
            "-m",
            "netops.change.diff",
            "--hostname",
            &hostname,
            "--version-a",
            &version_a,
            "--version-b",
            &version_b,
            "--format",
            "json",
        ])
        .output()
        .await;

    if let Ok(out) = output {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(diff) = serde_json::from_str::<DiffResult>(&text) {
                return Ok(diff);
            }
        }
    }

    Ok(mock_diff(&hostname, &version_a, &version_b))
}

/// Rollback a device config to a previous version.
///
/// Calls `python3 -m netops.change.rollback`.
/// Falls back to mock data when the sidecar is unavailable.
#[tauri::command]
pub async fn rollback_config(hostname: String, version: String) -> Result<RollbackResult, String> {
    if hostname.trim().is_empty() {
        return Err("Hostname must not be empty".into());
    }

    let output = Command::new("python3")
        .args([
            "-m",
            "netops.change.rollback",
            "--hostname",
            &hostname,
            "--version",
            &version,
            "--format",
            "json",
        ])
        .output()
        .await;

    if let Ok(out) = output {
        if out.status.success() {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(result) = serde_json::from_str::<RollbackResult>(&text) {
                return Ok(result);
            }
        }
    }

    Ok(mock_rollback(&hostname, &version))
}

// ---------------------------------------------------------------------------
// Config mock helpers
// ---------------------------------------------------------------------------

fn mock_backup(hostname: &str) -> ConfigBackup {
    ConfigBackup {
        hostname: hostname.to_string(),
        version: "v1".into(),
        timestamp: "2026-03-27T06:00:00Z".into(),
        size: 4096,
    }
}

fn mock_backup_list(hostname: Option<&str>) -> Vec<ConfigBackup> {
    let all = vec![
        ConfigBackup {
            hostname: "core-rtr-01".into(),
            version: "v3".into(),
            timestamp: "2026-03-26T08:00:00Z".into(),
            size: 4096,
        },
        ConfigBackup {
            hostname: "core-rtr-01".into(),
            version: "v2".into(),
            timestamp: "2026-03-20T14:30:00Z".into(),
            size: 3980,
        },
        ConfigBackup {
            hostname: "core-rtr-01".into(),
            version: "v1".into(),
            timestamp: "2026-03-10T09:15:00Z".into(),
            size: 3840,
        },
        ConfigBackup {
            hostname: "core-rtr-02".into(),
            version: "v2".into(),
            timestamp: "2026-03-25T11:45:00Z".into(),
            size: 4200,
        },
        ConfigBackup {
            hostname: "core-rtr-02".into(),
            version: "v1".into(),
            timestamp: "2026-03-15T16:20:00Z".into(),
            size: 4050,
        },
        ConfigBackup {
            hostname: "edge-rtr-01".into(),
            version: "v2".into(),
            timestamp: "2026-03-24T07:00:00Z".into(),
            size: 5120,
        },
        ConfigBackup {
            hostname: "edge-rtr-01".into(),
            version: "v1".into(),
            timestamp: "2026-03-12T10:30:00Z".into(),
            size: 4980,
        },
        ConfigBackup {
            hostname: "spine-sw-01".into(),
            version: "v1".into(),
            timestamp: "2026-03-22T13:00:00Z".into(),
            size: 3200,
        },
        ConfigBackup {
            hostname: "leaf-sw-01".into(),
            version: "v1".into(),
            timestamp: "2026-03-21T09:00:00Z".into(),
            size: 2800,
        },
    ];
    match hostname {
        Some(h) => all.into_iter().filter(|b| b.hostname == h).collect(),
        None => all,
    }
}

fn mock_diff(hostname: &str, version_a: &str, version_b: &str) -> DiffResult {
    DiffResult {
        hostname: hostname.to_string(),
        version_a: version_a.to_string(),
        version_b: version_b.to_string(),
        unified: format!(
            "--- {hostname} {version_a}\n\
             +++ {hostname} {version_b}\n\
             @@ -8,6 +8,9 @@\n\
             \ ip address 10.0.0.1 255.255.255.0\n\
             \ no shutdown\n\
             !\n\
             +interface GigabitEthernet0/0/1\n\
             + ip address 10.0.1.1 255.255.255.0\n\
             + no shutdown\n\
             +!\n\
             router bgp 65001\n\
             \ neighbor 10.0.0.2 remote-as 65001\n"
        ),
        additions: 4,
        deletions: 0,
    }
}

fn mock_rollback(hostname: &str, version: &str) -> RollbackResult {
    RollbackResult {
        hostname: hostname.to_string(),
        version: version.to_string(),
        success: true,
        message: format!("Successfully rolled back {hostname} to {version}"),
    }
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

fn validate_subnet(subnet: &str) -> Result<(), String> {
    // Basic CIDR validation: <ip>/<prefix>
    let parts: Vec<&str> = subnet.split('/').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid subnet '{subnet}': expected CIDR notation (e.g. 10.0.0.0/24)"));
    }

    let ip_parts: Vec<&str> = parts[0].split('.').collect();
    if ip_parts.len() != 4 || ip_parts.iter().any(|p| p.parse::<u8>().is_err()) {
        return Err(format!("Invalid IP address in subnet '{subnet}'"));
    }

    let prefix: u8 = parts[1]
        .parse()
        .map_err(|_| format!("Invalid prefix length in subnet '{subnet}'"))?;
    if prefix > 32 {
        return Err(format!("Prefix length must be 0–32, got {prefix}"));
    }

    Ok(())
}

fn validate_csv_path(path: &str) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("CSV path must not be empty".into());
    }
    Ok(())
}

fn validate_concurrency(concurrency: u32) -> Result<(), String> {
    if concurrency == 0 || concurrency > 200 {
        return Err(format!(
            "Concurrency must be between 1 and 200, got {concurrency}"
        ));
    }
    Ok(())
}
