<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi, type AuditLogEntry } from '@/api'

/**
 * 审计日志（管理端）
 * 记录管理端敏感操作：登录、改角色、审核内容、改配置等
 */

const loading = ref(false)
const logs = ref<AuditLogEntry[]>([])
const total = ref(0)

// 筛选
const filterAction = ref('')
const filterResource = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(20)

const actionOptions = [
  { value: '', label: '全部操作' },
  { value: 'login', label: '登录' },
  { value: 'update', label: '修改' },
  { value: 'create', label: '创建' },
  { value: 'delete', label: '删除' },
  { value: 'approve', label: '审核通过' },
  { value: 'export', label: '导出' },
]

const resourceOptions = [
  { value: '', label: '全部资源' },
  { value: 'auth', label: '认证' },
  { value: 'users', label: '用户' },
  { value: 'products', label: '商品' },
  { value: 'orders', label: '订单' },
  { value: 'content', label: '内容' },
  { value: 'competitor', label: '竞品' },
  { value: 'supply', label: '供应链' },
  { value: 'listing', label: '上架' },
  { value: 'rbac', label: '权限' },
  { value: 'settings', label: '设置' },
  { value: 'flags', label: '开关' },
  { value: 'audit_log', label: '审计' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
]

const statusTags: Record<string, string> = {
  success: 'success',
  failed: 'danger',
}

const actionColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
  login: 'info',
  update: 'warning',
  create: 'success',
  delete: 'danger',
  approve: 'success',
  export: 'info',
}

async function loadLogs() {
  loading.value = true
  try {
    const res = await adminApi.getAuditLogs({
      action: filterAction.value || undefined,
      resource: filterResource.value || undefined,
      status: filterStatus.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    logs.value = res.data
    total.value = res.total
  } catch (err) {
    ElMessage.error('加载审计日志失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})

function applyFilter() {
  page.value = 1
  loadLogs()
}

function handlePageChange(p: number) {
  page.value = p
  loadLogs()
}

function exportLogs() {
  const text = JSON.stringify(logs.value, null, 2)
  navigator.clipboard
    ?.writeText(text)
    .then(() => ElMessage.success(`已导出 ${logs.value.length} 条日志到剪贴板`))
    .catch(() => ElMessage.warning('复制失败'))
}

function formatTime(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', { hour12: false })
}
</script>

<template>
  <div class="audit-page" v-loading="loading">
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="操作审计日志"
      description="记录管理端敏感操作（登录/改角色/审核内容/改配置等），可按操作类型、资源、状态筛选。"
      class="page-alert"
    />

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filterAction" placeholder="操作类型" size="small" style="width: 130px" @change="applyFilter">
        <el-option v-for="o in actionOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-select v-model="filterResource" placeholder="资源" size="small" style="width: 130px" @change="applyFilter">
        <el-option v-for="o in resourceOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" size="small" style="width: 110px" @change="applyFilter">
        <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-button size="small" @click="exportLogs">导出当前页</el-button>
      <el-button size="small" @click="loadLogs">刷新</el-button>
    </div>

    <!-- 日志表 -->
    <div class="table-wrapper">
      <table class="audit-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作人</th>
            <th>角色</th>
            <th>操作</th>
            <th>资源</th>
            <th>详情</th>
            <th>IP</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td class="col-time">{{ formatTime(log.timestamp) }}</td>
            <td class="col-actor">{{ log.actor }}</td>
            <td>
              <el-tag size="small" :type="log.actorRole === 'admin' ? 'danger' : log.actorRole === 'ops' ? 'warning' : log.actorRole === 'dev' ? 'success' : 'info'">
                {{ log.actorRole }}
              </el-tag>
            </td>
            <td>
              <el-tag size="small" :type="actionColors[log.action]">{{ log.action }}</el-tag>
            </td>
            <td><code class="resource-code">{{ log.resource }}</code></td>
            <td class="col-detail">{{ log.detail }}</td>
            <td class="col-ip">{{ log.ip }}</td>
            <td>
              <el-tag size="small" :type="statusTags[log.status] as 'success' | 'danger'">
                {{ log.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </td>
          </tr>
          <tr v-if="!logs.length && !loading">
            <td colspan="8" class="empty-row">暂无审计日志</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.audit-page {
  max-width: 1100px;
}

.page-alert {
  margin-bottom: 14px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.table-wrapper {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow-x: auto;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.audit-table th {
  text-align: left;
  padding: 12px 14px;
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  background: var(--color-bg-soft);
}

.audit-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

.col-time {
  font-family: Consolas, Menlo, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.col-actor {
  font-size: 12px;
  color: var(--color-text-regular);
}

.resource-code {
  font-size: 11px;
  color: #185fa5;
  background: var(--color-bg-soft);
  border-radius: 4px;
  padding: 1px 6px;
}

.col-detail {
  font-size: 12px;
  color: var(--color-text-primary);
  max-width: 320px;
}

.col-ip {
  font-family: Consolas, Menlo, monospace;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.empty-row {
  text-align: center;
  padding: 32px;
  color: var(--color-text-placeholder);
}

.pagination {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}
</style>
