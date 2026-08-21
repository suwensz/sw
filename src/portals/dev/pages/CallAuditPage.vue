<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SEED_API_AUDIT } from '@/mock/devData'

const { t } = useI18n()

const keyword = ref('')
const codeFilter = ref<'all' | 'success' | 'warn' | 'error'>('all')

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return SEED_API_AUDIT.filter((a) => {
    const ok = a.statusCode < 400
    const matchCode =
      codeFilter.value === 'all' ||
      (codeFilter.value === 'success' && ok) ||
      (codeFilter.value === 'warn' && !ok)
    const matchKw = !kw || a.path.toLowerCase().includes(kw) || a.method.toLowerCase().includes(kw)
    return matchCode && matchKw
  })
})

function tagType(code: number): 'success' | 'warning' | 'danger' {
  if (code < 300) return 'success'
  if (code < 500) return 'warning'
  return 'danger'
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('dev.menu.audit') }}</h2>
    <p class="portal-stat-desc">最近接口调用记录与状态码分布（演示数据）。</p>

    <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap">
      <el-input v-model="keyword" :placeholder="t('dev.common.search')" clearable style="max-width: 280px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="codeFilter" style="width: 150px">
        <el-option :label="t('dev.common.all')" value="all" />
        <el-option label="2xx / 3xx" value="success" />
        <el-option label="4xx / 5xx" value="warn" />
      </el-select>
    </div>

    <el-table :data="filtered" stripe>
      <el-table-column :label="t('dev.audit.method')" width="90">
        <template #default="{ row }">
          <el-tag :type="row.method === 'GET' ? 'success' : row.method === 'POST' ? 'warning' : 'primary'" size="small">
            {{ row.method }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="path" :label="t('dev.audit.path')" min-width="200">
        <template #default="{ row }"><code class="audit-path">{{ row.path }}</code></template>
      </el-table-column>
      <el-table-column :label="t('dev.audit.statusCode')" width="110">
        <template #default="{ row }">
          <el-tag :type="tagType(row.statusCode)" size="small">{{ row.statusCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('dev.audit.latency')" width="120">
        <template #default="{ row }">
          <span :class="{ 'latency-high': row.latency > 60 }">{{ row.latency }} ms</span>
        </template>
      </el-table-column>
      <el-table-column prop="time" :label="t('dev.common.time')" width="170" />
    </el-table>
  </div>
</template>

<style scoped>
.audit-path {
  font-family: Consolas, monospace;
  font-size: 13px;
  color: var(--color-primary-dark);
}
.latency-high {
  color: #c05f3a;
  font-weight: 600;
}
</style>
