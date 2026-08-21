<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOpsStore } from '@/stores/ops'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'

const { t, locale } = useI18n()
const ops = useOpsStore()

function statusType(s: string) {
  return s === 'in_stock' ? 'success' : s === 'transit' ? 'primary' : s === 'production' ? 'warning' : 'danger'
}
function statusLabel(s: string) {
  const map: Record<string, string> = { in_stock: t('ops.supply.inStock'), transit: t('ops.supply.transit'), production: t('ops.supply.production'), shortage: t('ops.supply.shortage') }
  return map[s] || s
}
function gradeType(g: string) {
  return g === 'A' ? 'success' : g === 'B' ? 'primary' : 'warning'
}
</script>

<template>
  <div class="supply-page qh-container">
    <div class="page-header">
      <h1>{{ t('ops.supply.title') }}</h1>
      <p>{{ t('ops.subtitle') }}</p>
    </div>

    <!-- 统计概览 -->
    <section class="stats-grid">
      <div class="stat-card qh-card">
        <div class="stat-icon"><el-icon><Box /></el-icon></div>
        <div>
          <strong>{{ localizeNumber(ops.supplyChain.length, locale) }}</strong>
          <span>{{ t('ops.supply.totalSku') }}</span>
        </div>
      </div>
      <div class="stat-card qh-card">
        <div class="stat-icon success"><el-icon><Check /></el-icon></div>
        <div>
          <strong>{{ localizeNumber(ops.supplyChain.filter((s) => s.status === 'in_stock').length, locale) }}</strong>
          <span>{{ t('ops.supply.inStock') }}</span>
        </div>
      </div>
      <div class="stat-card qh-card">
        <div class="stat-icon warning"><el-icon><Van /></el-icon></div>
        <div>
          <strong>{{ localizeNumber(ops.supplyChain.filter((s) => s.status === 'transit').length, locale) }}</strong>
          <span>{{ t('ops.supply.transit') }}</span>
        </div>
      </div>
      <div class="stat-card qh-card">
        <div class="stat-icon danger"><el-icon><WarningFilled /></el-icon></div>
        <div>
          <strong>{{ localizeNumber(ops.supplyChain.filter((s) => s.status === 'shortage').length, locale) }}</strong>
          <span>{{ t('ops.supply.shortage') }}</span>
        </div>
      </div>
    </section>

    <section class="table-card qh-card">
      <el-table :data="ops.supplyChain" stripe>
        <el-table-column :label="t('ops.supply.product')" min-width="220">
          <template #default="{ row }">
            <strong>{{ tText(row.productName, locale as any) }}</strong>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.supply.supplier')" width="190">
          <template #default="{ row }">{{ tText(row.supplier, locale as any) }}</template>
        </el-table-column>
        <el-table-column :label="t('ops.supply.origin')" width="140">
          <template #default="{ row }">{{ tText(row.origin, locale as any) }}</template>
        </el-table-column>
        <el-table-column :label="t('ops.supply.batch')" width="120" prop="batch" />
        <el-table-column :label="t('ops.supply.stock')" width="100" sortable :sort-by="'stock'">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.stock < 200 }">{{ localizeNumber(row.stock, locale) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.supply.leadTime')" width="120">
          <template #default="{ row }">{{ localizeNumber(row.leadTimeDays, locale) }} {{ t('ops.supply.days') }}</template>
        </el-table-column>
        <el-table-column :label="t('ops.supply.cost')" width="100">
          <template #default="{ row }">${{ localizeNumber(row.cost, locale) }}</template>
        </el-table-column>
        <el-table-column :label="t('ops.supply.quality')" width="90">
          <template #default="{ row }">
            <el-tag :type="gradeType(row.qualityGrade)" size="small">{{ row.qualityGrade }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.supply.status')" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.supply.inbound')" width="120" prop="inboundDate" />
      </el-table>
    </section>
  </div>
</template>

<style scoped>
.supply-page { padding: 24px 0 48px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 24px; margin: 0 0 4px; }
.page-header p { color: var(--color-text-secondary); margin: 0; font-size: 14px; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { display: flex; align-items: center; gap: 14px; padding: 20px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(26, 107, 92, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 22px; }
.stat-icon.success { background: rgba(82, 166, 122, 0.12); color: var(--color-success); }
.stat-icon.warning { background: rgba(230, 162, 60, 0.12); color: var(--color-warning); }
.stat-icon.danger { background: rgba(217, 107, 92, 0.12); color: var(--color-danger); }
.stat-card strong { display: block; font-size: 26px; color: var(--color-text-primary); line-height: 1; }
.stat-card span { font-size: 12px; color: var(--color-text-secondary); }

.table-card { padding: 8px; }
.low-stock { color: var(--color-danger); font-weight: 600; }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
