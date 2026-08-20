/**
 * 轻流数据 API 服务
 * 与轻流 A/B/C 应用数据打通
 */

import http from './http'
import type { QingFlowApp, QingFlowRecord } from './mock-handler'

export const qingflowApi = {
  /** 获取轻流应用列表 */
  getApps(): Promise<QingFlowApp[]> {
    return http.get('/api/v1/qingflow/apps') as unknown as Promise<QingFlowApp[]>
  },

  /** 获取应用数据记录 */
  getRecords(appId: string): Promise<QingFlowRecord[]> {
    return http.get(`/api/v1/qingflow/apps/${appId}/records`) as unknown as Promise<QingFlowRecord[]>
  },

  /** 触发同步 */
  sync(appId: string): Promise<{ success: boolean; syncedAt: string; recordCount: number }> {
    return http.post('/api/v1/qingflow/sync', { appId }) as unknown as Promise<{ success: boolean; syncedAt: string; recordCount: number }>
  },
}

export type { QingFlowApp, QingFlowRecord } from './mock-handler'
