/**
 * API 适配层 — 统一导出
 *
 * 使用方式：
 *   import { authApi, adminApi } from '@/api'
 *
 * 环境切换：
 *   开发端 EnvPage 写入 qh_dev_env，refreshHttpConfig() 刷新 baseURL
 *   dev 环境自动使用 Mock 适配器
 *   staging/prod 环境走真实 HTTP
 */

export { default as http } from './http'
export { refreshHttpConfig } from './http'
export { currentBaseUrl, currentEnv, isDevEnv, isProdEnv, getEnvConfig } from './config'
export type { EnvName } from './config'
export { getFlag, useMockApi, mockDelayEnabled, refreshFlags } from './flags'

// API 服务模块
export { authApi } from './auth'
export type { AuthResponse } from './auth'

export { productsApi, shopApi } from './products'

export { healthApi, wuyunApi, constitutionApi, chatApi } from './health'

export { opsApi } from './ops'

export { adminApi } from './admin'
export type { AdminUser, AdminOrder, ContentReviewItem, AdminStats } from './admin'

export { qingflowApi } from './qingflow'
export type { QingFlowApp, QingFlowRecord } from './qingflow'

// Mock 数据类型（RBAC、审计日志）
export type { RbacPermission, AuditLogEntry } from './mock-handler'
