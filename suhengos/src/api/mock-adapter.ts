/**
 * Axios Mock 适配器
 * 在 dev 环境下拦截 axios 请求，返回 Mock 数据
 */

import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { matchRoute } from './mock-handler'
import { mockDelayEnabled } from './flags'

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Mock 适配器：拦截请求并返回 Mock 数据
 * 未匹配路由时返回 404
 */
export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const method = (config.method || 'GET').toUpperCase()
  const url = config.url || ''

  const match = matchRoute(method, url)

  if (!match) {
    // 未匹配到 Mock 路由
    const response: AxiosResponse = {
      data: { message: `Mock route not found: ${method} ${url}` },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config,
    }
    return Promise.reject(createError(response, config))
  }

  // 模拟网络延迟
  if (mockDelayEnabled()) {
    await delay(300 + Math.random() * 500)
  } else {
    await delay(50) // 最小延迟，模拟异步
  }

  const result = await match.handler(config)

  const response: AxiosResponse = {
    data: result.data,
    status: result.status,
    statusText: result.status === 200 ? 'OK' : result.status === 201 ? 'Created' : 'Error',
    headers: { 'content-type': 'application/json' },
    config,
  }

  if (result.status >= 400) {
    return Promise.reject(createError(response, config))
  }

  return response
}

/** 创建 AxiosError 风格的错误对象 */
function createError(response: AxiosResponse, config: InternalAxiosRequestConfig) {
  const err: Record<string, unknown> = {
    message: (response.data as { message?: string })?.message || 'Request failed',
    config,
    response,
    isAxiosError: true,
  }
  return err
}
