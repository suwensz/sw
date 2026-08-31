<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  Connection,
  CopyDocument,
  Delete,
  Hide,
  Promotion,
  RefreshLeft,
  Timer,
  View,
} from '@element-plus/icons-vue'
import {
  SANDBOX_BASE_URL,
  SANDBOX_ENDPOINTS,
  SANDBOX_MOCK_RECORDS,
  SANDBOX_PROD_URL,
  SANDBOX_SCENARIOS,
  type SandboxLogItem,
  type SandboxMethod,
  type SandboxScenarioKey,
} from '@/mock/devData'

const { t } = useI18n()

const TOKEN_KEY = 'qh_dev_sandbox_token'
const MODE_KEY = 'qh_dev_sandbox_mode'
const LOG_KEY = 'qh_dev_sandbox_log'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 隐私模式下 localStorage 不可写，忽略即可 */
  }
}

function randomToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 24; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return `sbx_live_${out}`
}

function nowText() {
  const d = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`
}

function safeJson(raw: string): string {
  const text = raw.trim()
  if (!text) return '{}'
  try {
    return JSON.stringify(JSON.parse(text))
  } catch {
    return text
  }
}

const baseUrl = SANDBOX_BASE_URL
const prodUrl = SANDBOX_PROD_URL
const METHODS: SandboxMethod[] = ['GET', 'POST', 'PUT', 'DELETE']

/* ---------- 环境凭证 ---------- */
const token = ref<string>(load(TOKEN_KEY, 'sbx_live_8f2a9c31b4d7e1f0'))
const tokenVisible = ref(false)
const testMode = ref<boolean>(load(MODE_KEY, true))

const maskedToken = computed(() => {
  const raw = token.value
  if (tokenVisible.value || raw.length <= 16) return raw
  return `${raw.slice(0, 12)}${'•'.repeat(12)}${raw.slice(-4)}`
})

/* ---------- 调用日志 ---------- */
const callLog = ref<SandboxLogItem[]>(load<SandboxLogItem[]>(LOG_KEY, []))

async function clearLog() {
  callLog.value = []
  save(LOG_KEY, callLog.value)
}

/* ---------- 调试台 ---------- */
const endpointId = ref(SANDBOX_ENDPOINTS[0]!.id)
const method = ref<SandboxMethod>(SANDBOX_ENDPOINTS[0]!.method)
const path = ref(SANDBOX_ENDPOINTS[0]!.path)
const body = ref(SANDBOX_ENDPOINTS[0]!.body)
const scenario = ref<SandboxScenarioKey>('success')
const delay = ref(0)
const sending = ref(false)
const response = ref<{ status: number; ms: number; ok: boolean; text: string } | null>(null)

const needBody = computed(() => method.value === 'POST' || method.value === 'PUT')

const currentSample = computed(() => {
  const ep = SANDBOX_ENDPOINTS.find((e) => e.method === method.value && e.path === path.value)
  return ep ? ep.sample : { code: 0, message: 'ok', data: null }
})

function applyEndpoint(id: string) {
  const ep = SANDBOX_ENDPOINTS.find((e) => e.id === id)
  if (!ep) return
  method.value = ep.method
  path.value = ep.path
  body.value = ep.body
  response.value = null
}

async function send() {
  const target = path.value.trim()
  if (!target) {
    ElMessage.warning(t('dev.sandbox.pathRequired'))
    return
  }
  if (needBody.value && body.value.trim()) {
    try {
      JSON.parse(body.value)
    } catch {
      ElMessage.error(t('dev.sandbox.bodyInvalid'))
      return
    }
  }

  sending.value = true
  const cost = (testMode.value ? delay.value : 0) + 18 + Math.floor(Math.random() * 65)
  await new Promise((resolve) => setTimeout(resolve, Math.min(cost, 3000)))

  const sc = SANDBOX_SCENARIOS[testMode.value ? scenario.value : 'success']
  const status = sc.status ?? (method.value === 'POST' ? 201 : 200)
  const payload = sc.status === null ? currentSample.value : sc.body
  const ok = status < 400

  response.value = { status, ms: cost, ok, text: JSON.stringify(payload, null, 2) }
  callLog.value.unshift({
    id: `sbx${Date.now().toString(36)}`,
    method: method.value,
    path: target,
    status,
    ms: cost,
    time: nowText(),
    ok,
  })
  if (callLog.value.length > 50) callLog.value = callLog.value.slice(0, 50)
  save(LOG_KEY, callLog.value)
  sending.value = false
}

/* ---------- 概览指标 ---------- */
const avgMs = computed(() =>
  callLog.value.length
    ? Math.round(callLog.value.reduce((s, i) => s + i.ms, 0) / callLog.value.length)
    : 0,
)

const stats = computed(() => [
  {
    label: t('dev.sandbox.envStatus'),
    value: avgMs.value > 800 ? t('dev.sandbox.unhealthy') : t('dev.sandbox.healthy'),
    desc: baseUrl.replace('https://', ''),
    tone: avgMs.value > 800 ? 'warn' : 'ok',
  },
  {
    label: t('dev.sandbox.todayCalls'),
    value: callLog.value.length.toLocaleString(),
    desc: nowText().slice(0, 10),
    tone: 'plain',
  },
  {
    label: t('dev.sandbox.avgLatency'),
    value: avgMs.value ? `${avgMs.value} ${t('dev.sandbox.unitMs')}` : '—',
    desc: `${callLog.value.length} ${t('dev.sandbox.unitRecords')}`,
    tone: 'plain',
  },
  {
    label: t('dev.sandbox.mockRecords'),
    value: SANDBOX_MOCK_RECORDS.toLocaleString(),
    desc: t('dev.sandbox.unitRecords'),
    tone: 'plain',
  },
])

/* ---------- 接入代码片段 ---------- */
const snippetTab = ref<string>('curl')

const curlSnippet = computed(() => {
  const parts = [`curl -X ${method.value} '${baseUrl}${path.value}'`]
  parts.push(`-H 'Authorization: Bearer ${token.value}'`)
  if (needBody.value) {
    parts.push(`-H 'Content-Type: application/json'`)
    parts.push(`-d '${safeJson(body.value)}'`)
  }
  return parts.join(' \\\n  ')
})

const jsSnippet = computed(() => {
  const lines = [
    `const res = await fetch('${baseUrl}${path.value}', {`,
    `  method: '${method.value}',`,
    `  headers: {`,
    `    Authorization: 'Bearer ${token.value}',`,
    `    'Content-Type': 'application/json',`,
    `  },`,
  ]
  if (needBody.value) lines.push(`  body: JSON.stringify(${safeJson(body.value)}),`)
  lines.push('})')
  lines.push('const data = await res.json()')
  lines.push('console.log(res.status, data)')
  return lines.join('\n')
})

const pythonSnippet = computed(() => {
  const fn = method.value.toLowerCase()
  const lines = ['import requests', '', `url = '${baseUrl}${path.value}'`, `headers = {'Authorization': 'Bearer ${token.value}'}`]
  if (needBody.value) {
    lines.push(`payload = ${safeJson(body.value)}`)
    lines.push(`r = requests.${fn}(url, headers=headers, json=payload)`)
  } else {
    lines.push(`r = requests.${fn}(url, headers=headers)`)
  }
  lines.push('print(r.status_code, r.json())')
  return lines.join('\n')
})

const currentSnippet = computed(() =>
  snippetTab.value === 'curl' ? curlSnippet.value : snippetTab.value === 'js' ? jsSnippet.value : pythonSnippet.value,
)

/* ---------- 通用动作 ---------- */
async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    ElMessage.success(t('dev.common.copied'))
  } catch {
    ElMessage.warning(t('dev.sandbox.copyFailed'))
  }
}

async function regenerateToken() {
  await ElMessageBox.confirm(t('dev.sandbox.regenerateConfirm'), t('dev.common.confirm'), { type: 'warning' })
  token.value = randomToken()
  save(TOKEN_KEY, token.value)
  ElMessage.success(t('dev.sandbox.regenerated'))
}

async function resetSandbox() {
  await ElMessageBox.confirm(t('dev.sandbox.resetConfirm'), t('dev.common.confirm'), { type: 'warning' })
  token.value = randomToken()
  save(TOKEN_KEY, token.value)
  callLog.value = []
  save(LOG_KEY, callLog.value)
  response.value = null
  ElMessage.success(t('dev.sandbox.resetDone'))
}

watch(testMode, (val) => {
  save(MODE_KEY, val)
  if (!val) scenario.value = 'success'
})

const methodColor = (m: SandboxMethod) =>
  m === 'GET' ? 'success' : m === 'POST' ? 'warning' : m === 'PUT' ? 'primary' : 'danger'

const statusColor = (code: number) => (code < 300 ? 'success' : code < 500 ? 'warning' : 'danger')
</script>

<template>
  <div class="portal-page">
    <div class="portal-page-head">
      <div>
        <h2 style="margin: 0">{{ t('dev.menu.sandbox') }}</h2>
        <p class="portal-stat-desc">{{ t('dev.sandbox.isolateTip') }}</p>
      </div>
      <div class="sbx-header-actions">
        <div class="sbx-mode">
          <span class="sbx-mode-label">{{ t('dev.sandbox.testMode') }}</span>
          <el-switch v-model="testMode" />
        </div>
        <el-button type="danger" plain @click="resetSandbox">
          <el-icon><RefreshLeft /></el-icon> {{ t('dev.sandbox.resetSandbox') }}
        </el-button>
      </div>
    </div>

    <el-alert
      :type="testMode ? 'success' : 'warning'"
      :closable="false"
      show-icon
      :title="testMode ? t('dev.sandbox.mockModeTip') : t('dev.sandbox.liveModeTip')"
      style="margin-bottom: 16px"
    />

    <div class="portal-stat-grid">
      <div v-for="s in stats" :key="s.label" class="portal-stat-card">
        <div class="portal-stat-label">
          <span v-if="s.tone !== 'plain'" class="sbx-dot" :class="`sbx-dot-${s.tone}`" />
          {{ s.label }}
        </div>
        <div class="portal-stat-value">{{ s.value }}</div>
        <div class="portal-stat-desc">{{ s.desc }}</div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="24" :md="24" :lg="10">
        <el-card shadow="never" class="sbx-card">
          <template #header><b>{{ t('dev.sandbox.baseUrl') }}</b></template>

          <div class="sbx-field">
            <div class="sbx-field-label">{{ t('dev.sandbox.baseUrl') }}</div>
            <div class="sbx-field-row">
              <code class="sbx-code">{{ baseUrl }}</code>
              <el-button size="small" @click="copyText(baseUrl)">
                <el-icon><CopyDocument /></el-icon> {{ t('dev.common.copy') }}
              </el-button>
            </div>
          </div>

          <div class="sbx-field">
            <div class="sbx-field-label">{{ t('dev.sandbox.prodUrl') }}</div>
            <div class="sbx-field-row">
              <code class="sbx-code sbx-code-muted">{{ prodUrl }}</code>
            </div>
          </div>

          <div class="sbx-field sbx-field-last">
            <div class="sbx-field-label">{{ t('dev.sandbox.envToken') }}</div>
            <div class="sbx-field-row">
              <code class="sbx-code">{{ maskedToken }}</code>
              <el-button size="small" text @click="tokenVisible = !tokenVisible">
                <el-icon><component :is="tokenVisible ? Hide : View" /></el-icon>
                {{ tokenVisible ? t('dev.sandbox.hide') : t('dev.sandbox.show') }}
              </el-button>
              <el-button size="small" @click="copyText(token)">
                <el-icon><CopyDocument /></el-icon> {{ t('dev.common.copy') }}
              </el-button>
            </div>
            <el-button size="small" type="primary" plain class="sbx-regen" @click="regenerateToken">
              <el-icon><RefreshLeft /></el-icon> {{ t('dev.sandbox.regenerate') }}
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="24" :lg="14">
        <el-card shadow="never" class="sbx-card">
          <template #header>
            <div class="sbx-card-head">
              <b>{{ t('dev.sandbox.snippetTitle') }}</b>
              <el-button size="small" type="primary" plain @click="copyText(currentSnippet)">
                <el-icon><CopyDocument /></el-icon> {{ t('dev.sandbox.copySnippet') }}
              </el-button>
            </div>
          </template>
          <p class="sbx-card-tip">{{ t('dev.sandbox.snippetTip') }}</p>
          <el-tabs v-model="snippetTab">
            <el-tab-pane label="cURL" name="curl" />
            <el-tab-pane label="JavaScript" name="js" />
            <el-tab-pane label="Python" name="python" />
          </el-tabs>
          <div class="code-block sbx-snippet">{{ currentSnippet }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="sbx-card">
      <template #header>
        <div class="sbx-card-head">
          <b>{{ t('dev.sandbox.consoleTitle') }}</b>
          <span class="sbx-card-desc">{{ t('dev.sandbox.consoleDesc') }}</span>
        </div>
      </template>

      <el-form label-position="top" class="sbx-console-form">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="24" :md="24" :lg="10">
            <el-form-item :label="t('dev.sandbox.path')">
              <el-select v-model="endpointId" @change="applyEndpoint">
                <el-option
                  v-for="ep in SANDBOX_ENDPOINTS"
                  :key="ep.id"
                  :label="`${ep.method} ${ep.path} · ${ep.desc}`"
                  :value="ep.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="8" :md="6" :lg="3">
            <el-form-item :label="t('dev.sandbox.method')">
              <el-select v-model="method">
                <el-option v-for="m in METHODS" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="8" :md="6" :lg="3">
            <el-form-item :label="t('dev.sandbox.scenario')">
              <el-select v-model="scenario" :disabled="!testMode">
                <el-option :label="t('dev.sandbox.scenarioSuccess')" value="success" />
                <el-option :label="t('dev.sandbox.scenarioBadRequest')" value="badRequest" />
                <el-option :label="t('dev.sandbox.scenarioUnauthorized')" value="unauthorized" />
                <el-option :label="t('dev.sandbox.scenarioRateLimit')" value="rateLimit" />
                <el-option :label="t('dev.sandbox.scenarioServerError')" value="serverError" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="8" :md="6" :lg="3">
            <el-form-item :label="`${t('dev.sandbox.mockDelay')}(${t('dev.sandbox.unitMs')})`">
              <el-input-number v-model="delay" :min="0" :max="3000" :step="100" :disabled="!testMode" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="24" :md="6" :lg="5">
            <el-form-item label=" ">
              <el-button type="primary" :loading="sending" class="sbx-send" @click="send">
                <el-icon><Promotion /></el-icon>
                {{ sending ? t('dev.sandbox.sending') : t('dev.sandbox.send') }}
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-input v-model="path" :placeholder="t('dev.sandbox.path')">
            <template #prepend>
              <el-tag :type="methodColor(method)" effect="dark" size="small">{{ method }}</el-tag>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <p v-if="!testMode" class="sbx-lock-tip">{{ t('dev.sandbox.liveModeLock') }}</p>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="24" :lg="12">
          <div class="sbx-pane-head">
            <span>{{ t('dev.sandbox.requestBody') }}</span>
            <el-tag v-if="!needBody" size="small" type="info" effect="plain">N / A</el-tag>
          </div>
          <el-input
            v-model="body"
            type="textarea"
            :rows="12"
            :disabled="!needBody"
            :placeholder="t('dev.sandbox.bodyPlaceholder')"
            class="sbx-editor"
          />
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="12">
          <div class="sbx-pane-head">
            <span>{{ t('dev.sandbox.response') }}</span>
            <div v-if="response" class="sbx-resp-meta">
              <el-icon><Timer /></el-icon> {{ response.ms }} {{ t('dev.sandbox.unitMs') }}
              <el-tag :type="statusColor(response.status)" size="small" effect="dark">{{ response.status }}</el-tag>
            </div>
          </div>
          <div v-if="response" class="code-block sbx-editor">{{ response.text }}</div>
          <div v-else class="sbx-empty">
            <el-icon :size="28"><Connection /></el-icon>
            <p>{{ t('dev.sandbox.noResponse') }}</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" class="sbx-card">
      <template #header>
        <div class="sbx-card-head">
          <b>{{ t('dev.sandbox.historyTitle') }}</b>
          <el-button size="small" :disabled="!callLog.length" @click="clearLog">
            <el-icon><Delete /></el-icon> {{ t('dev.sandbox.clearHistory') }}
          </el-button>
        </div>
      </template>

      <el-table :data="callLog" size="small" empty-text="">
        <el-table-column :label="t('dev.sandbox.historyTime')" prop="time" width="170" />
        <el-table-column :label="t('dev.sandbox.method')" width="100">
          <template #default="{ row }">
            <el-tag :type="methodColor(row.method)" size="small" effect="plain">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('dev.sandbox.path')" prop="path" min-width="220">
          <template #default="{ row }"><code class="sbx-code-inline">{{ row.path }}</code></template>
        </el-table-column>
        <el-table-column :label="t('dev.audit.statusCode')" width="100">
          <template #default="{ row }">
            <el-tag :type="statusColor(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('dev.audit.latency')" width="110">
          <template #default="{ row }">{{ row.ms }} {{ t('dev.sandbox.unitMs') }}</template>
        </el-table-column>
        <el-table-column :label="t('dev.sandbox.historyResult')" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.ok ? 'success' : 'danger'" size="small" effect="plain">
              {{ row.ok ? t('dev.sandbox.scenarioSuccess') : t('dev.audit.statusCode') + ' ' + row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <div class="sbx-empty">
            <p>{{ t('dev.sandbox.historyEmpty') }}</p>
          </div>
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.sbx-header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.sbx-mode {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sbx-mode-label {
  font-size: 13px;
  color: var(--color-text-regular);
}

.sbx-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: 1px;
}
.sbx-dot-ok {
  background: var(--color-success);
  box-shadow: 0 0 0 3px rgba(82, 166, 122, 0.18);
}
.sbx-dot-warn {
  background: var(--color-warning);
  box-shadow: 0 0 0 3px rgba(230, 162, 60, 0.18);
}

.sbx-card {
  margin-bottom: 16px;
}
.sbx-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.sbx-card-desc {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
}
.sbx-card-tip {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0 0 4px;
}

.sbx-field {
  margin-bottom: 18px;
}
.sbx-field-last {
  margin-bottom: 0;
}
.sbx-field-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}
.sbx-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sbx-code {
  flex: 1;
  min-width: 0;
  font-family: Consolas, monospace;
  font-size: 13px;
  color: var(--color-primary-dark);
  background: var(--color-bg-soft);
  padding: 7px 10px;
  border-radius: 6px;
  word-break: break-all;
}
.sbx-code-muted {
  color: var(--color-text-secondary);
}
.sbx-code-inline {
  font-family: Consolas, monospace;
  font-size: 12px;
  color: var(--color-primary-dark);
}
.sbx-regen {
  margin-top: 8px;
}

.sbx-snippet {
  max-height: 220px;
  font-size: 12.5px;
}

.sbx-console-form :deep(.el-form-item) {
  margin-bottom: 14px;
}
.sbx-console-form :deep(.el-select) {
  width: 100%;
}
.sbx-send {
  width: 100%;
}

.sbx-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  min-height: 24px;
}
.sbx-resp-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
}
.sbx-editor {
  font-family: Consolas, monospace;
}
.sbx-editor :deep(.el-textarea__inner) {
  font-family: Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}
.sbx-editor.code-block {
  max-height: 288px;
  overflow: auto;
  margin: 0;
}
.sbx-lock-tip {
  font-size: 12px;
  color: var(--color-warning);
  margin: 0 0 12px;
}

.sbx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 288px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: center;
  padding: 0 20px;
}
.sbx-empty p {
  margin: 0;
}
</style>
