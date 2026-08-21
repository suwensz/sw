<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHealthStore } from '@/stores/health'
import { useAgentsStore } from '@/stores/agents'
import { tText } from '@/i18n'

/**
 * 中医健康概览（运营端）
 * 汇总家人健康、智能手表、健康预警与当年五运六气，
 * 并提供中医健康智能体与中医养生产品（电商展示）快捷入口。
 */
const { t } = useI18n()
const health = useHealthStore()
const agentsStore = useAgentsStore()

const stats = computed(() => ({
  members: health.familyMembers.length,
  watches: health.watches.length,
  unread: health.unreadCount,
  critical: health.criticalCount,
}))

const wuyun = computed(() => health.currentYearWuYun)

const tcmAgentsActive = computed(() => {
  const ids = ['constitution', 'health-alert', 'health-advice'] as const
  return ids.filter((id) => agentsStore.isActive(id)).length
})

const quickLinks = computed(() => [
  { to: '/tcm/alerts', icon: 'Warning', labelKey: 'portal.opsMenu.healthAlerts', descKey: 'portal.tcmOverview.goAlerts' },
  { to: '/tcm/family', icon: 'User', labelKey: 'portal.opsMenu.familyHealth', descKey: 'portal.tcmOverview.goFamily' },
  { to: '/tcm/watch', icon: 'Watch', labelKey: 'portal.opsMenu.smartWatch', descKey: 'portal.tcmOverview.goWatch' },
  { to: '/showcase', icon: 'Goods', labelKey: 'portal.opsMenu.ecomShowcase', descKey: 'portal.tcmOverview.goShowcase' },
])
</script>

<template>
  <div class="tcm-overview">
    <header class="tcm-hero">
      <div class="tcm-hero-text">
        <h1 class="tcm-hero-title">
          <el-icon :size="26" color="#d4a853"><FirstAidKit /></el-icon>
          {{ t('portal.tcmOverview.title') }}
        </h1>
        <p class="tcm-hero-subtitle">{{ t('portal.tcmOverview.subtitle') }}</p>
      </div>
      <el-tag type="success" effect="dark" size="large" round>
        {{ t('portal.agentsCenter.groupTcm') }} · {{ tcmAgentsActive }}/3
      </el-tag>
    </header>

    <!-- 统计卡片 -->
    <section class="tcm-stats">
      <div class="tcm-stat">
        <div class="tcm-stat-value">{{ stats.members }}</div>
        <div class="tcm-stat-label">{{ t('portal.tcmOverview.members') }}</div>
      </div>
      <div class="tcm-stat">
        <div class="tcm-stat-value">{{ stats.watches }}</div>
        <div class="tcm-stat-label">{{ t('portal.tcmOverview.watches') }}</div>
      </div>
      <div class="tcm-stat">
        <div class="tcm-stat-value" :class="{ 'is-warn': stats.unread > 0 }">{{ stats.unread }}</div>
        <div class="tcm-stat-label">{{ t('portal.tcmOverview.unreadAlerts') }}</div>
      </div>
      <div class="tcm-stat">
        <div class="tcm-stat-value" :class="{ 'is-danger': stats.critical > 0 }">{{ stats.critical }}</div>
        <div class="tcm-stat-label">{{ t('portal.tcmOverview.criticalAlerts') }}</div>
      </div>
    </section>

    <!-- 五运六气 -->
    <section class="tcm-card">
      <h2 class="tcm-card-title">
        <el-icon color="#b8860b"><Sunny /></el-icon>
        {{ t('portal.tcmOverview.wuyunTitle') }} · {{ wuyun.year }}（{{ wuyun.yearGan }}{{ wuyun.yearZhi }}）
      </h2>
      <div class="tcm-wuyun-grid">
        <div class="tcm-wuyun-item">
          <label>{{ t('portal.tcmOverview.siTian') }}</label>
          <span>{{ wuyun.siTian }}</span>
        </div>
        <div class="tcm-wuyun-item">
          <label>{{ t('portal.tcmOverview.zaiQuan') }}</label>
          <span>{{ wuyun.zaiQuan }}</span>
        </div>
        <div class="tcm-wuyun-item">
          <label>{{ t('portal.tcmOverview.climateRisk') }}</label>
          <span>{{ tText(wuyun.climateRisk) }}</span>
        </div>
        <div class="tcm-wuyun-item">
          <label>{{ t('portal.tcmOverview.susceptible') }}</label>
          <span>{{ wuyun.susceptibleOrgans.join(' · ') }}</span>
        </div>
      </div>
      <p class="tcm-wuyun-advice">{{ tText(wuyun.advice) }}</p>
    </section>

    <!-- 快捷入口 -->
    <section class="tcm-quick">
      <router-link v-for="link in quickLinks" :key="link.to" :to="link.to" class="tcm-quick-card">
        <div class="tcm-quick-icon">
          <el-icon :size="22" color="#1a6b5c"><component :is="link.icon" /></el-icon>
        </div>
        <div class="tcm-quick-body">
          <div class="tcm-quick-label">{{ t(link.labelKey) }}</div>
          <div class="tcm-quick-desc">{{ t(link.descKey) }}</div>
        </div>
        <el-icon color="#c0c4cc"><ArrowRight /></el-icon>
      </router-link>
    </section>
  </div>
</template>

<style scoped>
.tcm-overview {
  max-width: 1080px;
  margin: 0 auto;
  padding: 8px 4px 40px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.tcm-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 26px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6b4a1d, #8a5a2b);
  color: #faf8f3;
  box-shadow: 0 10px 28px rgba(107, 74, 29, 0.28);
}
.tcm-hero-text {
  flex: 1;
  min-width: 0;
}
.tcm-hero-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.tcm-hero-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(250, 248, 243, 0.78);
}
.tcm-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.tcm-stat {
  background: #ffffff;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tcm-stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #1a6b5c;
  line-height: 1.1;
}
.tcm-stat-value.is-warn {
  color: #e6a23c;
}
.tcm-stat-value.is-danger {
  color: #f56c6c;
}
.tcm-stat-label {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.tcm-card {
  background: #ffffff;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 14px;
  padding: 18px 20px;
}
.tcm-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.tcm-wuyun-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.tcm-wuyun-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tcm-wuyun-item label {
  font-size: 11px;
  color: var(--color-text-secondary, #909399);
}
.tcm-wuyun-item span {
  font-size: 14px;
  color: var(--color-text-regular, #606266);
}
.tcm-wuyun-advice {
  margin: 14px 0 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(184, 134, 11, 0.08);
  font-size: 13px;
  line-height: 1.7;
  color: #7a5a16;
}
.tcm-quick {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}
.tcm-quick-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 14px;
  text-decoration: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.tcm-quick-card:hover {
  border-color: rgba(26, 107, 92, 0.4);
  box-shadow: 0 6px 18px rgba(15, 43, 36, 0.1);
}
.tcm-quick-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 107, 92, 0.1);
}
.tcm-quick-body {
  flex: 1;
  min-width: 0;
}
.tcm-quick-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.tcm-quick-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
@media (max-width: 720px) {
  .tcm-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
