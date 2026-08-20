/**
 * API 环境配置 — 读取 qh_dev_env localStorage
 * 由开发端 EnvPage.vue 写入，axios 适配层据此确定 baseURL
 */

export type EnvName = 'dev' | 'staging' | 'prod'

interface EnvConfig {
  env: EnvName
  apiBaseUrl: Record<EnvName, string>
}

const ENV_KEY = 'qh_dev_env'

const DEFAULT_ENV: EnvConfig = {
  env: 'dev',
  apiBaseUrl: {
    dev: 'http://localhost:8000',
    staging: 'https://staging-api.suheng-os.example.com',
    prod: 'https://api.suheng-os.example.com',
  },
}

let cached: EnvConfig | null = null

/** 读取环境配置（带缓存，每次调用刷新） */
export function getEnvConfig(): EnvConfig {
  try {
    const raw = localStorage.getItem(ENV_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as EnvConfig
      cached = { ...DEFAULT_ENV, ...parsed }
      return cached
    }
  } catch {
    // ignore
  }
  cached = { ...DEFAULT_ENV }
  return cached
}

/** 当前环境 */
export function currentEnv(): EnvName {
  return getEnvConfig().env
}

/** 当前 baseURL */
export function currentBaseUrl(): string {
  const cfg = getEnvConfig()
  return cfg.apiBaseUrl[cfg.env]
}

/** 是否为 dev 环境（使用 Mock） */
export function isDevEnv(): boolean {
  return currentEnv() === 'dev'
}

/** 是否为生产环境 */
export function isProdEnv(): boolean {
  return currentEnv() === 'prod'
}
