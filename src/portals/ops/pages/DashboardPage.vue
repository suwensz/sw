<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useOpsStore } from '@/stores/ops'

const { t } = useI18n()
const router = useRouter()
const ops = useOpsStore()

const stats = computed(() => [
  { label: t('portal.dashboard.statConnected'), value: ops.connectedMarketplaces.length, desc: t('portal.dashboard.statConnectedDesc', { n: ops.marketplaces.length }), icon: 'Connection' },
  { label: t('portal.dashboard.statCompetitor'), value: ops.competitors.length, desc: t('portal.dashboard.statCompetitorDesc'), icon: 'Histogram' },
  { label: t('portal.dashboard.statSupply'), value: ops.supplyChain.length, desc: t('portal.dashboard.statSupplyDesc'), icon: 'Van' },
  { label: t('portal.dashboard.statDemand'), value: ops.demands.length, desc: t('portal.dashboard.statDemandDesc'), icon: 'TrendCharts' },
  { label: t('portal.dashboard.statListing'), value: ops.listingTasks.length, desc: t('portal.dashboard.statListingDesc'), icon: 'Upload' },
  { label: t('portal.dashboard.statCreative'), value: ops.creativeAssets.length, desc: t('portal.dashboard.statCreativeDesc'), icon: 'MagicStick' },
])

const quickTools = computed(() => [
  { label: t('portal.opsMenu.competitor'), to: '/competitor', icon: 'Histogram', desc: t('portal.dashboard.toolCompetitorDesc') },
  { label: t('portal.opsMenu.supply'), to: '/supply', icon: 'Van', desc: t('portal.dashboard.toolSupplyDesc') },
  { label: t('portal.opsMenu.demand'), to: '/demand', icon: 'TrendCharts', desc: t('portal.dashboard.toolDemandDesc') },
  { label: t('portal.opsMenu.creative'), to: '/creative', icon: 'MagicStick', desc: t('portal.dashboard.toolCreativeDesc') },
  { label: t('portal.opsMenu.listing'), to: '/listing', icon: 'Upload', desc: t('portal.dashboard.toolListingDesc') },
  { label: t('portal.opsMenu.logistics'), to: '/logistics', icon: 'Ship', desc: t('portal.dashboard.toolLogisticsDesc') },
])

type ListingStatus = 'published' | 'failed' | 'pending' | 'generating'

function statusLabel(status: string): string {
  const key = status as ListingStatus
  if (key === 'published') return t('portal.dashboard.statusPublished')
  if (key === 'failed') return t('portal.dashboard.statusFailed')
  if (key === 'generating') return t('portal.dashboard.statusGenerating')
  return t('portal.dashboard.statusPending')
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('portal.dashboard.title') }}</h2>
    <p class="portal-stat-desc">{{ t('portal.dashboard.subtitle') }}</p>

    <div class="portal-stat-grid">
      <div v-for="s in stats" :key="s.label" class="portal-stat-card">
        <div class="portal-stat-label">{{ s.label }}</div>
        <div class="portal-stat-value">{{ s.value }}</div>
        <div class="portal-stat-desc">{{ s.desc }}</div>
      </div>
    </div>

    <h3>{{ t('portal.dashboard.quickTools') }}</h3>
    <el-row :gutter="16">
      <el-col v-for="tool in quickTools" :key="tool.to" :span="8" :xs="24" :md="8" style="margin-bottom: 16px">
        <el-card shadow="never" class="tool-card" @click="router.push(tool.to)">
          <div style="display: flex; align-items: center; gap: 12px">
            <el-icon :size="28" style="color: var(--color-primary)"><component :is="tool.icon" /></el-icon>
            <div>
              <div style="font-weight: 600; color: var(--color-text-primary)">{{ tool.label }}</div>
              <div style="font-size: 12px; color: var(--color-text-secondary)">{{ tool.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <h3>{{ t('portal.dashboard.recentTasks') }}</h3>
    <el-table :data="ops.listingTasks.slice(0, 6)" size="small">
      <el-table-column :label="t('portal.dashboard.colProduct')" min-width="160">
        <template #default="{ row }">{{ row.productName?.zh || row.productName?.en || '-' }}</template>
      </el-table-column>
      <el-table-column :label="t('portal.dashboard.colPlatform')" min-width="140">
        <template #default="{ row }">
          <el-tag v-for="p in row.marketplaces" :key="p" size="small" style="margin-right: 4px">{{ p }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('portal.dashboard.colStatus')" width="110">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'published' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'"
            size="small"
          >
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="ops.listingTasks.length === 0" :description="t('portal.dashboard.emptyTasks')" :image-size="60" />
  </div>
</template>

<style scoped>
.tool-card {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(26, 107, 92, 0.12);
}
</style>
