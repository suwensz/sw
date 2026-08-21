<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
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

// ========= 需求情报 / 供应链源 / 采购数据库 =========
const activeIntelTab = ref('channels')
const selectedChannels = ref<Set<string>>(new Set(ops.intelChannels.map((c) => c.id)))
const leadSide = ref<'all' | 'B2B' | 'B2C'>('all')

function toggleChannel(id: string) {
  if (selectedChannels.value.has(id)) selectedChannels.value.delete(id)
  else selectedChannels.value.add(id)
  selectedChannels.value = new Set(selectedChannels.value)
}

const filteredLeads = computed(() =>
  ops.demandLeads.filter(
    (l) => selectedChannels.value.has(l.channelId) && (leadSide.value === 'all' || l.side === leadSide.value),
  ),
)

function channelName(id: string) {
  const c = ops.intelChannels.find((x) => x.id === id)
  return c ? tText(c.name, locale.value as any) : id
}

function channelTypeLabel(type: string) {
  return t(`ops.competitor.chType_${type}`)
}

function supplyTypeLabel(type: string) {
  return t(`ops.competitor.suppType_${type}`)
}

const csvFileInput = ref<HTMLInputElement>()

function triggerImport() {
  csvFileInput.value?.click()
}

async function onCsvSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const n = ops.importProcurementCsv(text)
  ElMessage.success(t('ops.competitor.dbImported', { n }))
  ;(e.target as HTMLInputElement).value = ''
}

function exportDb() {
  if (!ops.procurementDb.length) {
    ElMessage.info(t('ops.competitor.dbEmpty'))
    return
  }
  const csv = ops.exportProcurementCsv()
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `procurement-db-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function clearDb() {
  try {
    await ElMessageBox.confirm(t('ops.competitor.dbConfirmClear'), t('ops.competitor.tabDatabase'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    ops.clearProcurementDb()
    ElMessage.success(t('common.success'))
  } catch {
    // cancelled
  }
}

function importSampleDb() {
  const samples = [
    { name: '有机枸杞 500g', category: 'tcm_product', price: 12.5, currency: 'USD', supplier: '宁夏中宁枸杞庄园', source: '1688', moq: 50 },
    { name: '香云纱真丝面料（米）', category: 'apparel', price: 45.0, currency: 'USD', supplier: '佛山顺德香云纱工坊', source: '云供应链', moq: 10 },
    { name: '磁吸充电宝 10000mAh', category: 'digital', price: 18.2, currency: 'USD', supplier: '深圳华强北产业带', source: '1688', moq: 100 },
    { name: 'LED筒灯 COB 7W', category: 'hardware', price: 1.85, currency: 'USD', supplier: '中山古镇灯饰产业带', source: '国内一件代发', moq: 500 },
  ]
  samples.forEach((s) => ops.addProcurementRecord(s))
  ElMessage.success(t('ops.competitor.dbImported', { n: samples.length }))
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

    <!-- 需求情报 / 供应链源 / 采购数据库 -->
    <section class="intel-card qh-card">
      <el-tabs v-model="activeIntelTab">
        <!-- Tab 1: 需求情报源 -->
        <el-tab-pane :label="t('ops.competitor.tabChannels')" name="channels">
          <div class="channels-grid">
            <div
              v-for="c in ops.intelChannels"
              :key="c.id"
              :class="['channel-chip', { active: selectedChannels.has(c.id), connected: c.connected }]"
              @click="toggleChannel(c.id)"
            >
              <div class="channel-head">
                <strong>{{ tText(c.name, locale as any) }}</strong>
                <el-tag size="small" effect="plain" :type="c.type === 'social' ? 'primary' : c.type === 'search' ? 'success' : 'warning'">
                  {{ channelTypeLabel(c.type) }}
                </el-tag>
              </div>
              <p class="channel-desc">{{ tText(c.desc, locale as any) }}</p>
              <div class="channel-meta">
                <span>{{ tText(c.region, locale as any) }}</span>
                <el-tag size="small" :type="c.audience === 'B2B' ? 'warning' : c.audience === 'B2C' ? 'success' : 'info'">{{ c.audience }}</el-tag>
              </div>
            </div>
          </div>

          <div class="leads-toolbar">
            <h4>{{ t('ops.competitor.leadTitle') }}</h4>
            <el-radio-group v-model="leadSide" size="small">
              <el-radio-button value="all">{{ t('ops.competitor.sideAll') }}</el-radio-button>
              <el-radio-button value="B2B">B2B</el-radio-button>
              <el-radio-button value="B2C">B2C</el-radio-button>
            </el-radio-group>
            <el-button size="small" @click="ops.refreshDemandLeads()">{{ t('ops.competitor.refreshLeads') }}</el-button>
          </div>
          <el-table :data="filteredLeads" stripe size="small" style="width: 100%">
            <el-table-column :label="t('ops.competitor.leadKeyword')" min-width="240">
              <template #default="{ row }">
                <el-tag v-if="row.hot" size="small" type="danger" effect="dark" style="margin-right:6px">HOT</el-tag>
                <span>{{ tText(row.keyword, locale as any) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.leadChannel')" width="180">
              <template #default="{ row }">{{ channelName(row.channelId) }}</template>
            </el-table-column>
            <el-table-column label="B/C" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.side === 'B2B' ? 'warning' : 'success'">{{ row.side }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.leadMarket')" width="130">
              <template #default="{ row }">{{ tText(row.market, locale as any) }}</template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.leadDemand')" width="110" sortable prop="demandCount">
              <template #default="{ row }">{{ localizeNumber(row.demandCount, locale) }}</template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.leadBuyers')" width="100" sortable prop="buyers">
              <template #default="{ row }">{{ localizeNumber(row.buyers, locale) }}</template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.leadAvgOrder')" width="130" sortable prop="avgOrderValue">
              <template #default="{ row }">${{ localizeNumber(row.avgOrderValue, locale) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 2: 供应链源 -->
        <el-tab-pane :label="t('ops.competitor.tabSupply')" name="supply">
          <el-table :data="ops.supplySources" stripe style="width: 100%">
            <el-table-column :label="t('ops.competitor.suppName')" min-width="230">
              <template #default="{ row }">
                <div class="supp-cell">
                  <strong>{{ tText(row.name, locale as any) }}</strong>
                  <span class="supp-region">{{ tText(row.region, locale as any) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.suppType')" width="140">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ supplyTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.suppCats')" min-width="200">
              <template #default="{ row }">{{ tText(row.categories, locale as any) }}</template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.suppMoq')" width="90">
              <template #default="{ row }">{{ row.moq === 1 ? t('ops.competitor.suppOnePiece') : row.moq }}</template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.suppPriceIndex')" width="110">
              <template #default="{ row }">×{{ row.priceIndex.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.suppLeadTime')" width="100">
              <template #default="{ row }">{{ row.leadTimeDays }}{{ t('ops.supply.days') }}</template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.rating')" width="90">
              <template #default="{ row }">
                <span class="rating"><el-icon color="#f5a623"><Star /></el-icon>{{ row.rating }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 3: 采购供应链数据库 -->
        <el-tab-pane :label="t('ops.competitor.tabDatabase')" name="database">
          <div class="db-toolbar">
            <p class="db-hint">{{ t('ops.competitor.dbHint') }}</p>
            <div class="db-actions">
              <input ref="csvFileInput" type="file" accept=".csv,text/csv" style="display:none" @change="onCsvSelected" />
              <el-button type="primary" size="small" @click="triggerImport">
                <el-icon style="margin-right:4px"><Upload /></el-icon>{{ t('ops.competitor.dbImport') }}
              </el-button>
              <el-button size="small" @click="importSampleDb">{{ t('ops.competitor.dbImportSample') }}</el-button>
              <el-button size="small" :disabled="!ops.procurementDb.length" @click="exportDb">
                <el-icon style="margin-right:4px"><Download /></el-icon>{{ t('ops.competitor.dbExport') }}
              </el-button>
              <el-button size="small" type="danger" plain :disabled="!ops.procurementDb.length" @click="clearDb">
                {{ t('ops.competitor.dbClear') }}
              </el-button>
            </div>
          </div>
          <el-table v-if="ops.procurementDb.length" :data="ops.procurementDb" stripe size="small" style="width: 100%">
            <el-table-column :label="t('ops.competitor.dbName')" prop="name" min-width="180" />
            <el-table-column :label="t('ops.competitor.category')" prop="category" width="120" />
            <el-table-column :label="t('ops.competitor.price')" width="110" sortable prop="price">
              <template #default="{ row }">${{ localizeNumber(row.price, locale) }} {{ row.currency }}</template>
            </el-table-column>
            <el-table-column :label="t('ops.competitor.suppName')" prop="supplier" min-width="160" />
            <el-table-column :label="t('ops.competitor.dbSource')" prop="source" width="120" />
            <el-table-column :label="t('ops.competitor.suppMoq')" prop="moq" width="80" />
            <el-table-column :label="t('ops.competitor.dbNote')" prop="note" min-width="120" />
            <el-table-column width="70">
              <template #default="{ row }">
                <el-button size="small" type="danger" text @click="ops.deleteProcurementRecord(row.id)">{{ t('ops.competitor.dbDelete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="db-empty">
            <el-icon :size="40"><Box /></el-icon>
            <p>{{ t('ops.competitor.dbEmpty') }}</p>
          </div>
        </el-tab-pane>
      </el-tabs>
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

.intel-card { padding: 8px 16px 16px; margin-top: 16px; }
.channels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin-bottom: 18px; }
.channel-chip { border: 1.5px solid var(--color-border); border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.2s; background: #fff; display: flex; flex-direction: column; gap: 8px; }
.channel-chip:hover { border-color: var(--color-primary); }
.channel-chip.active { border-color: var(--color-primary); background: rgba(26, 107, 92, 0.04); box-shadow: 0 2px 8px rgba(26, 107, 92, 0.08); }
.channel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.channel-head strong { font-size: 14px; }
.channel-desc { margin: 0; font-size: 12px; line-height: 1.6; color: var(--color-text-secondary); }
.channel-meta { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--color-text-regular); }

.leads-toolbar { display: flex; align-items: center; gap: 12px; margin: 4px 0 12px; }
.leads-toolbar h4 { margin: 0; font-size: 14px; color: var(--color-primary); flex: 1; }

.supp-cell { display: flex; flex-direction: column; gap: 2px; }
.supp-cell strong { font-size: 14px; }
.supp-region { font-size: 12px; color: var(--color-text-secondary); }

.db-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.db-hint { margin: 0; font-size: 12px; color: var(--color-text-secondary); flex: 1; min-width: 220px; }
.db-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.db-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 0; color: var(--color-text-secondary); }

@media (max-width: 640px) {
  .search-bar { flex-direction: column; }
  .search-bar .el-select { width: 100%; }
}
</style>
