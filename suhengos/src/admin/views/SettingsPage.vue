<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const form = reactive({
  siteName: '素衡OS · Suheng OS',
  defaultLocale: 'zh',
  supportLocales: ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'ar', 'id', 'ms', 'vi', 'th', 'fil'],
  maintenance: false,
  registerOpen: true,
  orderAutoConfirmDays: 7,
  freeShippingThreshold: 199,
  contactEmail: 'support@suheng-os.com',
})

const saving = ref(false)

const localeOptions = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية（RTL）' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'th', label: 'ไทย' },
  { value: 'fil', label: 'Filipino' },
]

async function handleSave() {
  saving.value = true
  await new Promise((r) => setTimeout(r, 600))
  saving.value = false
  ElMessage.success('设置已保存（Mock）')
}
</script>

<template>
  <div class="settings-page">
    <el-card shadow="never" class="settings-card">
      <template #header><span class="card-title">基本设置</span></template>
      <el-form :model="form" label-width="130px" style="max-width: 560px">
        <el-form-item label="站点名称">
          <el-input v-model="form.siteName" />
        </el-form-item>
        <el-form-item label="默认语言">
          <el-select v-model="form.defaultLocale" style="width: 220px">
            <el-option v-for="l in localeOptions" :key="l.value" :value="l.value" :label="l.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用语言">
          <el-select v-model="form.supportLocales" multiple collapse-tags style="width: 100%">
            <el-option v-for="l in localeOptions" :key="l.value" :value="l.value" :label="l.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="客服邮箱">
          <el-input v-model="form.contactEmail" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="settings-card">
      <template #header><span class="card-title">电商设置</span></template>
      <el-form :model="form" label-width="130px" style="max-width: 560px">
        <el-form-item label="自动确认收货">
          <el-input-number v-model="form.orderAutoConfirmDays" :min="1" :max="30" /> 天
        </el-form-item>
        <el-form-item label="包邮门槛">
          <el-input-number v-model="form.freeShippingThreshold" :min="0" :step="50" /> 元
        </el-form-item>
        <el-form-item label="开放注册">
          <el-switch v-model="form.registerOpen" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="settings-card">
      <template #header><span class="card-title">维护模式</span></template>
      <div class="maintenance-row">
        <div class="maintenance-text">
          <p>开启后客户端将进入维护页面，仅管理员可访问后台功能。</p>
        </div>
        <el-switch v-model="form.maintenance" />
      </div>
    </el-card>

    <div class="save-bar">
      <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 760px;
}

.card-title {
  font-weight: 600;
}

.maintenance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.maintenance-text p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-regular);
}

.save-bar {
  display: flex;
  justify-content: flex-end;
}
</style>
