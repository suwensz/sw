<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const plans = [
  {
    key: 'planFree',
    price: '¥0',
    period: '/月',
    calls: '10 万次/月',
    features: ['基础接口调用', '沙箱环境', '社区支持', '1 个应用'],
    current: true,
  },
  {
    key: 'planPro',
    price: '¥299',
    period: '/月',
    calls: '500 万次/月',
    features: ['全部接口调用', 'Webhook 推送', '调用审计', '工单支持', '5 个应用'],
    current: false,
    hot: true,
  },
  {
    key: 'planEnterprise',
    price: '¥1,999',
    period: '/月',
    calls: '不限调用量',
    features: ['专属资源池', 'SLA 保障', '定制化接入', '专属客服', '不限应用数'],
    current: false,
  },
]

function upgrade(name: string) {
  ElMessage.success(`已提交 ${name} 套餐升级申请`)
}
</script>

<template>
  <div class="portal-page">
    <h2>{{ t('dev.menu.quota') }}</h2>
    <p class="portal-stat-desc">选择适合你的调用套餐，按需弹性扩展。</p>

    <div class="plan-grid">
      <div
        v-for="plan in plans"
        :key="plan.key"
        class="plan-card"
        :class="{ current: plan.current, hot: plan.hot }"
      >
        <div v-if="plan.hot" class="plan-badge">推荐</div>
        <div class="plan-name">{{ t(`dev.quota.${plan.key}`) }}</div>
        <div class="plan-price">
          {{ plan.price }}<span class="plan-period">{{ plan.period }}</span>
        </div>
        <div class="plan-calls">{{ plan.calls }}</div>
        <ul class="plan-features">
          <li v-for="f in plan.features" :key="f">{{ f }}</li>
        </ul>
        <el-button
          :type="plan.current ? 'info' : 'primary'"
          style="width: 100%"
          :disabled="plan.current"
          @click="upgrade(t(`dev.quota.${plan.key}`))"
        >
          {{ plan.current ? t('dev.quota.currentPlan') : t('dev.quota.upgrade') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  max-width: 900px;
}
.plan-card {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 22px;
  background: var(--color-bg-card);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.plan-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(26, 107, 92, 0.14);
}
.plan-card.hot {
  border-color: #d4a853;
  box-shadow: 0 0 0 2px rgba(212, 168, 83, 0.25);
}
.plan-card.current {
  opacity: 0.92;
}
.plan-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background: #d4a853;
  color: #124d42;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 12px;
  border-radius: 999px;
}
.plan-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary-dark);
}
.plan-price {
  font-size: 30px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 10px 0 2px;
}
.plan-period {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 400;
}
.plan-calls {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}
.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}
.plan-features li {
  font-size: 13px;
  color: var(--color-text-regular);
  padding: 4px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.plan-features li::before {
  content: '✓';
  color: var(--color-primary);
  font-weight: 700;
}
</style>
