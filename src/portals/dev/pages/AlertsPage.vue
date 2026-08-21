<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useDevStore } from '@/stores/dev'

const { t } = useI18n()
const dev = useDevStore()

const dialogVisible = ref(false)
const form = ref({ metric: '', threshold: '', channel: '邮件' })
const CHANNELS = ['邮件', '短信', '站内信', 'Webhook']

function openCreate() {
  form.value = { metric: '', threshold: '', channel: '邮件' }
  dialogVisible.value = true
}

function submit() {
  if (!form.value.metric.trim() || !form.value.threshold.trim()) {
    ElMessage.warning('请填写监控指标与阈值')
    return
  }
  dev.addAlert({ metric: form.value.metric.trim(), threshold: form.value.threshold.trim(), channel: form.value.channel, status: 'active' })
  dialogVisible.value = false
  ElMessage.success(t('dev.common.add') + ' ✓')
}

async function remove(id: string) {
  await ElMessageBox.confirm(t('dev.alerts.deleteConfirm'), t('dev.common.confirm'), { type: 'warning' })
  dev.removeAlert(id)
  ElMessage.success(t('dev.common.delete') + ' ✓')
}
</script>

<template>
  <div class="portal-page">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0">{{ t('dev.menu.alerts') }}</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> {{ t('dev.alerts.addAlert') }}
      </el-button>
    </div>

    <el-alert
      title="告警规则触发后，将按所选渠道通知你；可在总览页实时观测各项指标。"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <el-table :data="dev.alerts">
      <el-table-column :label="t('dev.alerts.metric')" min-width="180">
        <template #default="{ row }">
          <el-icon style="color: var(--color-primary); vertical-align: -2px"><Monitor /></el-icon>
          <span style="margin-left: 6px">{{ row.metric }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.alerts.threshold')" width="140">
        <template #default="{ row }"><el-tag effect="plain">{{ row.threshold }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="t('dev.alerts.channel')" width="120">
        <template #default="{ row }">{{ row.channel }}</template>
      </el-table-column>
      <el-table-column :label="t('dev.alerts.lastTrigger')" width="160">
        <template #default="{ row }">{{ row.lastTrigger }}</template>
      </el-table-column>
      <el-table-column :label="t('dev.common.status')" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? t('dev.common.enabled') : t('dev.common.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.common.actions')" width="170" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="dev.toggleAlert(row.id)">
            {{ row.status === 'active' ? t('dev.common.disabled') : t('dev.common.enabled') }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">{{ t('dev.common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="t('dev.alerts.addAlert')" width="460px">
      <el-form label-width="80px">
        <el-form-item :label="t('dev.alerts.metric')" required>
          <el-input v-model="form.metric" placeholder="例如：API 错误率" />
        </el-form-item>
        <el-form-item :label="t('dev.alerts.threshold')" required>
          <el-input v-model="form.threshold" placeholder="例如：> 5%" />
        </el-form-item>
        <el-form-item :label="t('dev.alerts.channel')">
          <el-select v-model="form.channel" style="width: 100%">
            <el-option v-for="c in CHANNELS" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('dev.common.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('dev.common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>
