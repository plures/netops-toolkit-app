use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod commands;
mod licensing;
mod partitions;
mod persistence;
mod policy;

use commands::ScanCancelState;
use licensing::commands::LicenseState;
use licensing::models::License;
use partitions::commands::PartitionListState;
use persistence::store::{PluresDbState, PluresDbStore};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ScanCancelState(Arc::new(Mutex::new(None))))
        .manage(LicenseState(Arc::new(Mutex::new(License::free()))))
        .manage(PartitionListState(Arc::new(Mutex::new(Vec::new()))))
        .manage(PluresDbState(Arc::new(Mutex::new(PluresDbStore::default()))))
        .invoke_handler(tauri::generate_handler![
            commands::scan_subnet,
            commands::scan_csv,
            commands::cancel_scan,
            commands::bastion_connect,
            commands::bastion_status,
            commands::bastion_disconnect,
            commands::load_inventory,
            commands::get_device_detail,
            commands::get_device_health,
            commands::get_fleet_health,
            commands::get_bgp_summary,
            commands::get_bgp_neighbors,
            commands::backup_config,
            commands::list_backups,
            commands::diff_configs,
            commands::rollback_config,
            commands::create_change_plan,
            commands::push_config,
            commands::get_change_diff,
            commands::rollback_change,
            commands::get_vlans,
            commands::check_vlan_consistency,
            commands::vault_init,
            commands::vault_unlock,
            commands::vault_list,
            commands::vault_set,
            commands::vault_delete,
            commands::vault_resolve,
            commands::export_ansible_inventory,
            commands::generate_playbook,
            commands::list_playbook_templates,
            // Licensing commands
            licensing::commands::import_license,
            licensing::commands::get_license,
            licensing::commands::validate_license,
            licensing::commands::deactivate_license,
            // Partition commands
            partitions::commands::list_partitions,
            partitions::commands::create_partition,
            partitions::commands::update_partition_state,
            // PluresDB persistence commands
            persistence::commands::pluresdb_scan_save,
            persistence::commands::pluresdb_scan_list,
            persistence::commands::pluresdb_scan_get,
            persistence::commands::pluresdb_scan_delete,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app
                    .get_webview_window("main")
                    .expect("main window should exist");
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
