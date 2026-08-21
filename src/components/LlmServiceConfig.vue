<script setup lang="ts">
// 素衡OS · AI 服务配置（管理端 / 开发端共用）
// 权限：开发端最高控制权（可编辑 + 可锁定/解锁）；管理端未锁定时可编辑。
// 运营端不使用本组件（其对话框内配置面板为只读继承）。
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { LLM_PROVIDERS, testLLMConnection, type LlmProbeCode } from '@/services/llm'
import { useLlmConfigStore } from '@/stores/llmConfig'

const props = withDefaults(defineProps<{ /** 是否显示锁定开关（仅开发端传入 true） */ lockable?: boolean }>(), {
  lockable: false,
})

const { t } = useI18n()
const llmStore = useLlmConfigStore()

/* ---------------- 一键测试连接 ---------------- */
const testing = ref(false)
const testResult = ref<{ code: LlmProbeCode; detail?: string } | null>(null)

function probeLabel(code: LlmProbeCode): string {
  const key = `portal.agentsCenter.llmTest${code === 'OK' ? 'Ok' : code === 'NO_KEY' ? 'NoKey' : code === 'NO_ENDPOINT' ? 'NoEndpoint' : code === 'PROXY_DOWN' ? 'ProxyDown' : code === 'KEY_INVALID' ? 'KeyInvalid' : code === 'MODEL_ERROR' ? 'ModelError' : 'Fail'}`
  return t(key)
}

async function testConnection() {
  if (testing.value) return
  testing.value = true
  testResult.value = null
  try {
    const r = await testLLMConnection()
    testResult.value = { code: r.code, detail: r.detail }
  } catch {
    testResult.value = { code: 'PROXY_DOWN' }
  } finally {
    testing.value = false
  }
}

function onSave() {
  ElMessage.success(t('portal.agentsCenter.llmSaved'))
}

function onToggleLock(v: string | number | boolean) {
  llmStore.setLocked(!!v)
  ElMessage.success(!!v ? t('portal.agentsCenter.llmLocked') : t('portal.agentsCenter.llmUnlock'))
}

const portalLabel = computed(() => {
  const by = llmStore.data.updatedBy
  if (!by) return ''
  const key = by === 'dev' ? 'llmPortalDev' : by === 'admin' ? 'llmPortalAdmin' : 'llmPortalOps'
  return t(`portal.agentsCenter.${key}`)
})

const updatedText = computed(() => {
  if (!portalLabel.value) return ''
  const time = llmStore.data.updatedAt ? new Date(llmStore.data.updatedAt).toLocaleString() : ''
  return `${t('portal.agentsCenter.llmLastUpdate')}：${portalLabel.value}${time ? ' · ' + time : ''}`
})
</script>

<template>
  <div class="llm-admin">
    <div class="llm-admin-head">
      <div>
        <div class="llm-admin-title">
          {{ t('portal.agentsCenter.llmGlobalTitle') }}
          <el-tag v-if="props.lockable" size="small" type="warning" effect="plain" class="llm-admin-badge">
            {{ t('portal.agentsCenter.llmDevHighest') }}
          </el-tag>
          <el-tag v-if="llmStore.data.locked" size="small" type="danger" effect="plain">
            {{ t('portal.agentsCenter.llmLocked') }}
          </el-tag>
        </div>
        <div class="llm-admin-desc">{{ t('portal.agentsCenter.llmGlobalDesc') }}</div>
      </div>
      <!-- 锁定开关：仅开发端 -->
      <div v-if="props.lockable" class="llm-lock">
        <span class="llm-lock-label">{{ llmStore.data.locked ? t('portal.agentsCenter.llmUnlock') : t('portal.agentsCenter.llmLock') }}</span>
        <el-switch :model-value="!!llmStore.data.locked" @change="onToggleLock" />
      </div>
    </div>
    <div v-if="props.lockable" class="llm-lock-tip">{{ t('portal.agentsCenter.llmLockTip') }}</div>

    <el-form label-position="top" size="small" :disabled="!llmStore.canEdit">
      <div class="llm-form-grid">
        <el-form-item :label="t('portal.agentsCenter.llmProvider')">
          <el-select
            :model-value="llmStore.data.provider"
            style="width: 100%"
            @change="(v: string) => llmStore.setProvider(v as 'deepseek' | 'doubao' | 'coze')"
          >
            <el-option v-for="p in LLM_PROVIDERS" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="llmStore.data.provider !== 'coze' ? t('portal.agentsCenter.llmModel') : t('portal.agentsCenter.llmBotId')">
          <el-input
            v-if="llmStore.data.provider !== 'coze'"
            :model-value="llmStore.data.model"
            @update:model-value="(v: string) => llmStore.setModel(v)"
          />
          <el-input
            v-else
            :model-value="llmStore.data.botId || ''"
            placeholder="738xxxxxxxx"
            @update:model-value="(v: string) => llmStore.setBotId(v)"
          />
        </el-form-item>
      </div>
      <el-form-item :label="t('portal.agentsCenter.llmApiKey')">
        <div class="llm-key-row">
          <el-input
            :model-value="llmStore.data.apiKey"
            type="password"
            show-password
            :placeholder="t('portal.agentsCenter.llmApiKeyPlaceholder')"
            @update:model-value="(v: string) => llmStore.setApiKey(v)"
          />
          <el-link
            class="llm-key-apply"
            type="primary"
            :href="llmStore.providerMeta.docUrl"
            target="_blank"
          >
            {{ t('portal.agentsCenter.llmApplyKey') }}
          </el-link>
        </div>
      </el-form-item>
      <el-form-item :label="t('portal.agentsCenter.llmEndpoint')">
        <el-input
          :model-value="llmStore.data.endpoint"
          @update:model-value="(v: string) => llmStore.setEndpoint(v)"
        />
      </el-form-item>

      <div class="llm-admin-actions">
        <el-button v-if="llmStore.canEdit" type="primary" @click="onSave">
          {{ t('portal.agentsCenter.llmSave') }}
        </el-button>
        <el-button v-if="llmStore.canEdit" plain @click="llmStore.reset">
          {{ t('portal.agentsCenter.llmReset') }}
        </el-button>
        <el-button
          :loading="testing"
          :type="testResult ? (testResult.code === 'OK' ? 'success' : 'warning') : 'default'"
          plain
          @click="testConnection"
        >
          {{ testing ? t('portal.agentsCenter.llmTesting') : t('portal.agentsCenter.llmTest') }}
        </el-button>
        <span class="llm-updated">{{ updatedText }}</span>
      </div>
      <div v-if="testResult" class="llm-probe" :class="testResult.code === 'OK' ? 'ok' : 'fail'">
        <span class="llm-probe-label">{{ probeLabel(testResult.code) }}</span>
        <span v-if="testResult.detail" class="llm-probe-detail">{{ testResult.detail }}</span>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.llm-admin {
  border: 1px solid var(--color-border, #e4ebe7);
  border-radius: 12px;
  padding: 16px 18px 12px;
  background: var(--color-bg-card, #fff);
  margin-top: 16px;
}
.llm-admin-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.llm-admin-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.llm-admin-badge {
  font-weight: 600;
}
.llm-admin-desc {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--color-text-secondary, #909399);
}
.llm-lock {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.llm-lock-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #303133);
}
.llm-lock-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #a8702f;
  background: #fdf6ec;
  border: 1px solid #f5e6c8;
  border-radius: 8px;
  padding: 6px 10px;
}
.llm-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.llm-key-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.llm-key-apply {
  flex: none;
  font-size: 12px;
}
.llm-admin-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.llm-updated {
  font-size: 11.5px;
  color: var(--color-text-secondary, #909399);
}
.llm-probe {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 8px;
  padding: 8px 12px;
}
.llm-probe.ok {
  color: #1a6b5c;
  background: #eef7f2;
  border: 1px solid #d5e9e0;
}
.llm-probe.fail {
  color: #a8502f;
  background: #fdf2ee;
  border: 1px solid #f3ddd2;
}
.llm-probe-label {
  font-weight: 700;
}
.llm-probe-detail {
  font-size: 11px;
  opacity: 0.85;
  word-break: break-all;
  max-height: 60px;
  overflow-y: auto;
}
@media (max-width: 720px) {
  .llm-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
