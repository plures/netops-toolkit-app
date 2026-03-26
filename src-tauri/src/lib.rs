use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod commands;

use commands::ScanCancelState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(ScanCancelState(Arc::new(Mutex::new(None))))
        .invoke_handler(tauri::generate_handler![
            commands::scan_subnet,
            commands::scan_csv,
            commands::cancel_scan,
            commands::load_inventory,
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
