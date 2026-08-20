<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * Feature Flags（开发端）
 * 功能开关写入 localStorage（qh_dev_flags），全端可通过工具函数读取。
 * 接入真实后端后可替换为远程配置服务。
 */

const FLAGS_KEY = 'qh_dev_flags'

interface FlagDef {
  key: string
  label: string
  desc: string
  scope: 'client' | 'admin' | 'ops' | 'all'
  default: boolean
}

const flagDefs: FlagDef[] = [
  { key: 'shop.enabled', label: '商城模块', desc: '客户端展示商城与购物车入口', scope: 'client', default: true },
  { key: 'health.alerts.enabled', label: '健康预警', desc: '健康预警通知与预警页', scope: 'client', default: true },
  { key: 'chat.ai.enabled', label: 'AI 对话', desc: '客户端 AI 助手会话功能', scope: 'client', default: true },
  { key: 'ecom.rtl.auto', label: 'RTL 自动适配', desc: '阿拉伯语界面自动切换 RTL 布局', scope: 'all', default: true },
  { key: 'ecom.number.localize', label: '数字本地化', desc: '各语种数字/货币格式本地化渲染', scope: 'all', default: true },
  { key: 'ops.qingflow.sync', label: '轻流数据同步', desc: '运营端与轻流 A/B/C 应用数据打通（规划中）', scope: 'ops', default: false },
  { key: 'admin.audit.log', label: '管理端审计日志', desc: '记录管理端敏感操作（规划中）', scope: 'admin', default: false },
  { key: 'mock.api.delay', label: 'Mock 延迟模拟', desc: 'Mock 请求统一附加网络延迟', scope: 'all', default: false },
]

function loadFlags(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {}
  flagDefs.forEach((f) => {
    defaults[f.key] = f.default
  })
  try {
    const saved = JSON.parse(localStorage.getItem(FLAGS_KEY) || '') as Record<string, boolean>
    return { ...defaults, ...saved }
  } catch {
    return defaults
  }
}

const flags = reactive(loadFlags())

const dirty = computed(() => JSON.stringify(flags) !== JSON.stringify(loadFlags()))

const changedCount = computed(() => {
  const saved = loadFlags()
  return flagDefs.filter((f) => flags[f.key] !== saved[f.key]).length
})

function saveFlags() {
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags))
  ElMessage.success(`Feature Flags 已保存（${changedCount.value} 项变更）`)
}

function resetFlags() {
  flagDefs.forEach((f) => {
    flags[f.key] = f.default
  })
  localStorage.removeItem(FLAGS_KEY)
  ElMessage.success('已恢复默认开关')
}

function copyJson() {
  const text = JSON.stringify(flags, null, 2)
  navigator.clipboard
    ?.writeText(text)
    .then(() => ElMessage.success('JSON 已复制到剪贴板'))
    .catch(() => ElMessage.warning('复制失败，请手动复制'))
}

const scopeTag: Record<FlagDef['scope'], 'success' | 'warning' | 'danger' | 'info'> = {
  client: 'success',
  admin: 'danger',
  ops: 'warning',
  all: 'info',
}
</script>

<template>
  <div class="flags-page">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="Feature Flags"
      description="功能开关写入 localStorage（qh_dev_flags），各端按 key 读取；接入后端后可替换为远程配置服务。"
      class="page-alert"
    />

    <div class="flags-list">
      <div v-for="f in flagDefs" :key="f.key" class="flag-card" :class="{ changed: flags[f.key] !== f.default }">
        <div class="flag-info">
          <div class="flag-head">
            <span class="flag-label">{{ f.label }}</span>
            <el-tag size="small" :type="scopeTag[f.scope]">{{ f.scope }}</el-tag>
          </div>
          <code class="flag-key">{{ f.key }}</code>
          <p class="flag-desc">{{ f.desc }}</p>
        </div>
        <div class="flag-switch">
          <el-switch v-model="flags[f.key]" :active-text="flags[f.key] ? '开' : ''" />
        </div>
      </div>
    </div>

    <div class="flags-actions">
      <span v-if="dirty" class="dirty-tip">{{ changedCount }} 项未保存变更</span>
      <el-button size="small" @click="copyJson">复制 JSON</el-button>
      <el-button size="small" @click="resetFlags">恢复默认</el-button>
      <el-button size="small" type="primary" :disabled="!dirty" @click="saveFlags">保存</el-button>
    </div>
  </div>
</template>

<style scoped>
.flags-page {
  max-width: 860px;
}

.page-alert {
  margin-bottom: 16px;
}

.flags-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 12px;
}

.flag-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px 18px;
}

.flag-card.changed {
  border-color: #ef9f27;
}

.flag-info {
  min-width: 0;
}

.flag-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.flag-key {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  color: #185fa5;
  background: var(--color-bg-soft);
  border-radius: 5px;
  padding: 1px 6px;
}

.flag-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.flag-switch {
  flex-shrink: 0;
}

.flags-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.dirty-tip {
  font-size: 12px;
  color: #854f0b;
  margin-right: 8px;
}
</style>
