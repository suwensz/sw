<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi, type RbacPermission } from '@/api'

/**
 * RBAC 权限矩阵（管理端）
 * 角色 × 资源 × 操作的可视化矩阵
 */

const loading = ref(false)
const permissions = ref<RbacPermission[]>([])

const roles = ['user', 'admin', 'ops', 'dev']
const roleLabels: Record<string, string> = {
  user: '普通用户',
  admin: '管理员',
  ops: '运营员',
  dev: '开发',
}
const roleColors: Record<string, 'info' | 'danger' | 'warning' | 'success' | 'primary'> = {
  user: 'info',
  admin: 'danger',
  ops: 'warning',
  dev: 'success',
}

onMounted(async () => {
  loading.value = true
  try {
    permissions.value = await adminApi.getRbacMatrix()
  } catch (err) {
    ElMessage.error('加载权限矩阵失败')
    console.error(err)
  } finally {
    loading.value = false
  }
})

// 统计：每个角色有多少权限
const roleStats = computed(() => {
  const stats: Record<string, number> = {}
  for (const role of roles) {
    stats[role] = permissions.value.reduce((sum, p) => {
      const arr = p.roles[role] || []
      return sum + arr.filter(Boolean).length
    }, 0)
  }
  return stats
})

const totalActions = computed(() =>
  permissions.value.reduce((sum, p) => sum + p.actions.length, 0),
)

function checkPermission(p: RbacPermission, role: string, actionIdx: number): boolean {
  const arr = p.roles[role]
  return arr ? arr[actionIdx] : false
}

function exportMatrix() {
  const data = permissions.value.map((p) => ({
    resource: p.resource,
    label: p.resourceLabel,
    actions: p.actions,
    roles: roles.map((r) => ({ role: r, permissions: p.roles[r] || [] })),
  }))
  const text = JSON.stringify(data, null, 2)
  navigator.clipboard
    ?.writeText(text)
    .then(() => ElMessage.success('权限矩阵 JSON 已复制'))
    .catch(() => ElMessage.warning('复制失败'))
}
</script>

<template>
  <div class="rbac-page" v-loading="loading">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="RBAC 权限矩阵"
      description="角色 × 资源 × 操作的权限映射。接入后端后由 RBAC 服务统一管理，前端仅做展示与校验。"
      class="page-alert"
    />

    <!-- 角色权限统计 -->
    <div class="role-stats">
      <div v-for="role in roles" :key="role" class="stat-card">
        <div class="stat-label">
          <el-tag :type="roleColors[role]" size="small">{{ role }}</el-tag>
          {{ roleLabels[role] }}
        </div>
        <div class="stat-value">{{ roleStats[role] }}<span class="stat-total">/{{ totalActions }}</span></div>
        <el-progress
          :percentage="totalActions ? Math.round((roleStats[role] / totalActions) * 100) : 0"
          :color="role === 'admin' ? '#e24b4a' : role === 'ops' ? '#ef9f27' : role === 'dev' ? '#1a6b5c' : '#909399'"
          :show-text="false"
          :stroke-width="6"
        />
      </div>
    </div>

    <!-- 权限矩阵表 -->
    <div class="matrix-panel">
      <div class="matrix-head">
        <h3 class="matrix-title">权限矩阵详情</h3>
        <el-button size="small" @click="exportMatrix">导出 JSON</el-button>
      </div>

      <div class="table-wrapper">
        <table class="rbac-table">
          <thead>
            <tr>
              <th class="col-resource">资源</th>
              <th class="col-action">操作</th>
              <th v-for="role in roles" :key="role" class="col-role">
                <el-tag :type="roleColors[role]" size="small">{{ role }}</el-tag>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="p in permissions" :key="p.resource">
              <tr v-for="(action, ai) in p.actions" :key="p.resource + '-' + action">
                <td v-if="ai === 0" :rowspan="p.actions.length" class="col-resource-cell">
                  <div class="resource-name">{{ p.resourceLabel }}</div>
                  <code class="resource-key">{{ p.resource }}</code>
                </td>
                <td class="col-action-cell">
                  <code>{{ action }}</code>
                </td>
                <td v-for="role in roles" :key="role" class="col-perm">
                  <span
                    class="perm-dot"
                    :class="checkPermission(p, role, ai) ? 'perm-yes' : 'perm-no'"
                  >
                    {{ checkPermission(p, role, ai) ? '✓' : '—' }}
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rbac-page {
  max-width: 960px;
}

.page-alert {
  margin-bottom: 16px;
}

.role-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px 16px;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.stat-total {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.matrix-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px;
}

.matrix-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.matrix-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.table-wrapper {
  overflow-x: auto;
}

.rbac-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rbac-table th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.rbac-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
}

.col-resource-cell {
  vertical-align: top;
}

.resource-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 13px;
}

.resource-key {
  font-size: 11px;
  color: #185fa5;
  background: var(--color-bg-soft);
  border-radius: 4px;
  padding: 1px 6px;
  display: inline-block;
  margin-top: 4px;
}

.col-action-cell code {
  font-size: 12px;
  color: var(--color-text-regular);
}

.col-perm {
  text-align: center;
}

.perm-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
}

.perm-yes {
  background: rgba(26, 107, 92, 0.12);
  color: #1a6b5c;
}

.perm-no {
  color: var(--color-text-placeholder);
}

@media (max-width: 768px) {
  .role-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
