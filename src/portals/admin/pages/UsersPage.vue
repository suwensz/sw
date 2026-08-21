<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'
import type { AdminUser } from '@/stores/admin'

const { t } = useI18n()
const admin = useAdminStore()

const keyword = ref('')
const roleFilter = ref('all')

const ROLE_LABELS: Record<AdminUser['role'], string> = {
  superadmin: '超级管理员',
  admin: '管理员',
  ops: '运营',
  dev: '开发者',
  user: '用户',
}

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return admin.users.filter((u) => {
    const matchRole = roleFilter.value === 'all' || u.role === roleFilter.value
    const matchKw = !kw || u.name.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw)
    return matchRole && matchKw
  })
})

const dialogVisible = ref(false)
const form = ref({ name: '', email: '', role: 'user' as AdminUser['role'] })

function openCreate() {
  form.value = { name: '', email: '', role: 'user' }
  dialogVisible.value = true
}

function submit() {
  if (!form.value.name || !form.value.email) {
    ElMessage.warning('请填写姓名与邮箱')
    return
  }
  admin.addUser({ ...form.value, status: 'active' })
  dialogVisible.value = false
  ElMessage.success('用户已创建')
}

async function toggleStatus(user: AdminUser) {
  admin.updateUser(user.id, { status: user.status === 'active' ? 'disabled' : 'active' })
  ElMessage.success(user.status === 'active' ? '已停用' : '已启用')
}

async function remove(user: AdminUser) {
  await ElMessageBox.confirm(`${t('admin.users.deleteConfirm')}（${user.name}）`, t('admin.common.confirm'), { type: 'warning' })
  admin.removeUser(user.id)
  ElMessage.success('已删除')
}

function changeRole(user: AdminUser, role: AdminUser['role']) {
  admin.updateUser(user.id, { role })
  ElMessage.success('角色已更新')
}
</script>

<template>
  <div class="portal-page">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0">{{ t('admin.menu.users') }}</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> {{ t('admin.users.addUser') }}
      </el-button>
    </div>

    <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap">
      <el-input v-model="keyword" :placeholder="t('admin.users.searchPh')" clearable style="max-width: 280px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="roleFilter" style="width: 160px">
        <el-option :label="t('admin.common.all')" value="all" />
        <el-option v-for="(label, value) in ROLE_LABELS" :key="value" :label="label" :value="value" />
      </el-select>
    </div>

    <el-table :data="filtered">
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column prop="email" :label="t('admin.users.email')" min-width="180" />
      <el-table-column :label="t('admin.common.role')" width="160">
        <template #default="{ row }">
          <el-select
            :model-value="row.role"
            size="small"
            style="width: 120px"
            @change="(v) => changeRole(row as AdminUser, v as AdminUser['role'])"
          >
            <el-option v-for="(label, value) in ROLE_LABELS" :key="value" :label="label" :value="value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="registeredAt" :label="t('admin.users.registered')" width="110" />
      <el-table-column :label="t('admin.common.status')" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? t('admin.common.enabled') : t('admin.common.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.common.actions')" width="170" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="toggleStatus(row as AdminUser)">
            {{ row.status === 'active' ? t('admin.common.disabled') : t('admin.common.enabled') }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row as AdminUser)">{{ t('admin.common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="t('admin.users.addUser')" width="440px">
      <el-form label-width="60px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" placeholder="用户姓名" />
        </el-form-item>
        <el-form-item :label="t('admin.users.email')" required>
          <el-input v-model="form.email" placeholder="user@example.com" />
        </el-form-item>
        <el-form-item :label="t('admin.common.role')">
          <el-select v-model="form.role" style="width: 100%">
            <el-option v-for="(label, value) in ROLE_LABELS" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('admin.common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
