/**
 * 全局类型定义
 * 用于扩展浏览器 API 类型定义
 */

// ============================================================================
// File System Access API 类型定义
// ============================================================================

interface FileSystemHandlePermissionDescriptor {
  mode: 'read' | 'readwrite'
}

interface FileSystemHandlePermission {
  readonly mode: 'read' | 'readwrite'
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean
}

interface FileSystemHandle {
  readonly name: string
  isSameEntry(other: FileSystemHandle): Promise<boolean>
  queryPermission(descriptor: FileSystemHandlePermissionDescriptor): Promise<FileSystemHandlePermission>
  requestPermission(descriptor: FileSystemHandlePermissionDescriptor): Promise<FileSystemHandlePermission>
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file'
  getFile(): Promise<File>
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory'
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
  // 【关键】添加 values() 方法的类型定义
  values(): AsyncIterableIterator<FileSystemHandle>
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: Blob | BufferSource | WriteParams): Promise<void>
  seek(position: number): Promise<void>
  truncate(size: number): Promise<void>
}

interface WriteParams {
  type?: 'write' | 'seek' | 'truncate'
  data?: Blob | BufferSource
  position?: number
  size?: number
}

// ============================================================================
// Window 扩展
// ============================================================================

interface ShowOpenFilePickerOptions {
  id?: string
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  multiple?: boolean
}

interface ShowSaveFilePickerOptions {
  id?: string
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

interface ShowDirectoryPickerOptions {
  id?: string
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  mode?: 'read' | 'readwrite'
}

interface Window {
  showOpenFilePicker: (options?: ShowOpenFilePickerOptions) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker: (options?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandle>
  showDirectoryPicker: (options?: ShowDirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>
}
