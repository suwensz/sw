<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const { t } = useI18n()

const STORAGE_NOTE = 'qh_return_policy_note'
const customNote = ref('')

onMounted(() => {
  customNote.value = localStorage.getItem(STORAGE_NOTE) || ''
})

function saveNote() {
  localStorage.setItem(STORAGE_NOTE, customNote.value)
  ElMessage.success(t('common.success'))
}

const regionPolicies = [
  {
    region: 'policy.regionSEA',
    icon: '🌏',
    days: 7,
    shipping: 'policy.shipSeller',
    refund: 'policy.refundFull',
  },
  {
    region: 'policy.regionME',
    icon: '🕌',
    days: 14,
    shipping: 'policy.shipBuyer',
    refund: 'policy.refundFull',
  },
  {
    region: 'policy.regionEU',
    icon: ' EU',
    days: 14,
    shipping: 'policy.shipSeller',
    refund: 'policy.refundFull',
  },
  {
    region: 'policy.regionGlobal',
    icon: '🌍',
    days: 30,
    shipping: 'policy.shipBuyer',
    refund: 'policy.refundPartial',
  },
]

const noReturnItems = ['policy.noReturnFood', 'policy.noReturnWorn', 'policy.noReturnCustom']
</script>

<template>
  <div class="policy-page qh-container">
    <div class="page-head">
      <h1>{{ t('policy.title') }}</h1>
      <p>{{ t('policy.subtitle') }}</p>
    </div>

    <!-- 分地区政策 -->
    <div class="region-grid">
      <div v-for="p in regionPolicies" :key="p.region" class="qh-card region-card">
        <div class="region-head">
          <span class="region-icon">{{ p.icon }}</span>
          <h3>{{ t(p.region) }}</h3>
        </div>
        <ul class="policy-list">
          <li><strong>{{ t('policy.returnWindow') }}</strong>{{ t('policy.days', { n: p.days }) }}</li>
          <li><strong>{{ t('policy.returnShipping') }}</strong>{{ t(p.shipping) }}</li>
          <li><strong>{{ t('policy.refundMethod') }}</strong>{{ t(p.refund) }}</li>
          <li><strong>{{ t('policy.refundTiming') }}</strong>{{ t('policy.refundTimingDesc') }}</li>
        </ul>
      </div>
    </div>

    <!-- 不支持退货 -->
    <div class="qh-card section-card">
      <h3>{{ t('policy.noReturnTitle') }}</h3>
      <div class="no-return-tags">
        <el-tag v-for="item in noReturnItems" :key="item" type="warning" effect="plain">{{ t(item) }}</el-tag>
      </div>
    </div>

    <!-- 退货流程 -->
    <div class="qh-card section-card">
      <h3>{{ t('policy.flowTitle') }}</h3>
      <el-steps :active="4" align-center finish-status="success">
        <el-step :title="t('policy.flow1')" :description="t('policy.flow1d')" />
        <el-step :title="t('policy.flow2')" :description="t('policy.flow2d')" />
        <el-step :title="t('policy.flow3')" :description="t('policy.flow3d')" />
        <el-step :title="t('policy.flow4')" :description="t('policy.flow4d')" />
      </el-steps>
    </div>

    <!-- 自定义补充条款 -->
    <div class="qh-card section-card">
      <h3>{{ t('policy.customTitle') }}</h3>
      <p class="custom-hint">{{ t('policy.customHint') }}</p>
      <el-input
        v-model="customNote"
        type="textarea"
        :rows="4"
        :placeholder="t('policy.customPlaceholder')"
        maxlength="500"
        show-word-limit
      />
      <el-button type="primary" style="margin-top: 12px" @click="saveNote">{{ t('common.save') }}</el-button>
    </div>
  </div>
</template>

<style scoped>
.policy-page { padding: 32px 48px; max-width: 1100px; margin: 0 auto; }
.page-head { margin-bottom: 20px; }
.page-head h1 { font-size: 26px; font-weight: 600; margin: 0 0 6px; }
.page-head p { color: var(--color-text-secondary); margin: 0; }
.region-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
.region-card { padding: 20px; }
.region-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.region-head h3 { margin: 0; font-size: 16px; }
.region-icon { font-size: 20px; }
.policy-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.policy-list li { font-size: 14px; color: var(--color-text-regular); line-height: 1.6; }
.policy-list strong { display: inline-block; min-width: 88px; color: var(--color-text-primary); font-weight: 600; }
.section-card { padding: 20px; margin-bottom: 20px; }
.section-card h3 { margin: 0 0 14px; font-size: 16px; }
.no-return-tags { display: flex; gap: 10px; flex-wrap: wrap; }
.custom-hint { font-size: 13px; color: var(--color-text-secondary); margin: 0 0 10px; }
@media (max-width: 900px) {
  .policy-page { padding: 16px; }
  .region-grid { grid-template-columns: 1fr; }
}
</style>
