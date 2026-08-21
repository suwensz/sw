<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useDevStore } from '@/stores/dev'
import type { DevKey } from '@/mock/devData'

const { t } = useI18n()
const dev = useDevStore()

const createVisible = ref(false)
const selectedApp = ref('')

function appName(appId: string): string {
  return dev.apps.find((a) => a.id === appId)?.name || appId
}

function generate() {
  if (!selectedApp.value) {
    ElMessage.warning('请选择所属应用')
    return
  }
  const key = dev.generateKey(selectedApp.value)
  createVisible.value = false
  ElMessage.success('密钥已生成，请立即复制保存')
  ElMessageBox.alert(
    `AppKey: ${key.appKey}\nAppSecret: ${key.appSecret}\n\n密钥仅显示一次，关闭后将无法再次查看。`,
    '密钥信息',
    { confirmButtonText: '我已保存', type: 'warning' },
  )
}

function copy(text: string, tip: string) {
  navigator.clipboard?.writeText(text)
  ElMessage.success(`${tip}已复制`)
}

async function revoke(key: DevKey) {
  await ElMessageBox.confirm(`确定撤销密钥（${appName(key.appId)}）吗？使用该密钥的接口将立即失效。`, '撤销确认', { type: 'warning' })
  dev.revokeKey(key.id)
  ElMessage.success('已撤销')
}
</script>

<template>
  <div class="portal-page">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
      <h2 style="margin: 0">{{ t('dev.menu.keys') }}</h2>
      <el-button type="primary" @click="createVisible = true">
        <el-icon><Plus /></el-icon> {{ t('dev.keys.generateKey') }}
      </el-button>
    </div>

    <el-alert
      :title="t('dev.keys.revokeConfirm') + ' — 密钥用于接口签名鉴权，切勿在代码仓库、前端页面或公开渠道泄露。'"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <el-table :data="dev.keys">
      <el-table-column :label="t('dev.keys.appId')" width="150">
        <template #default="{ row }">{{ appName(row.appId) }}</template>
      </el-table-column>
      <el-table-column :label="t('dev.keys.appKey')" min-width="220">
        <template #default="{ row }">
          <code class="key-code">{{ row.appKey }}</code>
          <el-button size="small" text type="primary" @click="copy(row.appKey, 'AppKey')">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.keys.appSecret')" min-width="180">
        <template #default="{ row }">
          <code class="key-code">{{ row.appSecret }}</code>
          <el-button size="small" text type="primary" @click="copy(row.appSecret, 'AppSecret')">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.keys.scope')" width="140">
        <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.scope }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="createdAt" :label="t('dev.apps.created')" width="120" />
      <el-table-column :label="t('dev.common.status')" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
            {{ row.status === 'active' ? t('dev.common.enabled') : t('dev.keys.expired') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.common.actions')" width="110" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" :disabled="row.status !== 'active'" @click="revoke(row as DevKey)">
            {{ t('dev.keys.expired') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" :title="t('dev.keys.generateKey')" width="420px">
      <el-form label-width="80px">
        <el-form-item :label="t('dev.keys.appId')" required>
          <el-select v-model="selectedApp" placeholder="选择所属应用" style="width: 100%">
            <el-option v-for="a in dev.apps" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">{{ t('dev.common.cancel') }}</el-button>
        <el-button type="primary" @click="generate">{{ t('dev.keys.generateKey') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.key-code {
  font-family: Consolas, monospace;
  font-size: 13px;
  color: var(--color-primary-dark);
  background: var(--color-bg-soft);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
