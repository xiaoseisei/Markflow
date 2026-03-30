mod commands;
mod models;

use commands::{
    config::{get_app_config, save_app_config},
    export::{export_html, open_print_dialog},
    fs::{create_dir, create_file, delete_path, path_exists, read_dir_children, read_dir_tree, read_file, rename_path, write_file},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file,
            read_dir_tree,
            read_dir_children,
            create_file,
            create_dir,
            delete_path,
            rename_path,
            path_exists,
            get_app_config,
            save_app_config,
            export_html,
            open_print_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
