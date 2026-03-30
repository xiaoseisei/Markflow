use std::fs;

#[tauri::command]
pub async fn export_html(html: String, _config: serde_json::Value, output_path: String) -> Result<String, String> {
    fs::write(&output_path, html)
        .map_err(|error| format!("无法导出 HTML '{}': {}", output_path, error))?;
    Ok(output_path)
}

#[tauri::command]
pub async fn open_print_dialog(window: tauri::Window) -> Result<(), String> {
    window.print().map_err(|error| format!("无法打开打印对话框：{}", error))
}
