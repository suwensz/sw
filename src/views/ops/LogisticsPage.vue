<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useLogisticsStore } from '@/stores/logistics'
import { FREIGHT_CHANNELS, ZONE_FACTORS } from '@/mock/tradeData'
import { countryInfo } from '@/mock/socialData'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'
import type { Shipment } from '@/types'

const { t, locale } = useI18n()
const logistics = useLogisticsStore()

const activeTab = ref('query')

// ===== 物流查询 =====
const trackingNo = ref('')
const searched = ref(false)
const found = ref<Shipment | null>(null)

function doTrack() {
  searched.value = true
  found.value = logistics.findByTracking(trackingNo.value) || null
}

// ===== 发货筛选 =====
const statusFilter = ref('all')
const platformFilter = ref('all')
const platforms = ['Shop', '拼多多', 'JD', '淘宝']

const statusLabels: Record<string, string> = {
  pending: t('logistics.stPending'), shipped: t('logistics.stShipped'),
  transit: t('logistics.stTransit'), delivered: t('logistics.stDelivered'), exception: t('logistics.stException'),
}

const filteredShipments = computed(() =>
  logistics.shipments.filter(
    (s) =>
      (statusFilter.value === 'all' || s.status === statusFilter.value) &&
      (platformFilter.value === 'all' || s.platform === platformFilter.value),
  ),
)

function destLabel(code: string) {
  const info = countryInfo(code)
  return info ? `${info.flag} ${tText(info.name)}` : code
}

// ===== 运费计算 =====
const calcForm = ref({ channel: 'yunexpress', zone: 'SEA', weight: 2 })
const calcResult = computed(() => logistics.calcFreight(calcForm.value.channel, calcForm.value.zone, calcForm.value.weight))

// ===== 物流设置 =====
function onSettingChange() {
  ElMessage.success(t('common.success'))
}
</script>

<template>
  <div class="logistics-page qh-container">
    <div class="page-head">
      <h1>{{ t('logistics.title') }}</h1>
      <p>{{ t('logistics.subtitle') }}</p>
    </div>

    <el-tabs v-model="activeTab" class="lg-tabs">
      <!-- 物流查询 -->
      <el-tab-pane :label="t('logistics.tabQuery')" name="query">
        <div class="track-box qh-card">
          <el-input
            v-model="trackingNo"
            :placeholder="t('logistics.trackPlaceholder')"
            size="large"
            clearable
            @keyup.enter="doTrack"
          >
            <template #append>
              <el-button type="primary" @click="doTrack">{{ t('logistics.trackBtn') }}</el-button>
            </template>
          </el-input>
          <div v-if="searched && !found" class="track-empty">{{ t('logistics.trackNotFound') }}</div>
          <div v-if="found" class="track-result">
            <div class="track-meta">
              <span class="track-no">{{ found.trackingNo }}</span>
              <span>{{ found.carrier }} · {{ destLabel(found.destination) }}</span>
              <span :class="['st-tag', found.status]">{{ statusLabels[found.status] }}</span>
            </div>
            <el-timeline class="track-timeline">
              <el-timeline-item
                v-for="(e, i) in found.events"
                :key="i"
                :timestamp="e.time"
                :type="i === 0 ? 'primary' : undefined"
              >
                {{ tText(e.text) }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </el-tab-pane>

      <!-- 发货筛选 -->
      <el-tab-pane :label="t('logistics.tabShipments')" name="shipments">
        <div class="filter-row">
          <el-select v-model="statusFilter" style="width: 160px">
            <el-option value="all" :label="t('logistics.allStatus')" />
            <el-option v-for="(label, key) in statusLabels" :key="key" :value="key" :label="label" />
          </el-select>
          <el-select v-model="platformFilter" style="width: 160px">
            <el-option value="all" :label="t('logistics.allPlatforms')" />
            <el-option v-for="p in platforms" :key="p" :value="p" :label="p" />
          </el-select>
        </div>
        <el-table :data="filteredShipments" class="qh-card ship-table">
          <el-table-column prop="trackingNo" :label="t('logistics.colTracking')" width="160" />
          <el-table-column prop="orderNo" :label="t('logistics.colOrder')" width="140" />
          <el-table-column prop="platform" :label="t('logistics.colPlatform')" width="90" />
          <el-table-column :label="t('logistics.colDest')">
            <template #default="{ row }">{{ destLabel(row.destination) }}</template>
          </el-table-column>
          <el-table-column prop="weightKg" :label="t('logistics.colWeight')" width="80">
            <template #default="{ row }">{{ row.weightKg }}kg</template>
          </el-table-column>
          <el-table-column :label="t('logistics.colFreight')" width="90">
            <template #default="{ row }">${{ localizeNumber(row.freight, locale) }}</template>
          </el-table-column>
          <el-table-column :label="t('logistics.colStatus')" width="100">
            <template #default="{ row }">
              <span :class="['st-tag', row.status]">{{ statusLabels[row.status] }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="110">
            <template #default="{ row }">
              <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="logistics.markShipped(row.id)">
                {{ t('logistics.shipNow') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 运费计算 -->
      <el-tab-pane :label="t('logistics.tabFreight')" name="freight">
        <div class="freight-grid">
          <div class="qh-card freight-form">
            <h3>{{ t('logistics.freightCalc') }}</h3>
            <el-form label-position="top">
              <el-form-item :label="t('logistics.fChannel')">
                <el-select v-model="calcForm.channel">
                  <el-option v-for="c in FREIGHT_CHANNELS" :key="c.id" :value="c.id" :label="tText(c.name)" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('logistics.fZone')">
                <el-select v-model="calcForm.zone">
                  <el-option v-for="z in ZONE_FACTORS" :key="z.code" :value="z.code" :label="tText(z.label)" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('logistics.fWeight')">
                <el-input-number v-model="calcForm.weight" :min="0.1" :max="2000" :step="0.5" />
                <span class="unit">kg</span>
              </el-form-item>
            </el-form>
          </div>
          <div class="qh-card freight-result">
            <h3>{{ t('logistics.fResult') }}</h3>
            <div class="freight-amount">${{ localizeNumber(calcResult.freight, locale) }}</div>
            <p>{{ tText(FREIGHT_CHANNELS.find((c) => c.id === calcForm.channel)!.name) }} · {{ t('logistics.fEta') }} {{ calcResult.days }}</p>
            <p>{{ t('logistics.fZone2') }}：{{ calcResult.zoneName }}</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- 物流设置 -->
      <el-tab-pane :label="t('logistics.tabSettings')" name="settings">
        <div class="qh-card settings-card">
          <div class="setting-row">
            <div>
              <strong>{{ t('logistics.setAutoOrder') }}</strong>
              <p>{{ t('logistics.setAutoOrderDesc') }}</p>
            </div>
            <el-switch v-model="logistics.settings.autoOrder" @change="onSettingChange" />
          </div>
          <div class="setting-row">
            <div>
              <strong>{{ t('logistics.setDefaultChannel') }}</strong>
              <p>{{ t('logistics.setDefaultChannelDesc') }}</p>
            </div>
            <el-select v-model="logistics.settings.defaultChannel" style="width: 200px" @change="onSettingChange">
              <el-option v-for="c in FREIGHT_CHANNELS" :key="c.id" :value="c.id" :label="tText(c.name)" />
            </el-select>
          </div>
          <div class="setting-row">
            <div>
              <strong>{{ t('logistics.setAutoSync') }}</strong>
              <p>{{ t('logistics.setAutoSyncDesc') }}</p>
            </div>
            <el-switch v-model="logistics.settings.autoSyncTracking" @change="onSettingChange" />
          </div>
          <el-alert
            :title="logistics.settings.autoOrder ? t('logistics.autoModeOn') : t('logistics.autoModeOff')"
            :type="logistics.settings.autoOrder ? 'success' : 'info'"
            :closable="false"
            show-icon
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.logistics-page { padding: 32px 48px; }
.page-head { margin-bottom: 20px; }
.page-head h1 { font-size: 26px; font-weight: 600; margin: 0 0 6px; }
.page-head p { color: var(--color-text-secondary); margin: 0; }
.track-box { padding: 24px; }
.track-empty { margin-top: 20px; text-align: center; color: var(--color-text-secondary); }
.track-result { margin-top: 20px; }
.track-meta { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
.track-no { font-weight: 600; font-size: 16px; }
.track-timeline { padding-left: 4px; }
.filter-row { display: flex; gap: 12px; margin-bottom: 14px; }
.ship-table { padding: 8px; }
.st-tag {
  display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500;
  background: var(--color-bg-soft); color: var(--color-text-regular);
}
.st-tag.transit { background: rgba(230, 162, 60, 0.14); color: var(--color-warning); }
.st-tag.delivered { background: rgba(82, 166, 122, 0.14); color: var(--color-success); }
.st-tag.exception { background: rgba(217, 107, 92, 0.14); color: var(--color-danger); }
.st-tag.pending { background: rgba(26, 107, 92, 0.1); color: var(--color-primary); }
.freight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.freight-form, .freight-result { padding: 24px; }
.freight-form h3, .freight-result h3 { margin: 0 0 16px; font-size: 16px; }
.freight-amount { font-size: 40px; font-weight: 700; color: var(--color-primary); margin-bottom: 8px; }
.freight-result p { color: var(--color-text-secondary); font-size: 14px; }
.unit { margin-left: 8px; color: var(--color-text-secondary); }
.settings-card { padding: 8px 24px; }
.setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 0; border-bottom: 1px solid var(--color-border); gap: 20px;
}
.setting-row p { margin: 4px 0 0; font-size: 13px; color: var(--color-text-secondary); }
.settings-card .el-alert { margin: 18px 0; }
@media (max-width: 768px) {
  .logistics-page { padding: 16px; }
  .freight-grid { grid-template-columns: 1fr; }
}
</style>
