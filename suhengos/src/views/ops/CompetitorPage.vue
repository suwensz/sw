<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOpsStore } from '@/stores/ops'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'

const { t, locale } = useI18n()
const ops = useOpsStore()

const searchInput = ref('')
const selectedPlatforms = ref<Set<string>>(new Set(ops.marketplaces.map((m) => m.id)))

const platformOptions = computed(() => [
  { value: 'all', label: t('ops.competitor.allPlatforms') },
  ...ops.marketplaces.map((m) => ({ value: m.id, label: m.name })),
])

function doSearch() {
  ops.competitorKeyword = searchInput.value
  ops.refreshCompetitors()
}

function togglePlatform(id: string) {
  if (selectedPlatforms.value.has(id)) selectedPlatforms.value.delete(id)
  else selectedPlatforms.value.add(id)
  selectedPlatforms.value = new Set(selectedPlatforms.value)
}

const insights = computed(() => ops.getCompetitorInsights())

function formatCurrency(price: number, currency: string) {
  const symbols: Record<string, string> = { USD: '$', CNY: '¥', AED: 'AED ', IDR: 'Rp' }
  return `${symbols[currency] || ''}${localizeNumber(price, locale.value)}`
}

function platformName(id: string) {
  return ops.marketplaces.find((m) => m.id === id)?.name || id
}
</script>

<template>
  <div class="competitor-page qh-container">
    <div class="page-header">
      <div>
        <h1>{{ t('ops.competitor.title') }}</h1>
        <p>{{ t('ops.subtitle') }}</p>
      </div>
    </div>

    <!-- 平台选择 -->
    <section class="platforms-card qh-card">
      <h3>{{ t('ops.platforms') }}</h3>
      <div class="platforms-grid">
        <div
          v-for="p in ops.marketplaces"
          :key="p.id"
          :class="['platform-chip', { active: selectedPlatforms.has(p.id), connected: p.connected }]"
          @click="togglePlatform(p.id)"
        >
          <span class="flag">{{ p.flag }}</span>
          <div class="platform-info">
            <strong>{{ p.name }}</strong>
            <span>{{ tText(p.region, locale as any) }} · {{ p.currency }}</span>
          </div>
          <el-icon v-if="p.connected" class="check"><CircleCheckFilled /></el-icon>
        </div>
      </div>
    </section>

    <!-- 搜索栏 -->
    <section class="search-bar qh-card">
      <el-input
        v-model="searchInput"
        :placeholder="t('ops.competitor.searchPlaceholder')"
        size="large"
        clearable
        @keyup.enter="doSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="ops.competitorPlatform" style="width: 180px">
        <el-option v-for="opt in platformOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
      </el-select>
      <el-button type="primary" size="large" @click="doSearch">
        <el-icon style="margin-right:4px"><Search /></el-icon>{{ t('ops.competitor.analyze') }}
      </el-button>
    </section>

    <!-- AI 洞察 -->
    <section class="insights-card qh-card" v-if="ops.filteredCompetitors.length">
      <div class="insights-head">
        <el-icon color="var(--color-accent)"><MagicStick /></el-icon>
        <h3>{{ t('ops.competitor.insights') }}</h3>
      </div>
      <p>{{ insights }}</p>
    </section>

    <!-- 竞品表格 -->
    <section class="table-card qh-card">
      <el-table :data="ops.filteredCompetitors" stripe style="width: 100%">
        <el-table-column :label="t('ops.competitor.title')" min-width="280">
          <template #default="{ row }">
            <div class="product-cell">
              <img :src="row.image" :alt="row.title" />
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.competitor.platform')" width="130">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ platformName(row.platform) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.competitor.price')" width="120" sortable :sort-by="'price'">
          <template #default="{ row }">
            <strong>{{ formatCurrency(row.price, row.currency) }}</strong>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.competitor.sales30d')" width="120" sortable>
          <template #default="{ row }">
            <span class="sales-num">{{ localizeNumber(row.sales30d, locale) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.competitor.rating')" width="100">
          <template #default="{ row }">
            <span class="rating"><el-icon color="#f5a623"><Star /></el-icon>{{ row.rating }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.competitor.reviews')" width="100">
          <template #default="{ row }">{{ row.reviews.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column :label="t('ops.competitor.stock')" width="110">
          <template #default="{ row }">
            <el-tag :type="row.stockStatus === 'in_stock' ? 'success' : row.stockStatus === 'low' ? 'warning' : 'danger'" size="small">
              {{ t(`ops.competitor.${row.stockStatus === 'in_stock' ? 'inStock' : row.stockStatus === 'low' ? 'lowStock' : 'outStock'}`) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('ops.competitor.trend')" width="80">
          <template #default="{ row }">
            <span :class="['trend', row.delta > 0 ? 'up' : 'down']">
              <el-icon><component :is="row.delta > 0 ? 'CaretTop' : 'CaretBottom'" /></el-icon>
              {{ Math.abs(row.delta) }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<style scoped>
.competitor-page { padding: 24px 0 48px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 24px; margin: 0 0 4px; }
.page-header p { color: var(--color-text-secondary); margin: 0; font-size: 14px; }

.platforms-card { padding: 20px; margin-bottom: 16px; }
.platforms-card h3 { font-size: 15px; margin: 0 0 14px; color: var(--color-primary); }
.platforms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.platform-chip { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--color-border); border-radius: 10px; cursor: pointer; transition: all 0.2s; background: #fff; }
.platform-chip:hover { border-color: var(--color-primary); }
.platform-chip.active { border-color: var(--color-primary); background: rgba(26, 107, 92, 0.04); }
.flag { font-size: 24px; }
.platform-info { flex: 1; display: flex; flex-direction: column; }
.platform-info strong { font-size: 14px; }
.platform-info span { font-size: 11px; color: var(--color-text-secondary); }
.check { color: var(--color-success); font-size: 18px; }

.search-bar { display: flex; gap: 12px; padding: 16px; margin-bottom: 16px; }

.insights-card { padding: 18px 22px; margin-bottom: 16px; border-left: 3px solid var(--color-accent); background: linear-gradient(135deg, rgba(212, 168, 83, 0.06), rgba(26, 107, 92, 0.03)); }
.insights-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.insights-head h3 { margin: 0; font-size: 15px; color: var(--color-primary); }
.insights-card p { margin: 0; font-size: 13px; line-height: 1.7; color: var(--color-text-regular); }

.table-card { padding: 8px; }
.product-cell { display: flex; align-items: center; gap: 10px; }
.product-cell img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
.sales-num { font-weight: 600; color: var(--color-primary); }
.rating { display: inline-flex; align-items: center; gap: 4px; }
.trend { display: inline-flex; align-items: center; font-size: 12px; font-weight: 600; }
.trend.up { color: var(--color-success); }
.trend.down { color: var(--color-danger); }

@media (max-width: 640px) {
  .search-bar { flex-direction: column; }
  .search-bar .el-select { width: 100%; }
}
</style>
