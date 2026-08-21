<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const sandbox = ref({
  baseUrl: 'https://sandbox-api.suheng-os.com',
  token: 'sbx_live_8f2a9c31b4d7e1f0',
  testMode: true,
})

function copy(text: string, tip: string) {
  navigator.clipboard?.writeText(text)
  ElMessage.success(tip)
}

async function resetSandbox() {
  await ElMessageBox.confirm(t('dev.sandbox.resetConfirm'), t('dev.common.confirm'), { type: 'warning' })
  sandbox.value.token = `sbx_${Math.random().toString(36).slice(2, 14)}`
  ElMessage.success(t('dev.sandbox.resetSandbox') + ' ✓')
}

function quickTest() {
  ElMessage.success('GET /v1/products → 200 OK (42ms)')
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('dev.menu.sandbox') }}</h2>
    <p class="portal-stat-desc">沙箱环境与正式环境数据完全隔离，可放心调试接口。</p>

    <el-row :gutter="16">
      <el-col :span="12" :xs="24">
        <el-card shadow="never" style="margin-bottom: 16px">
          <template #header><b>{{ t('dev.sandbox.baseUrl') }}</b></template>
          <div class="kv-row">
            <code class="kv-value">{{ sandbox.baseUrl }}</code>
            <el-button size="small" @click="copy(sandbox.baseUrl, t('dev.common.copied'))">
              <el-icon><CopyDocument /></el-icon> {{ t('dev.common.copy') }}
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" :xs="24">
        <el-card shadow="never" style="margin-bottom: 16px">
          <template #header><b>{{ t('dev.sandbox.envToken') }}</b></template>
          <div class="kv-row">
            <code class="kv-value">{{ sandbox.token }}</code>
            <el-button size="small" @click="copy(sandbox.token, t('dev.common.copied'))">
              <el-icon><CopyDocument /></el-icon> {{ t('dev.common.copy') }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header><b>{{ t('dev.sandbox.testMode') }}</b></template>
      <el-form label-width="140px" style="max-width: 560px">
        <el-form-item :label="t('dev.sandbox.testMode')">
          <el-switch v-model="sandbox.testMode" />
          <span class="tip">{{ sandbox.testMode ? '沙箱模式（返回 Mock 数据）' : '已切换为联调模式' }}</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="quickTest">
            <el-icon><Connection /></el-icon> 快速请求测试
          </el-button>
          <el-button type="danger" plain @click="resetSandbox">
            <el-icon><RefreshLeft /></el-icon> {{ t('dev.sandbox.resetSandbox') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.kv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.kv-value {
  font-family: Consolas, monospace;
  font-size: 13px;
  color: var(--color-primary-dark);
  background: var(--color-bg-soft);
  padding: 4px 8px;
  border-radius: 6px;
  word-break: break-all;
}
.tip {
  margin-left: 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
