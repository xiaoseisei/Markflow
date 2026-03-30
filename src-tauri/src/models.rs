use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum NodeType {
    File,
    Dir,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub node_type: NodeType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
    pub depth: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ext: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub last_workspace: Option<String>,
    pub last_opened_tabs: Vec<String>,
    pub last_active_tab: Option<String>,
    pub theme: String,
    pub code_theme: String,
    pub font_size: u32,
    pub font_family: String,
    pub line_height: f32,
    pub word_wrap: bool,
    pub sidebar_width: u32,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            last_workspace: None,
            last_opened_tabs: Vec::new(),
            last_active_tab: None,
            theme: "system".to_string(),
            code_theme: "github-light".to_string(),
            font_size: 14,
            font_family: "monospace".to_string(),
            line_height: 1.6,
            word_wrap: true,
            sidebar_width: 240,
        }
    }
}
