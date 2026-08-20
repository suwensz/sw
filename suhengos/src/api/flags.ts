/**
 * Feature Flag 读取器 — 读取 qh_dev_flags localStorage
 * 由开发端 FlagsPage.vue 写入，全端可读取
 */

const FLAGS_KEY = 'qh_dev_flags'

let cache: Record<string, boolean> | null = null

function loadAll(): Record<string, boolean> {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(FLAGS_KEY)
    cache = raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    return cache
  } catch {
    cache = {}
    return cache
  }
}

/** 读取单个 flag（不存在时返回 default） */
export function getFlag(key: string, defaultValue = false): boolean {
  const flags = loadAll()
  return key in flags ? flags[key] : defaultValue
}

/** 刷新缓存（FlagsPage 保存后调用） */
export function refreshFlags(): void {
  cache = null
  loadAll()
}

/** 是否使用 Mock API（dev 环境默认 true，staging/prod 默认 false） */
export function useMockApi(): boolean {
  // dev 环境强制 mock
  const env = localStorage.getItem('qh_dev_env')
  try {
    const cfg = env ? JSON.parse(env) : null
    if (cfg?.env === 'dev') return true
    if (cfg?.env === 'prod' || cfg?.env === 'staging') {
      // staging/prod 下检查是否有 mock fallback flag
      return getFlag('api.mock.fallback', false)
    }
  } catch {
    // ignore
  }
  return true // 默认 mock
}

/** 是否启用 Mock 延迟 */
export function mockDelayEnabled(): boolean {
  return getFlag('mock.api.delay', false)
}
