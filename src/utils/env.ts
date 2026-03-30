/**
 * 环境检测工具
 * 用于判断当前运行在 Tauri 桌面环境还是浏览器环境
 */

/**
 * 检测是否在 Tauri 环境中运行
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * 检测是否支持 File System Access API
 * Chrome/Edge 86+ 支持，Safari/Firefox 支持有限
 */
export function supportsFileSystemAccessAPI(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

/**
 * 获取运行环境类型
 */
export type EnvType = 'tauri' | 'browser' | 'unknown'

export function getEnvType(): EnvType {
  if (isTauri()) return 'tauri'
  if (typeof window !== 'undefined') return 'browser'
  return 'unknown'
}

/**
 * 环境信息
 */
export interface EnvInfo {
  type: EnvType
  isTauri: boolean
  isBrowser: boolean
  supportsFileAPI: boolean
}

export function getEnvInfo(): EnvInfo {
  const type = getEnvType()
  return {
    type,
    isTauri: type === 'tauri',
    isBrowser: type === 'browser',
    supportsFileAPI: supportsFileSystemAccessAPI(),
  }
}
