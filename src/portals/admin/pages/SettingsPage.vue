<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'

const { t } = useI18n()
const admin = useAdminStore()

function save() {
  admin.saveSettings()
  ElMessage.success(t('admin.settings.saveOk'))
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('admin.menu.settings') }}</h2>
    <p class="portal-stat-desc">配置平台基础信息与运行开关。</p>

    <el-form :model="admin.settings" label-width="160px" style="max-width: 640px">
      <el-divider content-position="left">{{ t('admin.settings.secBase') }}</el-divider>
      <el-form-item :label="t('admin.settings.platformName')">
        <el-input v-model="admin.settings.platformName" />
      </el-form-item>
      <el-form-item :label="t('admin.settings.siteDomain')">
        <el-input v-model="admin.settings.siteDomain" />
      </el-form-item>

      <el-divider content-position="left">{{ t('admin.settings.secSecurity') }}</el-divider>
      <el-form-item :label="t('admin.settings.maintenance')">
        <el-switch v-model="admin.settings.maintenanceMode" />
        <span class="tip">开启后主站显示维护提示</span>
      </el-form-item>
      <el-form-item :label="t('admin.settings.allowRegister')">
        <el-switch v-model="admin.settings.allowRegister" />
      </el-form-item>
      <el-form-item :label="t('admin.settings.requireEmailVerify')">
        <el-switch v-model="admin.settings.requireEmailVerify" />
      </el-form-item>
      <el-form-item :label="t('admin.settings.healthAlertEnabled')">
        <el-switch v-model="admin.settings.healthAlertEnabled" />
      </el-form-item>

      <el-divider content-position="left">{{ t('admin.settings.secNotify') }}</el-divider>
      <el-form-item :label="t('admin.settings.orderAutoCancelHours')">
        <el-input-number v-model="admin.settings.orderAutoCancelHours" :min="1" :max="168" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="save">
          <el-icon><Check /></el-icon> {{ t('admin.common.save') }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.tip {
  margin-left: 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
