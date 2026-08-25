#[cfg(debug_assertions)]
use tauri::Manager;

mod bastion;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(bastion::BastionState::default())
        .invoke_handler(tauri::generate_handler![
            bastion::get_bastion_profiles,
            bastion::save_bastion_profile,
            bastion::delete_bastion_profile,
            bastion::get_bastion_status,
            bastion::connect_bastion,
            bastion::disconnect_bastion,
        ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                let window = _app
                    .get_webview_window("main")
                    .expect("main window should exist");
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
