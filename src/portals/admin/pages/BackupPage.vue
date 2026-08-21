<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'

const { t } = useI18n()
const admin = useAdminStore()

function createBackup() {
  const backup = admin.createBackup()
  ElMessage.success(`${t('admin.backup.createBackup')} ✓ (${backup.size})`)
}

async function restore(name: string) {
  await ElMessageBox.confirm(t('admin.backup.restoreConfirm'), t('admin.common.confirm'), { type: 'warning' })
  ElMessage.success(`${t('admin.backup.restore')}: ${name} ✓`)
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('admin.menu.backup') }}</h2>
    <p class="portal-stat-desc">平台数据全量备份管理，支持一键创建与恢复（演示数据）。</p>

    <el-alert
      v-if="admin.backups[0]"
      :title="`${t('admin.backup.lastBackup')}: ${admin.backups[0].name} · ${admin.backups[0].createdAt}`"
      type="success"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <el-table :data="admin.backups">
      <el-table-column :label="t('admin.backup.backupName')" min-width="220">
        <template #default="{ row }">
          <el-icon style="color: var(--color-primary); vertical-align: -2px"><FolderOpened /></el-icon>
          <span style="margin-left: 6px">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="size" :label="t('admin.backup.size')" width="120" />
      <el-table-column prop="createdAt" :label="t('admin.common.time')" width="180" />
      <el-table-column :label="t('admin.common.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="restore(row.name)">{{ t('admin.backup.restore') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 16px">
      <el-button type="primary" @click="createBackup">
        <el-icon><Plus /></el-icon> {{ t('admin.backup.createBackup') }}
      </el-button>
    </div>
  </div>
</template>
