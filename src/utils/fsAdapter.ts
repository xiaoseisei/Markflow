/**
 * 文件系统适配器
 * 在 Tauri 桌面版使用原生文件系统 API
 * 在浏览器版使用 File System Access API
 */

import type { FileNode } from '@/types'
import { getEnvInfo } from './env'

// ============================================================================
// 类型定义
// ============================================================================

export interface FileWithHandle extends File {
  handle?: FileSystemFileHandle
}

// 浏览器环境下存储文件句柄的映射
// path -> FileSystemHandle
const browserFileHandles = new Map<string, FileSystemFileHandle>()
// 浏览器环境下存储目录句柄
const browserDirHandles = new Map<string, FileSystemDirectoryHandle>()

// ============================================================================
// 统一接口
// ============================================================================

/**
 * 读取文件内容
 */
export async function readFile(path: string): Promise<string> {
  const env = getEnvInfo()

  if (env.isTauri) {
    // Tauri 环境：使用 Tauri API
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<string>('read_file', { path })
  }

  if (env.isBrowser && env.supportsFileAPI) {
    // 浏览器环境：使用 File System Access API
    const handle = browserFileHandles.get(path)
    if (!handle) {
      throw new Error(`文件句柄未找到：${path}`)
    }
    const file = await handle.getFile()
    return file.text()
  }

  throw new Error('当前环境不支持读取文件')
}

/**
 * 写入文件内容
 */
export async function writeFile(path: string, content: string): Promise<void> {
  const env = getEnvInfo()

  if (env.isTauri) {
    // Tauri 环境：使用 Tauri API
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('write_file', { path, content })
    return
  }

  if (env.isBrowser && env.supportsFileAPI) {
    // 浏览器环境：使用 File System Access API
    const handle = browserFileHandles.get(path)
    if (!handle) {
      // 如果没有句柄，需要重新请求保存
      const newHandle = await window.showSaveFilePicker({
        suggestedName: path.split(/[/\\]/).at(-1) || 'untitled.md',
        types: [
          {
            description: 'Markdown 文件',
            accept: { 'text/markdown': ['.md', '.markdown'] },
          },
        ],
      })
      const writable = await newHandle.createWritable()
      await writable.write(content)
      await writable.close()
      browserFileHandles.set(path, newHandle)
      return
    }

    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
    return
  }

  throw new Error('当前环境不支持写入文件')
}

/**
 * 读取目录树
 * Tauri：返回完整文件树（仅一层，懒加载）
 * 浏览器：简化版，只能处理单层目录或通过选择多个文件
 */
export async function readDirTree(path: string): Promise<FileNode[]> {
  const env = getEnvInfo()

  if (env.isTauri) {
    // Tauri 环境：使用 Tauri API
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<FileNode[]>('read_dir_tree', { path })
  }

  if (env.isBrowser && env.supportsFileAPI) {
    // 浏览器环境：使用 showDirectoryPicker
    const handle = browserDirHandles.get(path)
    if (!handle) {
      throw new Error(`目录句柄未找到：${path}`)
    }
    return buildFileTreeFromHandle(handle, path, 0)
  }

  throw new Error('当前环境不支持读取目录')
}

/**
 * 【新增】懒加载：读取指定目录的子节点（仅一层）
 * Tauri：使用 read_dir_children 命令
 * 浏览器：使用 File System Access API 的 values() 方法
 */
export async function readDirChildren(dirPath: string): Promise<FileNode[]> {
  const env = getEnvInfo()

  if (env.isTauri) {
    // Tauri 环境：使用 Tauri API
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<FileNode[]>('read_dir_children', { dirPath })
  }

  if (env.isBrowser && env.supportsFileAPI) {
    // 浏览器环境：使用 File System Access API
    const handle = browserDirHandles.get(dirPath)
    if (!handle) {
      throw new Error(`目录句柄未找到：${dirPath}`)
    }
    return buildFileTreeFromHandle(handle as FileSystemDirectoryHandle, dirPath, 0)
  }

  throw new Error('当前环境不支持读取目录')
}

/**
 * 从 FileSystemDirectoryHandle 构建文件树
 */
async function buildFileTreeFromHandle(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string,
  depth: number
): Promise<FileNode[]> {
  const nodes: FileNode[] = []

  for await (const entry of dirHandle.values()) {
    const path = `${basePath}/${entry.name}`
    // 正确处理文件扩展名：隐藏文件无扩展名，其他文件取最后一个点后的部分
    const ext = entry.name.startsWith('.')
      ? undefined
      : entry.name.includes('.')
        ? entry.name.split('.').at(-1)
        : undefined

    if (entry.kind === 'file') {
      nodes.push({
        id: path,
        name: entry.name,
        path,
        type: 'file',
        ext,
        depth,
      })
      // 保存文件句柄
      browserFileHandles.set(path, entry as FileSystemFileHandle)
    } else if (entry.kind === 'directory') {
      const dirHandle = entry as FileSystemDirectoryHandle
      browserDirHandles.set(path, dirHandle)
      const children = await buildFileTreeFromHandle(dirHandle, path, depth + 1)
      nodes.push({
        id: path,
        name: entry.name,
        path,
        type: 'dir',
        children,
        depth,
      })
    }
  }

  // 排序：文件夹在前，文件在后
  nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'dir' ? -1 : 1
  })

  return nodes
}

/**
 * 选择并打开工作区目录
 */
export async function pickWorkspace(): Promise<{ path: string; nodes: FileNode[] } | null> {
  const env = getEnvInfo()

  if (env.isTauri) {
    // Tauri 环境：使用原生文件选择器
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({ directory: true })
    if (selected === null) return null

    const path = typeof selected === 'string' ? selected : (selected as { path: string }).path
    const { invoke } = await import('@tauri-apps/api/core')
    const nodes = await invoke<FileNode[]>('read_dir_tree', { path })
    return { path, nodes }
  }

  if (env.isBrowser && env.supportsFileAPI) {
    // 浏览器环境：使用 showDirectoryPicker
    try {
      const handle = await window.showDirectoryPicker()
      const path = `/${handle.name}`
      browserDirHandles.set(path, handle)
      const nodes = await buildFileTreeFromHandle(handle, path, 0)
      return { path, nodes }
    } catch (error) {
      // 用户取消选择
      if (error instanceof Error && error.name === 'AbortError') {
        return null
      }
      throw error
    }
  }

  throw new Error('当前环境不支持选择工作区')
}

/**
 * 选择并打开单个文件
 */
export async function pickFile(): Promise<{ path: string; content: string; title: string } | null> {
  const env = getEnvInfo()

  if (env.isTauri) {
    // Tauri 环境：使用原生文件选择器
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({ multiple: false })
    if (selected === null) return null

    const path = Array.isArray(selected) ? selected[0].path : (selected as unknown as { path: string }).path
    const { invoke } = await import('@tauri-apps/api/core')
    const content = await invoke<string>('read_file', { path })
    const title = path.split(/[/\\]/).at(-1) || path
    return { path, content, title }
  }

  if (env.isBrowser && env.supportsFileAPI) {
    // 浏览器环境：使用 showOpenFilePicker
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Markdown 文件',
            accept: { 'text/markdown': ['.md', '.markdown', '.txt'] },
          },
        ],
      })
      const file = await handle.getFile()
      const content = await file.text()
      const path = `/${file.name}`
      browserFileHandles.set(path, handle)
      return { path, content, title: file.name }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null
      }
      throw error
    }
  }

  throw new Error('当前环境不支持选择文件')
}

/**
 * 创建文件
 */
export async function createFile(path: string): Promise<void> {
  const env = getEnvInfo()

  if (env.isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('create_file', { path })
    return
  }

  if (env.isBrowser && env.supportsFileAPI) {
    // 浏览器环境：简化实现，通过保存对话框创建
    const fileName = path.split(/[/\\]/).at(-1) || 'untitled.md'
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'Markdown 文件',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write('')
    await writable.close()
    browserFileHandles.set(path, handle)
    return
  }

  throw new Error('当前环境不支持创建文件')
}

/**
 * 创建目录
 */
export async function createDir(path: string): Promise<void> {
  const env = getEnvInfo()

  if (env.isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('create_dir', { path })
    return
  }

  // 浏览器环境：暂不支持创建目录
  throw new Error('浏览器环境暂不支持创建目录')
}

/**
 * 删除文件或目录
 */
export async function deletePath(path: string): Promise<void> {
  const env = getEnvInfo()

  if (env.isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('delete_path', { path })
    return
  }

  // 浏览器环境：暂不支持删除
  throw new Error('浏览器环境暂不支持删除文件')
}

/**
 * 重命名文件或目录
 */
export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  const env = getEnvInfo()

  if (env.isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('rename_path', { oldPath, newPath })
    return
  }

  // 浏览器环境：暂不支持重命名
  throw new Error('浏览器环境暂不支持重命名')
}
