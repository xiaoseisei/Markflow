use std::{fs, path::PathBuf};

use crate::models::AppConfig;

fn config_path() -> Result<PathBuf, String> {
    let current_dir = std::env::current_dir().map_err(|error| format!("无法获取当前目录：{}", error))?;
    Ok(current_dir.join("markflow.config.json"))
}

#[tauri::command]
pub async fn get_app_config() -> Result<AppConfig, String> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content = fs::read_to_string(&path)
        .map_err(|error| format!("无法读取应用配置 '{}': {}", path.display(), error))?;
    serde_json::from_str(&content)
        .map_err(|error| format!("无法解析应用配置 '{}': {}", path.display(), error))
}

#[tauri::command]
pub async fn save_app_config(config: AppConfig) -> Result<(), String> {
    let path = config_path()?;
    let content = serde_json::to_string_pretty(&config)
        .map_err(|error| format!("无法序列化应用配置：{}", error))?;
    fs::write(&path, content)
        .map_err(|error| format!("无法写入应用配置 '{}': {}", path.display(), error))
}
