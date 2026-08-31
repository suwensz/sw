<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminStore } from '@/stores/admin'

const { t } = useI18n()
const admin = useAdminStore()

const keyword = ref('')
const resultFilter = ref<'all' | 'success' | 'fail'>('all')

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return admin.auditLogs.filter((a) => {
    const matchResult = resultFilter.value === 'all' || a.result === resultFilter.value
    const matchKw =
      !kw ||
      a.operator.toLowerCase().includes(kw) ||
      a.action.toLowerCase().includes(kw) ||
      a.module.toLowerCase().includes(kw)
    return matchResult && matchKw
  })
})
</script>

<template>
  <div class="portal-page">
    <div class="portal-page-head">
      <h2 style="margin: 0">{{ t('admin.menu.audit') }}</h2>
    </div>
    <p class="portal-stat-desc">平台关键操作审计记录，管理端所有写操作自动写入。</p>

    <div class="filter-bar">
      <el-input v-model="keyword" :placeholder="t('admin.common.search')" clearable style="max-width: 280px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="resultFilter" style="width: 140px">
        <el-option :label="t('admin.common.all')" value="all" />
        <el-option :label="t('admin.audit.success')" value="success" />
        <el-option :label="t('admin.audit.fail')" value="fail" />
      </el-select>
    </div>

    <el-table :data="filtered" stripe>
      <el-table-column prop="time" :label="t('admin.common.time')" width="160" />
      <el-table-column prop="operator" :label="t('admin.common.operator')" width="130" />
      <el-table-column prop="module" :label="t('admin.audit.module')" width="120" />
      <el-table-column prop="action" :label="t('admin.audit.action')" min-width="180" />
      <el-table-column prop="ip" :label="t('admin.audit.ip')" width="140" />
      <el-table-column :label="t('admin.audit.result')" width="90">
        <template #default="{ row }">
          <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">
            {{ row.result === 'success' ? t('admin.audit.success') : t('admin.audit.fail') }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin: 12px 0 16px;
  flex-wrap: wrap;
}
</style>
