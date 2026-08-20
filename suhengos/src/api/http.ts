/**
 * Axios HTTP 实例
 * - 读取 qh_dev_env 确定 baseURL
 * - 注入 qh_auth_token 到 Authorization header
 * - dev 环境使用 Mock 适配器
 * - 统一错误处理
 */

import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { currentBaseUrl, isDevEnv } from './config'
import { useMockApi } from './flags'
import { mockAdapter } from './mock-adapter'

const TOKEN_KEY = 'qh_auth_token'

/** 是否使用 Mock 适配器 */
function shouldUseMock(): boolean {
  return useMockApi()
}

/** 创建 axios 实例 */
const http: AxiosInstance = axios.create({
  baseURL: currentBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// dev 环境 / Mock 模式：注入 mock adapter
if (shouldUseMock()) {
  http.defaults.adapter = mockAdapter
}

// ============ 请求拦截器 ============

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 注入 token
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 注入 locale
    const locale = localStorage.getItem('qh_locale') || 'zh'
    config.headers['Accept-Language'] = locale

    return config
  },
  (error) => Promise.reject(error),
)

// ============ 响应拦截器 ============

http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 统一提取 data
    return response.data
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response
      const message = (data as { message?: string })?.message

      switch (status) {
        case 401:
          // Token 失效：清除登录态
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem('qh_auth_user')
          console.warn('[API] 401 Unauthorized — token cleared')
          break
        case 403:
          console.warn('[API] 403 Forbidden —', message)
          break
        case 404:
          console.warn('[API] 404 Not Found —', message)
          break
        case 500:
          console.error('[API] 500 Server Error —', message)
          break
      }
    } else if (error.request) {
      console.error('[API] Network Error —', error.message)
    }

    return Promise.reject(error)
  },
)

/**
 * 刷新 HTTP 配置（环境切换后调用）
 * 重新读取 qh_dev_env 和 qh_dev_flags
 */
export function refreshHttpConfig(): void {
  http.defaults.baseURL = currentBaseUrl()
  if (shouldUseMock()) {
    http.defaults.adapter = mockAdapter
  } else {
    http.defaults.adapter = undefined // 使用默认 HTTP adapter
  }
}

export default http
