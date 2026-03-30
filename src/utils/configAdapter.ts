/**
 * 配置持久化适配器
 * 在 Tauri 桌面版使用配置文件
 * 在浏览器版使用 localStorage
 */

import type { AppConfig } from '@/types'
import { getEnvInfo } from './env'

const STORAGE_KEY = 'markflow_config'

/**
 * 获取应用配置
 */
export async function getAppConfig(): Promise<Partial<AppConfig>> {
  const env = getEnvInfo()

  if (env.isTauri) {
    // Tauri 环境：使用 Tauri API
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke<AppConfig>('get_app_config')
    } catch {
      return {}
    }
  }

  if (env.isBrowser) {
    // 浏览器环境：使用 localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return {}
      }
    }
    return {}
  }

  return {}
}

/**
 * 保存应用配置
 */
export async function saveAppConfig(config: Partial<AppConfig>): Promise<void> {
  const env = getEnvInfo()

  if (env.isTauri) {
    // Tauri 环境：使用 Tauri API
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('save_app_config', { config })
    return
  }

  if (env.isBrowser) {
    // 浏览器环境：使用 localStorage
    const existing = await getAppConfig()
    const merged = { ...existing, ...config }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    return
  }

  throw new Error('当前环境不支持保存配置')
}

/**
 * 更新单个配置项
 */
export async function updateConfig<K extends keyof AppConfig>(
  key: K,
  value: AppConfig[K]
): Promise<void> {
  const config = await getAppConfig()
  config[key] = value
  await saveAppConfig(config)
}

/**
 * 获取单个配置项
 */
export async function getConfigValue<K extends keyof AppConfig>(
  key: K,
  defaultValue?: AppConfig[K]
): Promise<AppConfig[K] | undefined> {
  const config = await getAppConfig()
  return config[key] ?? defaultValue
}
