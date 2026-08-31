<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useDevStore } from '@/stores/dev'
import type { DevApp } from '@/mock/devData'

const { t } = useI18n()
const dev = useDevStore()

const dialogVisible = ref(false)
const editing = ref<DevApp | null>(null)
const form = ref({ name: '', domain: '', desc: '' })

function openCreate() {
  editing.value = null
  form.value = { name: '', domain: '', desc: '' }
  dialogVisible.value = true
}

function openEdit(app: DevApp) {
  editing.value = app
  form.value = { name: app.name, domain: app.domain, desc: app.desc }
  dialogVisible.value = true
}

function submit() {
  if (!form.value.name || !form.value.domain) {
    ElMessage.warning('请填写应用名称与业务域')
    return
  }
  if (editing.value) {
    dev.updateApp(editing.value.id, { ...form.value })
    ElMessage.success('已保存修改')
  } else {
    dev.addApp({ ...form.value, status: 'active' })
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
}

async function remove(app: DevApp) {
  await ElMessageBox.confirm(`确定删除应用「${app.name}」吗？此操作不可恢复。`, '删除确认', { type: 'warning' })
  dev.removeApp(app.id)
  ElMessage.success('已删除')
}

function toggleStatus(app: DevApp) {
  dev.updateApp(app.id, { status: app.status === 'active' ? 'disabled' : 'active' })
  ElMessage.success(app.status === 'active' ? '已启用' : '已停用')
}
</script>

<template>
  <div class="portal-page">
    <div class="portal-page-head">
      <h2 style="margin: 0">{{ t('dev.menu.apps') }}</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> {{ t('dev.apps.addApp') }}
      </el-button>
    </div>

    <el-table :data="dev.apps">
      <el-table-column prop="name" :label="t('dev.apps.appName')" min-width="160" />
      <el-table-column prop="domain" :label="t('dev.apps.domain')" min-width="140" />
      <el-table-column prop="desc" :label="t('dev.apps.appDesc')" min-width="160" />
      <el-table-column prop="createdAt" :label="t('dev.apps.created')" width="120" />
      <el-table-column :label="t('dev.common.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? t('dev.common.enabled') : t('dev.common.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.common.actions')" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row as DevApp)">{{ t('dev.common.edit') }}</el-button>
          <el-button size="small" @click="toggleStatus(row as DevApp)">
            {{ row.status === 'active' ? t('dev.common.disabled') : t('dev.common.enabled') }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row as DevApp)">{{ t('dev.common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? t('dev.common.edit') : t('dev.apps.addApp')" width="480px">
      <el-form label-width="80px">
        <el-form-item :label="t('dev.apps.appName')" required>
          <el-input v-model="form.name" placeholder="例如：素衡健康小程序" />
        </el-form-item>
        <el-form-item :label="t('dev.apps.domain')" required>
          <el-input v-model="form.domain" placeholder="例如：health.ecom" />
        </el-form-item>
        <el-form-item :label="t('dev.apps.appDesc')">
          <el-input v-model="form.desc" type="textarea" :rows="3" placeholder="应用用途说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('dev.common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('dev.common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
