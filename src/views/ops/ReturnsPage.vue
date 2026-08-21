<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useTradeStore } from '@/stores/trade'
import { countryInfo } from '@/mock/socialData'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'
import type { ReturnStatus, ReturnRequest } from '@/types'

const { t, locale } = useI18n()
const trade = useTradeStore()

const statusFilter = ref('all')

const statusLabels: Record<ReturnStatus, string> = {
  pending: t('returns.stPending'),
  approved: t('returns.stApproved'),
  refunding: t('returns.stRefunding'),
  completed: t('returns.stCompleted'),
  rejected: t('returns.stRejected'),
}

const reasonLabels: Record<string, string> = {
  quality: t('returns.reasonQuality'),
  damaged: t('returns.reasonDamaged'),
  wrong: t('returns.reasonWrong'),
  not_as_described: t('returns.reasonNotDesc'),
  no_reason: t('returns.reasonNoReason'),
  late: t('returns.reasonLate'),
}

const filtered = computed(() =>
  trade.returns.filter((r) => statusFilter.value === 'all' || r.status === statusFilter.value),
)

const reasonStats = computed(() => {
  const counts: Record<string, number> = {}
  for (const r of trade.returns) counts[r.reason] = (counts[r.reason] || 0) + 1
  const total = trade.returns.length || 1
  return Object.entries(counts)
    .map(([k, v]) => ({ reason: k, count: v, pct: Math.round((v / total) * 100) }))
    .sort((a, b) => b.count - a.count)
})

function flagOf(code: string) {
  return countryInfo(code)?.flag || '🌍'
}

function act(r: typeof trade.returns[number], status: ReturnStatus) {
  trade.setReturnStatus(r.id, status)
  ElMessage.success(t('common.success'))
}
</script>

<template>
  <div class="returns-page qh-container">
    <div class="page-head">
      <h1>{{ t('returns.title') }}</h1>
      <p>{{ t('returns.subtitle') }}</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="qh-card stat">
        <span class="stat-num pending">{{ trade.returnStats.pending }}</span>
        <span class="stat-label">{{ t('returns.statPending') }}</span>
      </div>
      <div class="qh-card stat">
        <span class="stat-num processing">{{ trade.returnStats.processing }}</span>
        <span class="stat-label">{{ t('returns.statProcessing') }}</span>
      </div>
      <div class="qh-card stat">
        <span class="stat-num done">{{ trade.returnStats.completed }}</span>
        <span class="stat-label">{{ t('returns.statCompleted') }}</span>
      </div>
      <div class="qh-card stat">
        <span class="stat-num refund">${{ localizeNumber(trade.returnStats.refundTotal, locale) }}</span>
        <span class="stat-label">{{ t('returns.statRefundTotal') }}</span>
      </div>
    </div>

    <div class="returns-layout">
      <!-- 退货申请表 -->
      <div class="returns-main">
        <div class="filter-row">
          <el-select v-model="statusFilter" style="width: 180px">
            <el-option value="all" :label="t('returns.allStatus')" />
            <el-option v-for="(label, key) in statusLabels" :key="key" :value="key" :label="label" />
          </el-select>
        </div>
        <el-table :data="filtered" class="qh-card">
          <el-table-column prop="orderNo" :label="t('returns.colOrder')" width="135" />
          <el-table-column :label="t('returns.colBuyer')" width="150">
            <template #default="{ row }">{{ flagOf(row.country) }} {{ row.buyer }}</template>
          </el-table-column>
          <el-table-column :label="t('returns.colProduct')">
            <template #default="{ row }">{{ tText(row.product) }} ×{{ row.qty }}</template>
          </el-table-column>
          <el-table-column :label="t('returns.colReason')" width="120">
            <template #default="{ row }">{{ reasonLabels[row.reason] }}</template>
          </el-table-column>
          <el-table-column :label="t('returns.colAmount')" width="90">
            <template #default="{ row }">${{ localizeNumber(row.amount, locale) }}</template>
          </el-table-column>
          <el-table-column :label="t('returns.colStatus')" width="100">
            <template #default="{ row }">
              <span :class="['st-tag', row.status]">{{ statusLabels[row.status as ReturnStatus] }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="170">
            <template #default="{ row }">
              <template v-if="row.status === 'pending'">
                <el-button size="small" type="primary" @click="act(row as ReturnRequest, 'approved')">{{ t('returns.btnApprove') }}</el-button>
                <el-button size="small" type="danger" plain @click="act(row as ReturnRequest, 'rejected')">{{ t('returns.btnReject') }}</el-button>
              </template>
              <el-button v-else-if="row.status === 'approved'" size="small" type="warning" @click="act(row as ReturnRequest, 'refunding')">
                {{ t('returns.btnRefund') }}
              </el-button>
              <el-button v-else-if="row.status === 'refunding'" size="small" type="success" @click="act(row as ReturnRequest, 'completed')">
                {{ t('returns.btnComplete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 原因分析 -->
      <aside class="qh-card reason-panel">
        <h3>{{ t('returns.reasonPanel') }}</h3>
        <div v-for="s in reasonStats" :key="s.reason" class="reason-bar-row">
          <span class="reason-name">{{ reasonLabels[s.reason] }}</span>
          <div class="reason-track">
            <div class="reason-fill" :style="{ width: s.pct + '%' }"></div>
          </div>
          <span class="reason-count">{{ s.count }}</span>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.returns-page { padding: 32px 48px; }
.page-head { margin-bottom: 20px; }
.page-head h1 { font-size: 26px; font-weight: 600; margin: 0 0 6px; }
.page-head p { color: var(--color-text-secondary); margin: 0; }
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat { padding: 18px; display: flex; flex-direction: column; gap: 4px; }
.stat-num { font-size: 28px; font-weight: 700; }
.stat-num.pending { color: var(--color-warning); }
.stat-num.processing { color: var(--color-primary); }
.stat-num.done { color: var(--color-success); }
.stat-num.refund { color: var(--color-accent); font-size: 24px; }
.stat-label { font-size: 13px; color: var(--color-text-secondary); }
.returns-layout { display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start; }
.filter-row { margin-bottom: 14px; }
.returns-main .el-table { padding: 8px; }
.st-tag { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; background: var(--color-bg-soft); }
.st-tag.pending { background: rgba(230, 162, 60, 0.14); color: var(--color-warning); }
.st-tag.approved, .st-tag.refunding { background: rgba(26, 107, 92, 0.1); color: var(--color-primary); }
.st-tag.completed { background: rgba(82, 166, 122, 0.14); color: var(--color-success); }
.st-tag.rejected { background: rgba(217, 107, 92, 0.14); color: var(--color-danger); }
.reason-panel { padding: 20px; position: sticky; top: 120px; }
.reason-panel h3 { margin: 0 0 16px; font-size: 15px; }
.reason-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.reason-name { width: 76px; font-size: 12px; color: var(--color-text-regular); flex-shrink: 0; }
.reason-track { flex: 1; height: 8px; border-radius: 4px; background: var(--color-bg-soft); overflow: hidden; }
.reason-fill { height: 100%; border-radius: 4px; background: var(--color-primary); }
.reason-count { font-size: 12px; color: var(--color-text-secondary); width: 18px; text-align: right; }
@media (max-width: 900px) {
  .returns-page { padding: 16px; }
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .returns-layout { grid-template-columns: 1fr; }
}
</style>
