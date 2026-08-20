<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAdminStore } from '@/stores/admin'

const admin = useAdminStore()
const keyword = ref('')
const roleFilter = ref<'all' | 'user' | 'admin'>('all')

const filtered = computed(() =>
  admin.users.filter((u) => {
    if (roleFilter.value !== 'all' && u.role !== roleFilter.value) return false
    if (!keyword.value) return true
    const k = keyword.value.toLowerCase()
    return u.nickname.toLowerCase().includes(k) || u.email.toLowerCase().includes(k) || u.id.includes(k)
  }),
)

function toggleStatus(id: string) {
  admin.toggleUserStatus(id)
  const u = admin.users.find((x) => x.id === id)
  ElMessage.success(u?.status === 'active' ? '已启用该账号' : '已禁用该账号')
}

function setRole(id: string, role: 'user' | 'admin') {
  admin.updateUserRole(id, role)
  ElMessage.success(role === 'admin' ? '已提升为管理员' : '已降级为普通用户')
}
</script>

<template>
  <div class="users-page">
    <el-card shadow="never">
      <template #header>
        <div class="toolbar">
          <div class="toolbar-left">
            <el-input
              v-model="keyword"
              placeholder="搜索昵称 / 邮箱 / ID"
              clearable
              :prefix-icon="'Search'"
              style="width: 240px"
            />
            <el-radio-group v-model="roleFilter">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="user">普通用户</el-radio-button>
              <el-radio-button value="admin">管理员</el-radio-button>
            </el-radio-group>
          </div>
          <el-button type="primary" plain>邀请用户</el-button>
        </div>
      </template>

      <el-table :data="filtered" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}`" />
              <div class="user-meta">
                <span class="user-name">{{ row.nickname }}</span>
                <span class="user-email">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'warning' : 'info'" size="small" effect="light">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="语言" width="70">
          <template #default="{ row }">
            <span class="locale-tag">{{ row.locale }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orders" label="订单数" width="80" sortable />
        <el-table-column label="累计消费" width="110" sortable prop="spent">
          <template #default="{ row }">¥{{ row.spent }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="120">
          <template #default="{ row }">{{ row.createdAt.slice(0, 10) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="setRole(row.id, row.role === 'admin' ? 'user' : 'admin')">
              {{ row.role === 'admin' ? '降级' : '设为管理员' }}
            </el-button>
            <el-button link :type="row.status === 'active' ? 'danger' : 'success'" size="small" @click="toggleStatus(row.id)">
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.user-email {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.locale-tag {
  font-size: 12px;
  color: var(--color-text-regular);
  background: var(--color-bg-soft);
  border-radius: 4px;
  padding: 2px 6px;
}
</style>
