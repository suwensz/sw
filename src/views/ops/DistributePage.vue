<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useTradeStore } from '@/stores/trade'
import { tText } from '@/i18n'
import { localizeNumber } from '@/utils/numbers'
import type { PlatformOrder } from '@/types'

const { t, locale } = useI18n()
const trade = useTradeStore()

const partnerName = ref('')
const shareDialogOrder = ref<PlatformOrder | null>(null)
const shareChannel = ref<'wechat' | 'qq'>('wechat')
const customPct = ref(10)
const lastShareText = ref('')

function openShare(o: PlatformOrder) {
  shareDialogOrder.value = o
  customPct.value = trade.distributeSettings.defaultProfitPct
  lastShareText.value = ''
}

const previewProfit = computed(() => {
  const o = shareDialogOrder.value
  if (!o) return 0
  const pct = trade.distributeSettings.autoPct ? trade.distributeSettings.defaultProfitPct : customPct.value
  return Math.round(o.amount * (pct / 100) * 100) / 100
})

async function doShare() {
  const o = shareDialogOrder.value
  if (!o) return
  if (!partnerName.value.trim()) {
    ElMessage.warning(t('distribute.needPartner'))
    return
  }
  const { shareText } = trade.distributeOrder(o, shareChannel.value, partnerName.value.trim(), customPct.value)
  lastShareText.value = shareText
  try {
    await navigator.clipboard.writeText(shareText)
    ElMessage.success(t('distribute.copied'))
  } catch {
    ElMessage.success(t('distribute.generated'))
  }
}

function jumpTo(channel: 'wechat' | 'qq') {
  shareChannel.value = channel
  doShare()
}

const channelName = (c: 'wechat' | 'qq') => (c === 'wechat' ? t('distribute.viaWechat') : t('distribute.viaQq'))
</script>

<template>
  <div class="dist-page qh-container">
    <div class="page-head">
      <h1>{{ t('distribute.title') }}</h1>
      <p>{{ t('distribute.subtitle') }}</p>
    </div>

    <!-- 分润设置 -->
    <div class="qh-card pct-card">
      <div class="pct-row">
        <div class="pct-info">
          <strong>{{ t('distribute.profitSetting') }}</strong>
          <p>{{ t('distribute.profitSettingDesc') }}</p>
        </div>
        <div class="pct-controls">
          <div class="auto-switch">
            <span>{{ t('distribute.autoPct') }}</span>
            <el-switch :model-value="trade.distributeSettings.autoPct" @change="(v: any) => trade.setAutoPct(!!v)" />
          </div>
          <div class="pct-slider">
            <el-slider
              :model-value="trade.distributeSettings.defaultProfitPct"
              :min="1" :max="50" :step="1"
              :format-tooltip="(v: number) => v + '%'"
              :disabled="trade.distributeSettings.autoPct"
              @update:model-value="(v: any) => trade.setDefaultProfitPct(v)"
            />
            <span class="pct-value">{{ trade.distributeSettings.defaultProfitPct }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 可分发订单 -->
    <h3 class="section-title">{{ t('distribute.shareableOrders') }}</h3>
    <el-table :data="trade.orders" class="qh-card">
      <el-table-column prop="orderNo" :label="t('myOrders.colOrder')" width="140" />
      <el-table-column :label="t('distribute.colProduct')">
        <template #default="{ row }">{{ tText(row.product) }}</template>
      </el-table-column>
      <el-table-column :label="t('distribute.colAmount')" width="110">
        <template #default="{ row }">¥{{ localizeNumber(row.amount, locale) }}</template>
      </el-table-column>
      <el-table-column prop="buyer" :label="t('myOrders.buyer')" width="90" />
      <el-table-column :label="t('distribute.colEstProfit')" width="130">
        <template #default="{ row }">
          ¥{{ localizeNumber(Math.round(row.amount * (trade.distributeSettings.defaultProfitPct / 100) * 100) / 100, locale) }}
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="200">
        <template #default="{ row }">
          <el-button size="small" type="success" @click="openShare(row as PlatformOrder)">{{ t('distribute.viaWechat') }}</el-button>
          <el-button size="small" type="primary" plain @click="openShare(row as PlatformOrder)">{{ t('distribute.viaQq') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分发记录 -->
    <h3 class="section-title">{{ t('distribute.records') }}（{{ trade.distributeRecords.length }}）</h3>
    <el-table :data="trade.distributeRecords" class="qh-card" :empty-text="t('distribute.noRecords')">
      <el-table-column prop="orderNo" :label="t('myOrders.colOrder')" width="140" />
      <el-table-column :label="t('distribute.colProduct')">
        <template #default="{ row }">{{ tText(row.product) }}</template>
      </el-table-column>
      <el-table-column prop="partner" :label="t('distribute.colPartner')" width="110" />
      <el-table-column :label="t('distribute.colChannel')" width="100">
        <template #default="{ row }">{{ channelName(row.channel) }}</template>
      </el-table-column>
      <el-table-column :label="t('distribute.colPct')" width="80">
        <template #default="{ row }">{{ row.profitPct }}%</template>
      </el-table-column>
      <el-table-column :label="t('distribute.colProfit')" width="110">
        <template #default="{ row }">
          <span class="profit-num">¥{{ localizeNumber(row.profitAmount, locale) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sharedAt" :label="t('distribute.colSharedAt')" width="140" />
    </el-table>

    <!-- 分享弹窗 -->
    <el-dialog
      :model-value="!!shareDialogOrder"
      :title="t('distribute.dialogTitle')"
      width="480px"
      @update:model-value="(v: any) => { if (!v) shareDialogOrder = null }"
    >
      <template v-if="shareDialogOrder">
        <div class="dlg-order">
          <strong>{{ tText(shareDialogOrder.product) }}</strong>
          <span>¥{{ localizeNumber(shareDialogOrder.amount, locale) }} · {{ shareDialogOrder.orderNo }}</span>
        </div>
        <el-form label-position="top">
          <el-form-item :label="t('distribute.partnerLabel')">
            <el-input v-model="partnerName" :placeholder="t('distribute.partnerPlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('distribute.channelLabel')">
            <el-radio-group v-model="shareChannel">
              <el-radio value="wechat">{{ t('distribute.viaWechat') }} 💬</el-radio>
              <el-radio value="qq">{{ t('distribute.viaQq') }} 🐧</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="t('distribute.pctLabel')">
            <div class="dlg-pct">
              <el-slider v-model="customPct" :min="1" :max="50" :disabled="trade.distributeSettings.autoPct" />
              <span class="pct-value">{{ trade.distributeSettings.autoPct ? trade.distributeSettings.defaultProfitPct : customPct }}%</span>
            </div>
            <div class="profit-preview">{{ t('distribute.estProfit') }}：<b>¥{{ localizeNumber(previewProfit, locale) }}</b></div>
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="doShare">{{ t('distribute.shareBtn') }}</el-button>
        <el-button v-if="shareChannel === 'wechat'" type="success" plain @click="jumpTo('wechat')">{{ t('distribute.openWechat') }}</el-button>
        <el-button v-else type="primary" plain @click="jumpTo('qq')">{{ t('distribute.openQq') }}</el-button>
        <div v-if="lastShareText" class="share-preview">
          <pre>{{ lastShareText }}</pre>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dist-page { padding: 32px 48px; }
.page-head { margin-bottom: 20px; }
.page-head h1 { font-size: 26px; font-weight: 600; margin: 0 0 6px; }
.page-head p { color: var(--color-text-secondary); margin: 0; }
.pct-card { padding: 20px 24px; margin-bottom: 20px; }
.pct-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.pct-info p { margin: 4px 0 0; font-size: 13px; color: var(--color-text-secondary); }
.pct-controls { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.auto-switch { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.pct-slider { display: flex; align-items: center; gap: 12px; width: 260px; }
.pct-value { font-weight: 700; color: var(--color-primary); min-width: 44px; }
.section-title { font-size: 17px; margin: 22px 0 12px; }
.el-table { padding: 8px; }
.profit-num { color: var(--color-accent); font-weight: 700; }
.dlg-order { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; padding: 12px 16px; background: var(--color-bg-soft); border-radius: 8px; }
.dlg-order span { font-size: 13px; color: var(--color-text-secondary); }
.dlg-pct { display: flex; align-items: center; gap: 12px; width: 100%; }
.profit-preview { font-size: 14px; margin-top: 6px; }
.profit-preview b { color: var(--color-accent); font-size: 16px; }
.share-preview { margin-top: 14px; background: var(--color-bg-soft); border-radius: 8px; padding: 12px; }
.share-preview pre { margin: 0; font-size: 12px; white-space: pre-wrap; font-family: inherit; color: var(--color-text-regular); }
@media (max-width: 768px) { .dist-page { padding: 16px; } }
</style>
