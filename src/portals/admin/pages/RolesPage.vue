<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'
import type { AdminRole } from '@/stores/admin'
import { ADMIN_PERMISSIONS } from '@/mock/adminData'

const { t } = useI18n()
const admin = useAdminStore()

const PERM_LABELS: Record<string, string> = {
  '*': '全部权限',
  'user.manage': '用户管理',
  'stats.view': '数据查看',
  'settings.edit': '系统配置',
  'role.manage': '角色管理',
  'ops.competitor': '竞品分析',
  'ops.supply': '供应链',
  'ops.listing': '自动上架',
  'ops.procurement': '采购管理',
  'dev.apps': '应用管理',
  'dev.keys': '密钥管理',
  'dev.docs': 'API 文档',
  'shop.view': '浏览商城',
  'shop.order': '下单购物',
  'health.view': '健康服务',
}

function permLabel(key: string) {
  return PERM_LABELS[key] || key
}

// ---- 新增角色 ----
const dialogVisible = ref(false)
const editing = ref<string | null>(null)
const form = ref({ name: '', desc: '', permissions: [] as string[] })

function openCreate() {
  editing.value = null
  form.value = { name: '', desc: '', permissions: [] }
  dialogVisible.value = true
}

function openEdit(role: AdminRole) {
  editing.value = role.id
  form.value = { name: role.name, desc: role.desc, permissions: role.permissions[0] === '*' ? ['*'] : [...role.permissions] }
  dialogVisible.value = true
}

function submit() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请填写角色名称')
    return
  }
  if (editing.value) {
    admin.updateRole(editing.value, {
      name: form.value.name.trim(),
      desc: form.value.desc.trim(),
      permissions: form.value.permissions,
    })
    ElMessage.success(t('admin.common.save') + ' ✓')
  } else {
    admin.addRole({
      name: form.value.name.trim(),
      desc: form.value.desc.trim(),
      permissions: form.value.permissions,
    })
    ElMessage.success(t('admin.common.add') + ' ✓')
  }
  dialogVisible.value = false
}

async function remove(role: AdminRole) {
  await ElMessageBox.confirm(`确定删除角色「${role.name}」吗？`, t('admin.common.confirm'), { type: 'warning' })
  admin.removeRole(role.id)
  ElMessage.success(t('admin.common.delete') + ' ✓')
}

function togglePerm(perm: string) {
  if (perm === '*') {
    form.value.permissions = form.value.permissions.includes('*') ? [] : ['*']
    return
  }
  const hasStar = form.value.permissions.includes('*')
  const next = hasStar ? form.value.permissions.filter((p) => p !== '*') : form.value.permissions
  form.value.permissions = next.includes(perm) ? next.filter((p) => p !== perm) : [...next, perm]
}
</script>

<template>
  <div class="portal-page">
    <div class="portal-page-head">
      <h2 style="margin: 0">{{ t('admin.menu.roles') }}</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> {{ t('admin.roles.addRole') }}
      </el-button>
    </div>
    <p class="portal-stat-desc">平台内置角色与权限点说明，用于控制不同端口的访问范围。</p>

    <el-table :data="admin.roles">
      <el-table-column :label="t('admin.roles.roleName')" width="140">
        <template #default="{ row }">{{ row.name }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.roles.roleDesc')" min-width="200">
        <template #default="{ row }">{{ row.desc }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.roles.permissions')" min-width="260">
        <template #default="{ row }">
          <template v-if="row.permissions[0] === '*'">
            <el-tag type="danger" size="small">{{ permLabel('*') }}</el-tag>
          </template>
          <el-tag v-else v-for="p in row.permissions" :key="p" size="small" style="margin: 2px 4px 2px 0">
            {{ permLabel(p) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('admin.roles.memberCount')" width="90">
        <template #default="{ row }">{{ row.memberCount }}</template>
      </el-table-column>
      <el-table-column :label="t('admin.common.actions')" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row as AdminRole)">{{ t('admin.common.edit') }}</el-button>
          <el-button size="small" type="danger" :disabled="row.permissions[0] === '*'" @click="remove(row as AdminRole)">
            {{ t('admin.common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-alert
      style="margin-top: 16px"
      :title="t('admin.roles.permissionHint') + '；开发端 / 运营端 / 管理端各自独立构建与部署。'"
      type="info"
      :closable="false"
      show-icon
    />

    <el-dialog v-model="dialogVisible" :title="editing ? t('admin.common.edit') : t('admin.roles.addRole')" width="560px">
      <el-form label-width="80px">
        <el-form-item :label="t('admin.roles.roleName')" required>
          <el-input v-model="form.name" placeholder="角色名称" />
        </el-form-item>
        <el-form-item :label="t('admin.roles.roleDesc')">
          <el-input v-model="form.desc" placeholder="角色描述" />
        </el-form-item>
        <el-form-item :label="t('admin.roles.permissions')">
          <div style="width: 100%">
            <el-checkbox :model-value="form.permissions.includes('*')" @change="() => togglePerm('*')">
              <el-tag type="danger" size="small">{{ permLabel('*') }}</el-tag>
            </el-checkbox>
            <el-divider style="margin: 10px 0" />
            <el-checkbox-group v-if="!form.permissions.includes('*')" v-model="form.permissions">
              <div v-for="group in ['user', 'data', 'system', 'ops', 'dev', 'shop', 'health']" :key="group" style="margin-bottom: 8px">
                <el-checkbox v-for="p in ADMIN_PERMISSIONS.filter((x) => x.group === group)" :key="p.id" :label="p.id" :value="p.id">
                  {{ p.label }}
                </el-checkbox>
              </div>
            </el-checkbox-group>
            <el-text v-else size="small" type="info">已勾选全部权限，取消勾选可细分。</el-text>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('admin.common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('admin.common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
