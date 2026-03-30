use std::{fs, path::{Path, PathBuf}};

use sha1::{Digest, Sha1};
use walkdir::WalkDir;

use crate::models::{FileNode, NodeType};

/// 目录黑名单：这些目录将被自动忽略，不会进入扫描
const IGNORED_DIRECTORIES: &[&str] = &[
    "node_modules",
    ".git",
    "target",
    "dist",
    "build",
    ".next",
    ".nuxt",
    "coverage",
    ".vscode",
    ".idea",
    ".DS_Store",
    "Thumbs.db",
    "vendor",
    ".venv",
    "venv",
    "__pycache__",
    ".cache",
    ".parcel-cache",
];

/// 检查目录名是否在黑名单中
fn should_ignore_dir_name(dir_name: &str) -> bool {
    IGNORED_DIRECTORIES.contains(&dir_name)
}

/// 检查完整路径是否应该被忽略（用于处理深层嵌套的黑名单目录）
fn should_ignore_path(path: &Path) -> bool {
    path.components()
        .filter_map(|c| c.as_os_str().to_str())
        .any(|c| should_ignore_dir_name(c))
}

fn hash_path(path: &str) -> String {
    let mut hasher = Sha1::new();
    hasher.update(path.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// 【核心改动】仅构建单层文件节点，不再递归
///
/// 【实现思路】
/// - 只返回当前层级的文件/目录信息
/// - 目录的 children 字段设为 None，前端需要时再通过 `read_dir_children` 加载
/// - 自动过滤黑名单目录
fn build_file_node_single_layer(path: &Path, depth: u32) -> Result<FileNode, String> {
    let metadata = fs::metadata(path)
        .map_err(|error| format!("无法读取路径信息 '{}': {}", path.display(), error))?;

    let name = path
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| path.display().to_string());
    let path_string = path.to_string_lossy().to_string();

    if metadata.is_dir() {
        // 【关键修改】目录的 children 设为 None，表示需要懒加载
        return Ok(FileNode {
            id: hash_path(&path_string),
            name,
            path: path_string,
            node_type: NodeType::Dir,
            children: None, // 懒加载标记
            depth,
            ext: None,
        });
    }

    let ext = path.extension().map(|value| value.to_string_lossy().to_string());
    Ok(FileNode {
        id: hash_path(&path_string),
        name,
        path: path_string,
        node_type: NodeType::File,
        children: None,
        depth,
        ext,
    })
}

/// 【新增命令】读取指定目录的直接子节点（懒加载用）
///
/// 【实现思路】
/// - 只返回下一层的文件/目录，不递归
/// - 前端在用户展开文件夹时调用此命令
/// - 自动过滤黑名单目录
#[tauri::command]
pub async fn read_dir_children(dir_path: String) -> Result<Vec<FileNode>, String> {
    let path = PathBuf::from(&dir_path);

    if !path.exists() {
        return Err(format!("目录不存在：{}", dir_path));
    }

    if !path.is_dir() {
        return Err(format!("路径不是目录：{}", dir_path));
    }

    let mut children = Vec::new();

    // 【踩坑预警】使用 fs::read_dir 而非 WalkDir，因为我们只需要一层
    let entries = fs::read_dir(&path)
        .map_err(|error| format!("无法读取目录 '{}': {}", path.display(), error))?;

    for entry in entries {
        let entry = entry.map_err(|error| format!("读取目录项失败：{}", error))?;
        let entry_path = entry.path();

        // 【核心】黑名单过滤：跳过 node_modules 等目录
        if entry_path.is_dir() {
            if let Some(dir_name) = entry_path.file_name().and_then(|n| n.to_str()) {
                if should_ignore_dir_name(dir_name) {
                    continue; // 跳过黑名单目录
                }
            }
        }

        // 构建单层节点（不递归）
        match build_file_node_single_layer(&entry_path, 0) {
            Ok(node) => children.push(node),
            Err(error) => {
                // 【防御性编程】单个文件失败不影响整体扫描
                eprintln!("警告: {}", error);
            }
        }
    }

    // 按名称排序：目录优先，然后按字母序
    children.sort_by(|a, b| {
        match (&a.node_type, &b.node_type) {
            (NodeType::Dir, NodeType::File) => std::cmp::Ordering::Less,
            (NodeType::File, NodeType::Dir) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });

    Ok(children)
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|error| format!("无法读取文件 '{}': {}", path, error))
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|error| format!("无法创建目录 '{}': {}", parent.display(), error))?;
    }

    fs::write(&path, content).map_err(|error| format!("无法写入文件 '{}': {}", path, error))
}

/// 【重构】读取工作区根目录的顶层内容
///
/// 【实现思路】
/// - 只读取第一层文件/目录
/// - 不再递归扫描子目录
/// - 自动过滤黑名单目录
#[tauri::command]
pub async fn read_dir_tree(path: String) -> Result<Vec<FileNode>, String> {
    let root = PathBuf::from(&path);
    if !root.exists() {
        return Err(format!("目录不存在：{}", path));
    }

    let mut nodes = Vec::new();

    // 只读取第一层（min_depth=1, max_depth=1）
    for entry in WalkDir::new(&root)
        .min_depth(1)
        .max_depth(1)
        .sort_by_file_name()
        .into_iter()
    {
        let entry = entry.map_err(|error| format!("读取目录失败：{}", error))?;
        let entry_path = entry.path();

        // 【核心】黑名单过滤
        if entry_path.is_dir() {
            if let Some(dir_name) = entry_path.file_name().and_then(|n| n.to_str()) {
                if should_ignore_dir_name(dir_name) {
                    continue;
                }
            }
        }

        // 【关键修改】max_depth 改为 0，不再递归
        nodes.push(build_file_node_single_layer(entry_path, 0)?);
    }

    Ok(nodes)
}

#[tauri::command]
pub async fn create_file(path: String) -> Result<(), String> {
    if Path::new(&path).exists() {
        return Err(format!("文件已存在：{}", path));
    }

    write_file(path, String::new()).await
}

#[tauri::command]
pub async fn create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|error| format!("无法创建文件夹 '{}': {}", path, error))
}

#[tauri::command]
pub async fn delete_path(path: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    let metadata = fs::metadata(&target).map_err(|error| format!("无法读取路径 '{}': {}", path, error))?;

    if metadata.is_dir() {
        fs::remove_dir_all(&target).map_err(|error| format!("无法删除目录 '{}': {}", path, error))
    } else {
        fs::remove_file(&target).map_err(|error| format!("无法删除文件 '{}': {}", path, error))
    }
}

#[tauri::command]
pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path)
        .map_err(|error| format!("无法重命名 '{}' 到 '{}': {}", old_path, new_path, error))
}

#[tauri::command]
pub async fn path_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}
