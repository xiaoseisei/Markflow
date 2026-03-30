import type { ExportConfig, FileNode } from '@/types'

async function safeInvoke<T>(command: string, payload?: Record<string, unknown>): Promise<T> {
  if (!(window as Window & { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__) {
    throw new Error('当前不在 Tauri 环境中运行')
  }

  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(command, payload)
}

export async function readFile(path: string): Promise<string> {
  return safeInvoke<string>('read_file', { path })
}

export async function writeFile(path: string, content: string): Promise<void> {
  return safeInvoke<void>('write_file', { path, content })
}

export async function readDirTree(path: string): Promise<FileNode[]> {
  return safeInvoke<FileNode[]>('read_dir_tree', { path })
}

/** 【新增】懒加载：读取指定目录的子节点（仅一层） */
export async function readDirChildren(dirPath: string): Promise<FileNode[]> {
  return safeInvoke<FileNode[]>('read_dir_children', { dirPath })
}

export async function createFile(path: string): Promise<void> {
  return safeInvoke<void>('create_file', { path })
}

export async function createDir(path: string): Promise<void> {
  return safeInvoke<void>('create_dir', { path })
}

export async function deletePath(path: string): Promise<void> {
  return safeInvoke<void>('delete_path', { path })
}

export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  return safeInvoke<void>('rename_path', { oldPath, newPath })
}

export async function getAppConfig(): Promise<unknown> {
  return safeInvoke('get_app_config')
}

export async function saveAppConfig(config: unknown): Promise<void> {
  return safeInvoke<void>('save_app_config', { config })
}

export async function exportHtml(html: string, config: ExportConfig, outputPath: string): Promise<string> {
  return safeInvoke<string>('export_html', { html, config, outputPath })
}

export async function openPrintDialog(): Promise<void> {
  return safeInvoke<void>('open_print_dialog')
}
