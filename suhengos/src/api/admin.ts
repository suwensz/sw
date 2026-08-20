/**
 * Admin 管理端 API 服务
 * 包含用户、订单、内容审核、RBAC 权限矩阵、审计日志
 */

import http from './http'
import type { RbacPermission, AuditLogEntry } from './mock-handler'

export interface AdminUser {
  id: string
  email: string
  nickname: string
  role: 'user' | 'admin'
  status: 'active' | 'disabled'
  locale: string
  orders: number
  spent: number
  createdAt: string
}

export interface AdminOrder {
  id: string
  userEmail: string
  productName: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'refunded'
  createdAt: string
}

export interface ContentReviewItem {
  id: string
  module: 'shop' | 'health' | 'ops' | 'ui'
  key: string
  locale: string
  sourceText: string
  translatedText: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalOrders: number
  pendingOrders: number
  pendingReviews: number
  totalRevenue: number
}

export const adminApi = {
  /** 用户管理 */
  getUsers(): Promise<AdminUser[]> {
    return http.get('/api/v1/admin/users') as unknown as Promise<AdminUser[]>
  },

  updateUserStatus(id: string, status: 'active' | 'disabled'): Promise<AdminUser> {
    return http.put(`/api/v1/admin/users/${id}/status`, { status }) as unknown as Promise<AdminUser>
  },

  updateUserRole(id: string, role: 'user' | 'admin'): Promise<AdminUser> {
    return http.put(`/api/v1/admin/users/${id}/role`, { role }) as unknown as Promise<AdminUser>
  },

  /** 订单管理 */
  getOrders(): Promise<AdminOrder[]> {
    return http.get('/api/v1/admin/orders') as unknown as Promise<AdminOrder[]>
  },

  /** 内容审核 */
  getContentReviews(): Promise<ContentReviewItem[]> {
    return http.get('/api/v1/admin/content-reviews') as unknown as Promise<ContentReviewItem[]>
  },

  reviewContent(id: string, status: 'approved' | 'rejected'): Promise<{ id: string; status: string }> {
    return http.put(`/api/v1/admin/content-reviews/${id}`, { status }) as unknown as Promise<{ id: string; status: string }>
  },

  /** 统计看板 */
  getStats(): Promise<AdminStats> {
    return http.get('/api/v1/admin/stats') as unknown as Promise<AdminStats>
  },

  /** RBAC 权限矩阵 */
  getRbacMatrix(): Promise<RbacPermission[]> {
    return http.get('/api/v1/admin/rbac/matrix') as unknown as Promise<RbacPermission[]>
  },

  /** 审计日志 */
  getAuditLogs(params?: {
    action?: string
    resource?: string
    status?: string
    page?: number
    pageSize?: number
  }): Promise<{ total: number; page: number; pageSize: number; data: AuditLogEntry[] }> {
    return http.get('/api/v1/admin/audit-logs', { params }) as unknown as Promise<{ total: number; page: number; pageSize: number; data: AuditLogEntry[] }>
  },
}
