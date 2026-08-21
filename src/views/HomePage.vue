<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mockProducts } from '@/mock/products'
import ProductCard from '@/components/ProductCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useHealthStore } from '@/stores/health'
import { localizeNumber, localizeDigits } from '@/utils/numbers'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const healthStore = useHealthStore()

const recommendedProducts = computed(() => mockProducts.slice(0, 4))

const stats = computed(() => [
  { value: t('home.usersCount'), icon: 'User' },
  { value: t('home.productsCount'), icon: 'Goods' },
  { value: t('home.countriesCount'), icon: 'Location' },
  { value: t('home.satisfaction'), icon: 'Trophy' },
])

const healthTips = [
  {
    zh: '春养肝，夏养心，秋养肺，冬养肾',
    en: 'Nourish liver in spring, heart in summer, lungs in autumn, kidneys in winter',
    icon: 'Sunny',
  },
  {
    zh: '起居有常，饮食有节，不妄作劳',
    en: 'Regular routine, moderate diet, avoid overexertion',
    icon: 'Clock',
  },
  {
    zh: '恬淡虚无，真气从之，精神内守，病安从来',
    en: 'Keep a tranquil mind, preserve vital energy, illness cannot take hold',
    icon: 'MagicStick',
  },
]

const currentTip = computed(() => {
  const tip = healthTips[0]
  return locale.value.startsWith('zh') ? tip.zh : tip.en
})
</script>

<template>
  <div class="home-page">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content qh-container">
        <div class="hero-text">
          <div class="hero-badge">
            <el-icon><Promotion /></el-icon>
            {{ t('common.appSlogan') }}
          </div>
          <h1 class="hero-title">
            {{ t('home.heroTitle') }}
            <span class="accent">{{ t('home.heroTitleAccent') }}</span>
          </h1>
          <p class="hero-subtitle">{{ t('home.heroSubtitle') }}</p>
          <div class="hero-actions">
            <button class="btn-primary" @click="router.push('/chat')">
              <el-icon><ChatDotRound /></el-icon>
              {{ t('home.startChat') }}
            </button>
            <button class="btn-secondary" @click="router.push('/shop')">
              <el-icon><ShoppingBag /></el-icon>
              {{ t('home.shopTitle') }}
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="visual-circle outer"></div>
          <div class="visual-circle middle"></div>
          <div class="visual-circle inner"></div>
          <div class="visual-icon">
            <svg viewBox="0 0 80 80" fill="none">
              <path d="M40 12 C28 24 28 44 40 68 C52 44 52 24 40 12Z" fill="currentColor" opacity="0.9"/>
              <circle cx="40" cy="32" r="6" fill="white" opacity="0.8"/>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- 数据统计 -->
    <section class="stats-section qh-container">
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.value" class="stat-item">
          <div class="stat-icon">
            <el-icon :size="22"><component :is="stat.icon" /></el-icon>
          </div>
          <span>{{ localizeDigits(stat.value, locale) }}</span>
        </div>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="section qh-container">
      <h2 class="section-title">{{ t('home.quickAccess') }}</h2>
      <div class="access-grid">
        <div class="access-card" @click="router.push('/chat')">
          <div class="access-icon" style="--card-color: #1a6b5c">
            <el-icon :size="28"><ChatDotRound /></el-icon>
          </div>
          <h3>{{ t('home.aiAgentTitle') }}</h3>
          <p>{{ t('home.aiAgentDesc') }}</p>
        </div>
        <div class="access-card" @click="router.push('/health/family')">
          <div class="access-icon" style="--card-color: #d4a853">
            <el-icon :size="28"><User /></el-icon>
          </div>
          <h3>{{ t('nav.family') }}</h3>
          <p>{{ t('home.familyDesc') }}</p>
        </div>
        <div class="access-card" @click="router.push('/shop')">
          <div class="access-icon" style="--card-color: #52a67a">
            <el-icon :size="28"><ShoppingBag /></el-icon>
          </div>
          <h3>{{ t('home.shopTitle') }}</h3>
          <p>{{ t('home.shopDesc') }}</p>
        </div>
      </div>
    </section>

    <!-- 健康概览（登录用户） -->
    <section v-if="authStore.isAuthenticated" class="section qh-container">
      <h2 class="section-title">{{ t('home.healthOverview') }}</h2>
      <div class="health-overview">
        <div class="health-card">
          <div class="health-card-header">
            <el-icon class="health-icon" :size="24"><TrendCharts /></el-icon>
            <span>{{ t('home.healthScore') }}</span>
          </div>
          <div class="health-score-value">{{ appStore.healthScore ? localizeNumber(appStore.healthScore, locale) : '--' }}</div>
          <el-progress
            :percentage="appStore.healthScore"
            :stroke-width="8"
            :show-text="false"
            color="#1a6b5c"
          />
        </div>
        <div class="health-card">
          <div class="health-card-header">
            <el-icon class="health-icon" :size="24"><User /></el-icon>
            <span>{{ t('nav.family') }}</span>
          </div>
          <div class="health-value">{{ t('home.familyCardCount', { count: localizeNumber(healthStore.familyMembers.length, locale) }) }}</div>
          <button class="health-action" @click="router.push('/health/family')">
            {{ t('home.familyManage') }}
          </button>
        </div>
        <div class="health-card">
          <div class="health-card-header">
            <el-icon class="health-icon" :size="24"><Bell /></el-icon>
            <span>{{ t('home.tipOfDay') }}</span>
          </div>
          <p class="health-tip-text">{{ currentTip }}</p>
        </div>
      </div>
    </section>

    <!-- 推荐商品 -->
    <section class="section qh-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">{{ t('home.recommendedProducts') }}</h2>
          <p class="section-subtitle">{{ t('home.recommendedSubtitle') }}</p>
        </div>
        <button class="see-all-btn" @click="router.push('/shop')">
          {{ t('common.seeAll') }}
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
      <div class="products-grid">
        <ProductCard v-for="product in recommendedProducts" :key="product.id" :product="product" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  padding-bottom: 32px;
}

/* Hero */
.hero {
  position: relative;
  overflow: hidden;
  padding: 64px 0;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-bg-soft) 0%, var(--color-bg) 100%);
}
.hero-bg::before {
  content: '';
  position: absolute;
  top: -200px;
  right: -100px;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(26, 107, 92, 0.08) 0%, transparent 70%);
}
.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 48px;
}
.hero-text {
  flex: 1;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(26, 107, 92, 0.08);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 24px;
}
.hero-title {
  font-size: 44px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text-primary);
  margin: 0 0 20px;
}
.hero-title .accent {
  color: var(--color-primary);
  position: relative;
}
.hero-title .accent::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  height: 8px;
  background: rgba(212, 168, 83, 0.2);
  z-index: -1;
  border-radius: 4px;
}
.hero-subtitle {
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-regular);
  margin: 0 0 32px;
  max-width: 520px;
}
.hero-actions {
  display: flex;
  gap: 16px;
}
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover {
  background: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 107, 92, 0.25);
}
.btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
.btn-secondary:hover {
  background: var(--color-primary);
  color: #fff;
  transform: translateY(-2px);
}

/* Hero 视觉 */
.hero-visual {
  position: relative;
  width: 360px;
  height: 360px;
  flex-shrink: 0;
}
.visual-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(26, 107, 92, 0.12);
}
.visual-circle.outer {
  inset: 0;
  animation: rotate 40s linear infinite;
}
.visual-circle.middle {
  inset: 40px;
  border-color: rgba(212, 168, 83, 0.2);
  animation: rotate 30s linear infinite reverse;
}
.visual-circle.inner {
  inset: 80px;
  background: linear-gradient(135deg, rgba(26, 107, 92, 0.06), rgba(212, 168, 83, 0.08));
}
.visual-icon {
  position: absolute;
  inset: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  animation: pulse 4s ease-in-out infinite;
}
@keyframes rotate {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.08); opacity: 1; }
}

/* Stats */
.stats-section {
  margin-top: -32px;
  position: relative;
  z-index: 2;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  background: var(--color-bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(26, 107, 92, 0.08);
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--color-bg-soft);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Section */
.section {
  padding: 48px 0 0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}
.section-title {
  font-size: 26px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}
.section-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 6px 0 0;
}
.see-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}
.see-all-btn:hover {
  background: var(--color-bg-soft);
}

/* 快捷入口 */
.access-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.access-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.access-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(26, 107, 92, 0.1);
  border-color: var(--card-color);
}
.access-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--card-color) 10%, transparent);
  color: var(--card-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.access-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--color-text-primary);
}
.access-card p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-regular);
  margin: 0;
}

/* 健康概览 */
.health-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.health-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
}
.health-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-regular);
  margin-bottom: 16px;
}
.health-icon {
  color: var(--color-primary);
}
.health-score-value {
  font-size: 40px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 12px;
}
.health-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}
.health-action {
  padding: 6px 14px;
  background: var(--color-bg-soft);
  color: var(--color-primary);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}
.health-action:hover {
  background: var(--color-primary);
  color: #fff;
}
.health-tip-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-regular);
  margin: 0;
  font-style: italic;
}

/* 商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .hero-visual {
    width: 280px;
    height: 280px;
  }
  .visual-icon { inset: 90px; }
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 768px) {
  .hero {
    padding: 32px 0;
  }
  .hero-content {
    flex-direction: column;
    text-align: center;
  }
  .hero-title {
    font-size: 30px;
  }
  .hero-actions {
    justify-content: center;
  }
  .hero-visual {
    display: none;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .stat-item {
    font-size: 13px;
  }
  .access-grid,
  .health-overview {
    grid-template-columns: 1fr;
  }
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .section-title {
    font-size: 22px;
  }
}
</style>
