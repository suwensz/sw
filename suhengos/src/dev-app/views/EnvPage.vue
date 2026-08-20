<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { refreshHttpConfig, currentEnv, isDevEnv } from '@/api'

/**
 * 环境与日志（开发端）
 * - 环境切换：dev / staging / prod 三套 API 地址配置，写入 localStorage（qh_dev_env）
 * - 运行日志：环形缓冲（qh_dev_logs，最多 200 条），捕获本端 console 输出
 */

type EnvName = 'dev' | 'staging' | 'prod'

interface EnvConfig {
  env: EnvName
  apiBaseUrl: Record<EnvName, string>
}

const ENV_KEY = 'qh_dev_env'
const LOGS_KEY = 'qh_dev_logs'

const envPresets: Record<EnvName, { label: string; url: string; desc: string }> = {
  dev: { label: '开发（本机）', url: 'http://localhost:8000', desc: '本地后端 / Mock 服务' },
  staging: { label: '预发', url: 'https://staging-api.suheng-os.example.com', desc: '预发环境，联调数据' },
  prod: { label: '生产', url: 'https://api.suheng-os.example.com', desc: '生产环境，谨慎操作' },
}

function loadEnvConfig(): EnvConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(ENV_KEY) || '') as EnvConfig
    if (saved?.env && saved?.apiBaseUrl) return saved
  } catch {
    /* fallthrough */
  }
  return {
    env: 'dev',
    apiBaseUrl: { dev: envPresets.dev.url, staging: envPresets.staging.url, prod: envPresets.prod.url },
  }
}

const config = reactive<EnvConfig>(loadEnvConfig())
const savedEnv = ref(config.env)

const isDirty = computed(() => JSON.stringify(config) !== JSON.stringify(loadEnvConfig()))

function saveEnv() {
  localStorage.setItem(ENV_KEY, JSON.stringify(config))
  savedEnv.value = config.env
  // 刷新 axios 实例配置：重设 baseURL 和 Mock 适配器
  refreshHttpConfig()
  const mode = isDevEnv() ? 'Mock 适配器' : '真实 HTTP'
  ElMessage.success(`环境已切换：${envPresets[config.env].label} → ${config.apiBaseUrl[config.env]}（${mode}）`)
}

function switchEnv(env: EnvName) {
  config.env = env
  saveEnv()
}

function resetEnv() {
  config.env = 'dev'
  config.apiBaseUrl = { dev: envPresets.dev.url, staging: envPresets.staging.url, prod: envPresets.prod.url }
  saveEnv()
}

// ====== 运行日志 ======
interface LogEntry {
  time: string
  level: 'log' | 'warn' | 'error'
  text: string
}

const logs = ref<LogEntry[]>([])
const levelFilter = ref<'all' | 'log' | 'warn' | 'error'>('all')

function loadLogs() {
  try {
    logs.value = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]') as LogEntry[]
  } catch {
    logs.value = []
  }
}

function persistLogs() {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.value.slice(-200)))
}

function pushLog(level: LogEntry['level'], args: unknown[]) {
  const text = args
    .map((a) => {
      if (typeof a === 'string') return a
      try {
        return JSON.stringify(a)
      } catch {
        return String(a)
      }
    })
    .join(' ')
  logs.value.push({ time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), level, text })
  logs.value = logs.value.slice(-200)
  persistLogs()
}

onMounted(() => {
  loadLogs()
  // 捕获开发端窗口的 console 输出（仅本页生命周期内）
  const rawLog = console.log.bind(console)
  const rawWarn = console.warn.bind(console)
  const rawError = console.error.bind(console)
  console.log = (...args: unknown[]) => {
    rawLog(...args)
    pushLog('log', args)
  }
  console.warn = (...args: unknown[]) => {
    rawWarn(...args)
    pushLog('warn', args)
  }
  console.error = (...args: unknown[]) => {
    rawError(...args)
    pushLog('error', args)
  }
  pushLog('log', ['开发端日志面板已挂载（console 输出将被记录）'])
})

function clearLogs() {
  logs.value = []
  persistLogs()
  ElMessage.success('日志已清空')
}

function writeTestLog() {
  pushLog('warn', [`测试日志 ${new Date().toISOString()} — 由「写入测试日志」按钮触发`])
}

const filteredLogs = computed(() =>
  levelFilter.value === 'all' ? logs.value : logs.value.filter((l) => l.level === levelFilter.value),
)
</script>

<template>
  <div class="env-page">
    <el-row :gutter="16">
      <el-col :xs="24" :md="10">
        <div class="panel">
          <div class="panel-head">
            <h3 class="panel-title">环境切换</h3>
            <el-tag size="small" :type="savedEnv === 'prod' ? 'danger' : savedEnv === 'staging' ? 'warning' : 'success'">
              当前：{{ envPresets[savedEnv].label }}
            </el-tag>
          </div>

          <div class="env-cards">
            <div
              v-for="(preset, env) in envPresets"
              :key="env"
              class="env-card"
              :class="{ active: config.env === env }"
              @click="switchEnv(env as EnvName)"
            >
              <div class="env-card-label">{{ preset.label }}</div>
              <div class="env-card-desc">{{ preset.desc }}</div>
            </div>
          </div>

          <el-form label-position="top" size="small" class="url-form">
            <el-form-item v-for="(preset, env) in envPresets" :key="env" :label="`${preset.label} API 地址`">
              <el-input v-model="config.apiBaseUrl[env as EnvName]" placeholder="https://" spellcheck="false" />
            </el-form-item>
          </el-form>

          <div class="panel-actions">
            <el-button size="small" @click="resetEnv">恢复默认</el-button>
            <el-button size="small" type="primary" :disabled="!isDirty" @click="saveEnv">保存配置</el-button>
          </div>

          <p class="panel-tip">配置写入 localStorage（qh_dev_env），axios 适配层按环境读取 baseURL，dev 环境自动启用 Mock 适配器。</p>
        </div>
      </el-col>

      <el-col :xs="24" :md="14">
        <div class="panel log-panel">
          <div class="panel-head">
            <h3 class="panel-title">运行日志</h3>
            <div class="log-actions">
              <el-radio-group v-model="levelFilter" size="small">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="log">log</el-radio-button>
                <el-radio-button value="warn">warn</el-radio-button>
                <el-radio-button value="error">error</el-radio-button>
              </el-radio-group>
              <el-button size="small" @click="writeTestLog">写入测试日志</el-button>
              <el-button size="small" @click="clearLogs">清空</el-button>
            </div>
          </div>

          <div class="log-list">
            <div v-if="!filteredLogs.length" class="log-empty">暂无日志</div>
            <div v-for="(l, i) in filteredLogs.slice().reverse()" :key="i" class="log-line" :class="`log-${l.level}`">
              <span class="log-time">{{ l.time }}</span>
              <span class="log-level">{{ l.level.toUpperCase() }}</span>
              <span class="log-text">{{ l.text }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.env-page {
  max-width: 1100px;
}

.panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.env-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.env-card {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.env-card:hover {
  border-color: var(--color-text-secondary);
}

.env-card.active {
  border: 2px solid #1a6b5c;
}

.env-card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.env-card-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.url-form {
  margin-bottom: 4px;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.panel-tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.log-panel {
  display: flex;
  flex-direction: column;
  min-height: 480px;
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  max-height: 520px;
  background: #10151f;
  border-radius: 8px;
  padding: 12px;
  font-family: Consolas, Menlo, monospace;
  font-size: 12px;
}

.log-empty {
  color: #6b7280;
  text-align: center;
  padding: 32px 0;
}

.log-line {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  line-height: 1.5;
}

.log-time {
  color: #6b7280;
  flex-shrink: 0;
}

.log-level {
  flex-shrink: 0;
  width: 44px;
}

.log-log .log-level {
  color: #9ca3af;
}

.log-warn .log-level {
  color: #ef9f27;
}

.log-error .log-level {
  color: #e24b4a;
}

.log-text {
  color: #d7dce5;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
