/**
 * 素衡OS · 管理端数据
 * 用户 / 角色 / 系统设置 / 审计日志 / 通知公告 / 备份 / 存储 / 集成，
 * 均为前端 Mock + localStorage 持久化。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  SEED_AUDIT_LOGS,
  SEED_NOTICES,
  SEED_BACKUPS,
  SEED_STORAGE,
  SEED_INTEGRATIONS,
  type AuditLogRecord,
  type NoticeRecord,
  type BackupRecord,
  type StorageResource,
  type IntegrationRecord,
} from '@/mock/adminData'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'ops' | 'dev' | 'user'
  status: 'active' | 'disabled'
  registeredAt: string
  lastActive: string
}

export interface AdminRole {
  id: string
  name: string
  desc: string
  permissions: string[]
  memberCount: number
}

export interface SystemSettings {
  platformName: string
  siteDomain: string
  maintenanceMode: boolean
  allowRegister: boolean
  requireEmailVerify: boolean
  healthAlertEnabled: boolean
  orderAutoCancelHours: number
}

const USERS_KEY = 'qh_admin_users'
const SETTINGS_KEY = 'qh_admin_settings'
const ROLES_KEY = 'qh_admin_roles'
const AUDIT_KEY = 'qh_admin_audit'
const NOTICES_KEY = 'qh_admin_notices'
const BACKUPS_KEY = 'qh_admin_backups'
const STORAGE_KEY_ = 'qh_admin_storage'
const INTEGRATIONS_KEY = 'qh_admin_integrations'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

const SEED_USERS: AdminUser[] = [
  { id: 'u001', name: '系统管理员', email: 'admin@suheng-os.com', role: 'superadmin', status: 'active', registeredAt: '2026-01-01', lastActive: '2026-08-20 09:12' },
  { id: 'u002', name: '运营专员', email: 'ops@suheng-os.com', role: 'ops', status: 'active', registeredAt: '2026-03-15', lastActive: '2026-08-20 08:40' },
  { id: 'u003', name: '开发者小明', email: 'dev@coze.dev', role: 'dev', status: 'active', registeredAt: '2026-04-02', lastActive: '2026-08-19 22:05' },
  { id: 'u004', name: '岐黄体验官', email: 'dev_user@coze.dev', role: 'user', status: 'active', registeredAt: '2026-05-10', lastActive: '2026-08-20 07:30' },
  { id: 'u005', name: '海外用户 Anna', email: 'anna@example.com', role: 'user', status: 'disabled', registeredAt: '2026-06-21', lastActive: '2026-07-02 14:20' },
]

const SEED_ROLES: AdminRole[] = [
  { id: 'r_super', name: '超级管理员', desc: '拥有平台全部权限', permissions: ['*'], memberCount: 1 },
  { id: 'r_admin', name: '平台管理员', desc: '管理用户、数据与系统配置', permissions: ['user.manage', 'stats.view', 'settings.edit', 'role.manage'], memberCount: 2 },
  { id: 'r_ops', name: '运营角色', desc: '使用运营工作台全部工具', permissions: ['ops.competitor', 'ops.supply', 'ops.listing', 'ops.procurement'], memberCount: 3 },
  { id: 'r_dev', name: '开发者', desc: '访问开放平台与 API 文档', permissions: ['dev.apps', 'dev.keys', 'dev.docs'], memberCount: 4 },
  { id: 'r_user', name: '普通用户', desc: '使用素衡OS 主站服务', permissions: ['shop.view', 'shop.order', 'health.view'], memberCount: 126 },
]

const SEED_SETTINGS: SystemSettings = {
  platformName: '素衡OS',
  siteDomain: 'www.suheng-os.com',
  maintenanceMode: false,
  allowRegister: true,
  requireEmailVerify: false,
  healthAlertEnabled: true,
  orderAutoCancelHours: 48,
}

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AdminUser[]>(load(USERS_KEY, SEED_USERS))
  const roles = ref<AdminRole[]>(load(ROLES_KEY, SEED_ROLES))
  const settings = ref<SystemSettings>(load(SETTINGS_KEY, SEED_SETTINGS))
  const auditLogs = ref<AuditLogRecord[]>(load(AUDIT_KEY, SEED_AUDIT_LOGS))
  const notices = ref<NoticeRecord[]>(load(NOTICES_KEY, SEED_NOTICES))
  const backups = ref<BackupRecord[]>(load(BACKUPS_KEY, SEED_BACKUPS))
  const storage = ref<StorageResource[]>(load(STORAGE_KEY_, SEED_STORAGE))
  const integrations = ref<IntegrationRecord[]>(load(INTEGRATIONS_KEY, SEED_INTEGRATIONS))

  function saveUsers() {
    save(USERS_KEY, users.value)
  }

  /** 审计记录辅助：任何管理端操作自动落一条审计日志 */
  function logAudit(module: string, action: string, result: 'success' | 'fail' = 'success') {
    auditLogs.value.unshift({
      id: `a${Date.now().toString(36)}`,
      operator: '系统管理员',
      module,
      action,
      ip: '192.168.1.10',
      result,
      time: new Date().toISOString().slice(0, 16).replace('T', ' '),
    })
    if (auditLogs.value.length > 200) auditLogs.value.length = 200
    save(AUDIT_KEY, auditLogs.value)
  }

  function addUser(user: Omit<AdminUser, 'id' | 'registeredAt' | 'lastActive'>) {
    users.value.unshift({
      ...user,
      id: `u${Date.now().toString(36)}`,
      registeredAt: new Date().toISOString().slice(0, 10),
      lastActive: '—',
    })
    saveUsers()
    logAudit('用户管理', `新增用户 ${user.name}`)
  }

  function updateUser(id: string, patch: Partial<AdminUser>) {
    const target = users.value.find((u) => u.id === id)
    if (target) {
      Object.assign(target, patch)
      saveUsers()
      logAudit('用户管理', `更新用户 ${target.name}`)
    }
  }

  function removeUser(id: string) {
    const target = users.value.find((u) => u.id === id)
    users.value = users.value.filter((u) => u.id !== id)
    saveUsers()
    logAudit('用户管理', `删除用户 ${target?.name ?? id}`)
  }

  // ---- 角色 ----
  function saveRoles() {
    save(ROLES_KEY, roles.value)
  }
  function addRole(role: Omit<AdminRole, 'id' | 'memberCount'>) {
    roles.value.push({ ...role, id: `r_${Date.now().toString(36)}`, memberCount: 0 })
    saveRoles()
    logAudit('角色权限', `新增角色 ${role.name}`)
  }
  function updateRole(id: string, patch: Partial<AdminRole>) {
    const target = roles.value.find((r) => r.id === id)
    if (target) {
      Object.assign(target, patch)
      saveRoles()
      logAudit('角色权限', `更新角色 ${target.name}`)
    }
  }
  function removeRole(id: string) {
    const target = roles.value.find((r) => r.id === id)
    roles.value = roles.value.filter((r) => r.id !== id)
    saveRoles()
    logAudit('角色权限', `删除角色 ${target?.name ?? id}`)
  }

  function saveSettings() {
    save(SETTINGS_KEY, settings.value)
    logAudit('系统设置', '保存系统设置')
  }

  // ---- 审计日志 ----
  function addAuditLog(entry: AuditLogRecord) {
    auditLogs.value.unshift(entry)
    if (auditLogs.value.length > 200) auditLogs.value.length = 200
    save(AUDIT_KEY, auditLogs.value)
  }

  // ---- 通知公告 ----
  function saveNotices() {
    save(NOTICES_KEY, notices.value)
  }
  function addNotice(notice: Omit<NoticeRecord, 'id'>) {
    notices.value.unshift({ ...notice, id: `n${Date.now().toString(36)}` })
    saveNotices()
    logAudit('通知公告', `发布公告 ${notice.title}`)
  }
  function updateNotice(id: string, patch: Partial<NoticeRecord>) {
    const target = notices.value.find((n) => n.id === id)
    if (target) {
      Object.assign(target, patch)
      saveNotices()
      logAudit('通知公告', `更新公告 ${target.title}`)
    }
  }
  function removeNotice(id: string) {
    const target = notices.value.find((n) => n.id === id)
    notices.value = notices.value.filter((n) => n.id !== id)
    saveNotices()
    logAudit('通知公告', `删除公告 ${target?.title ?? id}`)
  }

  // ---- 备份 ----
  function createBackup() {
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    backups.value.unshift({
      id: `b${Date.now().toString(36)}`,
      name: `全量备份-${stamp}`,
      size: `${(1.8 + Math.random() * 1.2).toFixed(1)} GB`,
      createdAt: now.toISOString().slice(0, 16).replace('T', ' '),
    })
    save(BACKUPS_KEY, backups.value)
    logAudit('数据备份', `创建备份 ${backups.value[0].name}`)
    return backups.value[0]
  }

  // ---- 集成 ----
  function toggleIntegration(id: string) {
    const target = integrations.value.find((i) => i.id === id)
    if (target) {
      target.connected = !target.connected
      save(INTEGRATIONS_KEY, integrations.value)
      logAudit('平台集成', `${target.connected ? '连接' : '断开'} ${target.name}`)
    }
  }

  return {
    users,
    roles,
    settings,
    auditLogs,
    notices,
    backups,
    storage,
    integrations,
    addUser,
    updateUser,
    removeUser,
    addRole,
    updateRole,
    removeRole,
    saveSettings,
    addAuditLog,
    addNotice,
    updateNotice,
    removeNotice,
    createBackup,
    toggleIntegration,
  }
})
