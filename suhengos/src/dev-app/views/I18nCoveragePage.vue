<script setup lang="ts">
import { computed, ref } from 'vue'
import i18n, { localeOptions } from '@/i18n'

/**
 * i18n 覆盖检查（开发端）
 * 以 zh（简体中文）为基准键集合，统计 12 语种的缺失键与覆盖率。
 * 覆盖率 = 存在的基准键数 / 基准键总数（值本身不做翻译质量判断）。
 */

const BASE_LOCALE = 'zh'

interface RawMessages {
  [locale: string]: Record<string, unknown>
}

function getMessages(): RawMessages {
  // Composer 的 messages 属性可能是 ref（composition 模式），做兼容取值
  const raw = (i18n.global as unknown as { messages: { value?: RawMessages } | RawMessages }).messages
  if (raw && typeof raw === 'object' && 'value' in raw && raw.value) {
    return raw.value as RawMessages
  }
  return raw as RawMessages
}

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flatten(v as Record<string, unknown>, key))
    } else {
      keys.push(key)
    }
  }
  return keys
}

const messages = getMessages()
const baseKeys = flatten(messages[BASE_LOCALE] || {})

interface LocaleStat {
  code: string
  label: string
  nativeLabel: string
  total: number
  present: number
  missing: string[]
  coverage: number
}

const stats = computed<LocaleStat[]>(() => {
  return localeOptions.map((opt) => {
    const localeKeys = new Set(flatten(messages[opt.code] || {}))
    const missing = baseKeys.filter((k) => !localeKeys.has(k))
    const present = baseKeys.length - missing.length
    return {
      code: opt.code,
      label: opt.label,
      nativeLabel: opt.nativeLabel,
      total: baseKeys.length,
      present,
      missing,
      coverage: baseKeys.length ? Math.round((present / baseKeys.length) * 100) : 100,
    }
  })
})

const expanded = ref<string | null>(null)

function toggleExpand(code: string) {
  expanded.value = expanded.value === code ? null : code
}

const rtlCodes = ['ar']
</script>

<template>
  <div class="i18n-page">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="i18n 覆盖检查"
      :description="`基准语种：简体中文（zh），基准键共 ${baseKeys.length} 个。缺失键指该语种完全没有对应键（含空串占位）。`"
      class="page-alert"
    />

    <el-table :data="stats" class="stat-table" @row-click="(row: LocaleStat) => toggleExpand(row.code)">
      <el-table-column label="语种" min-width="150">
        <template #default="{ row }">
          <span class="locale-native">{{ row.nativeLabel }}</span>
          <span class="locale-code">{{ row.code }}</span>
          <el-tag v-if="rtlCodes.includes(row.code)" size="small" type="warning" class="rtl-tag">RTL</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="覆盖率" min-width="220">
        <template #default="{ row }">
          <el-progress
            :percentage="row.coverage"
            :stroke-width="10"
            :color="row.coverage >= 95 ? '#1D9E75' : row.coverage >= 80 ? '#EF9F27' : '#E24B4A'"
          />
        </template>
      </el-table-column>
      <el-table-column label="缺失键" width="90" align="center">
        <template #default="{ row }">
          <span :class="row.missing.length ? 'missing-count' : 'ok-count'">{{ row.missing.length }}</span>
        </template>
      </el-table-column>
      <el-table-column label="已覆盖" width="90" align="center">
        <template #default="{ row }">{{ row.present }} / {{ row.total }}</template>
      </el-table-column>
    </el-table>

    <div v-for="s in stats" :key="s.code">
      <div v-if="expanded === s.code && s.missing.length" class="missing-panel">
        <div class="missing-head">{{ s.nativeLabel }}（{{ s.code }}）缺失键 · 前 80 条</div>
        <div class="missing-keys">
          <code v-for="k in s.missing.slice(0, 80)" :key="k">{{ k }}</code>
        </div>
      </div>
      <div v-else-if="expanded === s.code" class="missing-panel">
        <div class="missing-head">{{ s.nativeLabel }}（{{ s.code }}）无缺失键</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.i18n-page {
  max-width: 920px;
}

.page-alert {
  margin-bottom: 16px;
}

.stat-table {
  cursor: pointer;
}

.locale-native {
  font-size: 14px;
  color: var(--color-text-primary);
  margin-right: 8px;
}

.locale-code {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.rtl-tag {
  margin-left: 8px;
}

.missing-count {
  color: #a32d2d;
  font-weight: 600;
}

.ok-count {
  color: #3b6d11;
}

.missing-panel {
  margin-top: 12px;
  padding: 14px 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.missing-head {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.missing-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.missing-keys code {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 5px;
  color: #712b13;
}
</style>
