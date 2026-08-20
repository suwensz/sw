<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const planned = [
  { icon: '🔑', title: 'API 密钥管理', desc: '创建 / 吊销 Open API 访问密钥，查看调用统计' },
  { icon: '🪝', title: 'Webhook 配置', desc: '订阅订单、库存、预警事件，推送到外部系统' },
  { icon: '🌐', title: 'i18n 翻译编辑器', desc: '12 语种文案在线编辑、缺失键检测、一键导出' },
  { icon: '📦', title: '构建发布', desc: 'Electron 多平台打包、版本管理、灰度发布' },
  { icon: '📋', title: '日志查看', desc: '应用运行日志、异常聚合、慢请求追踪' },
]
</script>

<template>
  <div class="dev-portal">
    <div class="dev-hero">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="hero-icon">
        <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" opacity="0.4" />
        <path d="M20 8 C14 14 14 22 20 32 C26 22 26 14 20 8Z" fill="currentColor" opacity="0.9" />
        <circle cx="20" cy="18" r="3" fill="white" opacity="0.8" />
      </svg>
      <h1>素衡OS · 开发端</h1>
      <p>{{ t('common.appSlogan') }} — Developer Portal（规划中）</p>
    </div>

    <div class="plan-grid">
      <div v-for="p in planned" :key="p.title" class="plan-card">
        <span class="plan-icon">{{ p.icon }}</span>
        <h3>{{ p.title }}</h3>
        <p>{{ p.desc }}</p>
      </div>
    </div>

    <p class="tip">开发端口 ：5300 · 待管理端与运营端稳定后启动开发</p>
  </div>
</template>

<style scoped>
.dev-portal {
  max-width: 860px;
  margin: 0 auto;
  padding: 64px 24px;
}

.dev-hero {
  text-align: center;
  margin-bottom: 40px;
}

.hero-icon {
  width: 48px;
  height: 48px;
  color: var(--color-primary);
}

.dev-hero h1 {
  margin: 12px 0 6px;
  font-size: 26px;
  color: var(--color-text-primary);
}

.dev-hero p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.plan-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 22px;
}

.plan-icon {
  font-size: 24px;
}

.plan-card h3 {
  margin: 10px 0 6px;
  font-size: 15px;
  color: var(--color-text-primary);
}

.plan-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-regular);
}

.tip {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
