<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Monitor,
  // 电商分类 & 子项图标
  Goods, ShoppingCart, Upload, VideoCamera, DataAnalysis, TrendCharts,
  DataLine, Connection, Box, List, Share, Van, Refresh, Document,
  ArrowDown, FirstAidKit, Tickets, Check,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useHealthStore } from '@/stores/health'
import SocialSwitcher from '@/components/SocialSwitcher.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()
const healthStore = useHealthStore()

const isWeb = ref(true)
onMounted(() => {
  isWeb.value = !window.suhengOS?.isDesktop
})

const mobileMenuOpen = ref(false)
const userDropdown = ref(false)
const activeGroup = ref<'health' | 'commerce' | 'domestic'>(
  (route.meta.group as 'health' | 'commerce' | 'domestic') || 'health',
)
// 「电商」组内上次访问的子板块（跨境 / 国内）
const lastCommerceGroup = ref<'commerce' | 'domestic'>(
  route.meta.group === 'domestic' ? 'domestic' : 'commerce',
)

const healthNavItems = computed(() => [
  { name: 'Home', label: t('nav.home'), path: '/' },
  { name: 'Chat', label: t('nav.chat'), path: '/chat' },
  { name: 'HealthAlerts', label: t('nav.alerts'), path: '/health/alerts', badge: healthStore.unreadCount },
  { name: 'Family', label: t('nav.family'), path: '/health/family' },
  { name: 'Watch', label: t('nav.watch'), path: '/health/watch' },
])

/** 跨境电商 4 大分类（mega menu） */
const commerceCategories = computed(() => [
  {
    id: 'products',
    icon: Goods,
    label: t('nav.categoryProducts'),
    items: [
      { name: 'Shop', label: t('nav.shop'), icon: ShoppingCart, path: '/shop' },
      { name: 'Sell', label: t('shop.sellNow'), icon: Upload, path: '/sell' },
      { name: 'Creative', label: t('nav.creative'), icon: VideoCamera, path: '/ops/creative' },
      { name: 'Listing', label: t('nav.listing'), icon: FirstAidKit, path: '/ops/listing' },
    ],
  },
  {
    id: 'ops',
    icon: DataAnalysis,
    label: t('nav.categoryOps'),
    items: [
      { name: 'Competitor', label: t('nav.competitor'), icon: TrendCharts, path: '/ops/competitor' },
      { name: 'Supply', label: t('nav.supply'), icon: Connection, path: '/ops/supply' },
      { name: 'Demand', label: t('nav.demand'), icon: DataLine, path: '/ops/demand' },
      { name: 'Procurement', label: t('nav.procurement'), icon: Box, path: '/ops/procurement' },
    ],
  },
  {
    id: 'orders',
    icon: List,
    label: t('nav.categoryOrders'),
    items: [
      { name: 'MyOrders', label: t('nav.myOrders'), icon: Tickets, path: '/ops/my-orders' },
      { name: 'Distribute', label: t('nav.distribute'), icon: Share, path: '/ops/distribute' },
      { name: 'Logistics', label: t('nav.logistics'), icon: Van, path: '/ops/logistics' },
    ],
  },
  {
    id: 'aftersales',
    icon: Refresh,
    label: t('nav.categoryAftersales'),
    items: [
      { name: 'Returns', label: t('nav.returns'), icon: Refresh, path: '/ops/returns' },
      { name: 'ReturnPolicy', label: t('nav.returnPolicy'), icon: Document, path: '/ops/return-policy' },
    ],
  },
])

/** mega menu 状态：当前展开的分类 id */
const openCategoryId = ref<string | null>(null)
const subNavRef = ref<HTMLElement | null>(null)

function toggleCategory(id: string) {
  openCategoryId.value = openCategoryId.value === id ? null : id
}
function closeCategory() {
  openCategoryId.value = null
}
function isCategoryActive(catId: string) {
  const cat = commerceCategories.value.find((c) => c.id === catId)
  if (!cat) return false
  return cat.items.some((i) => isActive(i.path))
}

const domesticNavItems = computed(() => [
  { name: 'DomesticDashboard', label: t('nav.domesticDashboard'), path: '/domestic/dashboard' },
  { name: 'DomesticProducts', label: t('nav.domesticProducts'), path: '/domestic/products' },
  { name: 'DomesticOrders', label: t('nav.domesticOrders'), path: '/domestic/orders' },
])

/** 保留供 switchGroup 兜底跳转使用（聚合后的子项平铺） */
const commerceNavItems = computed(() =>
  commerceCategories.value.flatMap((c) => c.items),
)

const currentNavItems = computed(() => {
  if (activeGroup.value === 'health') return healthNavItems.value
  if (activeGroup.value === 'commerce') return commerceNavItems.value
  return domesticNavItems.value
})

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigate(path: string) {
  mobileMenuOpen.value = false
  closeCategory()
  router.push(path)
}

function switchGroup(group: 'health' | 'commerce' | 'domestic') {
  activeGroup.value = group
  if (group === 'commerce' || group === 'domestic') {
    lastCommerceGroup.value = group
  }
  closeCategory()
  const items = group === 'health' ? healthNavItems.value
    : group === 'commerce' ? commerceNavItems.value
    : domesticNavItems.value
  const current = items.find((i) => isActive(i.path))
  if (current) {
    navigate(current.path)
  } else {
    navigate(items[0].path)
  }
}

/** 「电商」组：回到上次访问的子板块（跨境 / 国内） */
function switchCommerce() {
  switchGroup(lastCommerceGroup.value)
}

function handleLogout() {
  authStore.logout()
  mobileMenuOpen.value = false
  router.push('/login')
}

// 同步当前路由所属分组
router.afterEach((to) => {
  if (to.meta.group === 'commerce') {
    activeGroup.value = 'commerce'
    lastCommerceGroup.value = 'commerce'
  } else if (to.meta.group === 'domestic') {
    activeGroup.value = 'domestic'
    lastCommerceGroup.value = 'domestic'
  } else if (to.meta.group === 'health') {
    activeGroup.value = 'health'
  }
  closeCategory()
})

// 点击外部关闭 mega menu
function onDocClick(e: MouseEvent) {
  if (subNavRef.value && !subNavRef.value.contains(e.target as Node)) {
    closeCategory()
  }
}
onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onDocClick)
})
</script>

<template>
  <header class="main-header">
    <!-- 顶部条：Logo + 全局工具 -->
    <div class="top-bar">
      <div class="top-bar-inner qh-container">
        <div class="logo" @click="navigate('/')">
          <svg viewBox="0 0 40 40" fill="none" class="logo-icon">
            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" opacity="0.3" />
            <path d="M20 8 C14 14 14 22 20 32 C26 22 26 14 20 8Z" fill="currentColor" />
            <circle cx="20" cy="18" r="3" fill="white" opacity="0.8" />
          </svg>
          <span class="logo-text">素衡OS</span>
          <span class="logo-sub">Suheng OS</span>
        </div>

        <!-- 导航组切换：中医健康 / 电商（跨境+国内整合） -->
        <div class="group-switcher">
          <button
            :class="['group-btn', { active: activeGroup === 'health' }]"
            @click="switchGroup('health')"
          >
            <el-icon><FirstAidKit /></el-icon>
            <span>{{ t('dualNav.healthGroup') }}</span>
          </button>
          <button
            :class="['group-btn commerce', { active: activeGroup !== 'health' }]"
            @click="switchCommerce()"
          >
            <el-icon><Goods /></el-icon>
            <span>{{ t('dualNav.ecommerceGroup') }}</span>
          </button>
        </div>

        <div class="top-actions">
          <div class="spacer"></div>

          <!-- 多语言选择栏（大陆 / 港澳 / 中东 / 东南亚 / 国际） -->
          <LanguageSwitcher />

          <SocialSwitcher />

          <a
            v-if="isWeb"
            class="download-btn"
            href="/downloads/SuhengOS-Setup-1.0.0.exe"
            download="SuhengOS-Setup-1.0.0.exe"
            title="下载素衡OS Windows 桌面版（双击安装）"
          >
            <el-icon :size="16"><Monitor /></el-icon>
            <span>{{ t('nav.downloadApp') }}</span>
          </a>

          <button class="icon-btn cart-btn" @click="navigate('/cart')">
            <el-icon :size="20"><ShoppingCart /></el-icon>
            <span v-if="cartStore.totalItems > 0" class="cart-badge">{{ cartStore.totalItems }}</span>
          </button>

          <el-dropdown v-if="authStore.isAuthenticated" trigger="click" @command="(cmd: string) => cmd === 'logout' ? handleLogout() : navigate(cmd)">
            <div class="user-avatar">
              <img :src="authStore.user?.avatar" alt="avatar" />
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="/profile">
                  <el-icon><User /></el-icon>{{ t('nav.profile') }}
                </el-dropdown-item>
                <el-dropdown-item command="/cart">
                  <el-icon><ShoppingCart /></el-icon>{{ t('nav.cart') }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>{{ t('nav.logout') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <button v-else class="login-btn" @click="navigate('/login')">
            {{ t('auth.login') }}
          </button>

          <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
            <el-icon :size="22">
              <component :is="mobileMenuOpen ? 'Close' : 'Menu'" />
            </el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 二级导航栏：电商组内先切「跨境 / 国内」，再展示对应导航 -->
    <div class="sub-nav-wrap" ref="subNavRef">
      <div class="sub-nav">
        <div class="sub-nav-inner qh-container">
          <div v-if="activeGroup !== 'health'" class="commerce-tabs">
            <button
              :class="{ active: activeGroup === 'commerce' }"
              @click="switchGroup('commerce')"
            >
              {{ t('dualNav.crossTab') }}
            </button>
            <button
              :class="{ active: activeGroup === 'domestic' }"
              @click="switchGroup('domestic')"
            >
              {{ t('dualNav.domesticTab') }}
            </button>
          </div>
          <span v-if="activeGroup !== 'health'" class="tabs-divider"></span>

          <!-- 跨境电商：4 分类 mega menu 触发器 -->
          <nav v-if="activeGroup === 'commerce'" class="category-nav">
            <button
              v-for="cat in commerceCategories"
              :key="cat.id"
              :class="['cat-trigger', { active: isCategoryActive(cat.id) || openCategoryId === cat.id }]"
              @click.stop="toggleCategory(cat.id)"
            >
              <el-icon :size="15" class="cat-icon"><component :is="cat.icon" /></el-icon>
              <span>{{ cat.label }}</span>
              <el-icon :size="11" class="chevron"><ArrowDown /></el-icon>
            </button>
          </nav>

          <!-- 国内电商：3 项直接平铺 -->
          <nav v-else-if="activeGroup === 'domestic'" class="desktop-nav">
            <button
              v-for="item in domesticNavItems"
              :key="item.name"
              :class="['nav-item', { active: isActive(item.path) }]"
              @click="navigate(item.path)"
            >
              {{ item.label }}
            </button>
          </nav>

          <!-- 中医健康组：保持原 nav-items -->
          <nav v-else class="desktop-nav">
            <button
              v-for="item in healthNavItems"
              :key="item.name"
              :class="['nav-item', { active: isActive(item.path) }]"
              @click="navigate(item.path)"
            >
              {{ item.label }}
              <span v-if="'badge' in item && item.badge" class="nav-badge">{{ item.badge }}</span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Mega Menu 面板 -->
      <transition name="mega">
        <div v-if="activeGroup === 'commerce' && openCategoryId" class="mega-menu" @click.stop>
          <div class="mega-inner qh-container">
            <template v-for="cat in commerceCategories" :key="cat.id">
              <div v-if="cat.id === openCategoryId" class="mega-panel">
                <div class="mega-header">
                  <el-icon :size="18"><component :is="cat.icon" /></el-icon>
                  <span class="mega-title">{{ cat.label }}</span>
                  <span class="mega-count">{{ cat.items.length }} 项</span>
                </div>
                <div class="mega-grid">
                  <button
                    v-for="item in cat.items"
                    :key="item.name"
                    :class="['mega-item', { active: isActive(item.path) }]"
                    @click="navigate(item.path)"
                  >
                    <span class="mega-item-icon">
                      <el-icon :size="20"><component :is="item.icon" /></el-icon>
                    </span>
                    <span class="mega-item-label">{{ item.label }}</span>
                    <el-icon v-if="isActive(item.path)" :size="14" class="mega-item-check"><component :is="Check" /></el-icon>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </transition>
    </div>

    <!-- 移动端抽屉 -->
    <transition name="slide-down">
      <div v-if="mobileMenuOpen" class="mobile-drawer">
        <div class="mobile-group-tabs">
          <button :class="{ active: activeGroup === 'health' }" @click="switchGroup('health')">
            {{ t('dualNav.healthGroup') }}
          </button>
          <button :class="{ active: activeGroup !== 'health' }" @click="switchCommerce()">
            {{ t('dualNav.ecommerceGroup') }}
          </button>
        </div>
        <div v-if="activeGroup !== 'health'" class="mobile-commerce-tabs">
          <button :class="{ active: activeGroup === 'commerce' }" @click="switchGroup('commerce')">
            {{ t('dualNav.crossTab') }}
          </button>
          <button :class="{ active: activeGroup === 'domestic' }" @click="switchGroup('domestic')">
            {{ t('dualNav.domesticTab') }}
          </button>
        </div>
        <button
          v-for="item in currentNavItems"
          :key="item.name"
          :class="['mobile-nav-item', { active: isActive(item.path) }]"
          @click="navigate(item.path)"
        >
          {{ item.label }}
          <span v-if="'badge' in item && item.badge" class="nav-badge">{{ item.badge }}</span>
        </button>
        <button v-if="authStore.isAuthenticated" class="mobile-nav-item" @click="navigate('/profile')">
          {{ t('nav.profile') }}
        </button>
        <button v-if="authStore.isAuthenticated" class="mobile-nav-item logout" @click="handleLogout">
          {{ t('nav.logout') }}
        </button>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.main-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(250, 248, 243, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.top-bar {
  height: 56px;
  border-bottom: 1px solid rgba(232, 226, 214, 0.6);
}
.top-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 16px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--color-primary);
  flex-shrink: 0;
}
.logo-icon { width: 32px; height: 32px; }
.logo-text {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--color-primary);
}
.logo-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
  margin-left: 2px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}

.group-switcher {
  display: flex;
  gap: 4px;
  background: var(--color-bg-soft);
  padding: 4px;
  border-radius: 10px;
}
.group-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-regular);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}
.group-btn:hover { color: var(--color-primary); }
.group-btn.active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(26, 107, 92, 0.2);
}
.group-btn.commerce.active {
  background: var(--color-accent);
  box-shadow: 0 2px 8px rgba(212, 168, 83, 0.25);
}
.group-btn.domestic.active {
  background: #e2231a;
  box-shadow: 0 2px 8px rgba(226, 35, 26, 0.25);
}
.spacer { flex: 0.3; }

.icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--color-text-regular);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: var(--color-bg-soft);
  color: var(--color-primary);
}
.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}
.download-btn:hover {
  background: var(--color-primary-light);
  transform: translateY(-1px);
}
.cart-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  background: var(--color-danger);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wake-btn.active {
  color: var(--color-primary);
  background: rgba(26, 107, 92, 0.08);
}
.commerce-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 2px;
  margin-right: 10px;
  flex-shrink: 0;
  align-self: center;
}
.commerce-tabs button {
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-regular);
  padding: 4px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.commerce-tabs button.active {
  background: var(--color-accent);
  color: #fff;
}
.tabs-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin-right: 10px;
  flex-shrink: 0;
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--color-border);
  transition: border-color 0.2s;
}
.user-avatar:hover { border-color: var(--color-primary); }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

.login-btn {
  padding: 7px 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.login-btn:hover { background: var(--color-primary-light); }

/* 二级导航 */
.sub-nav-wrap {
  position: relative;
}
.sub-nav {
  height: 44px;
  background: rgba(255, 255, 255, 0.6);
}
.sub-nav-inner {
  display: flex;
  align-items: center;
  height: 100%;
}
.desktop-nav {
  display: flex;
  gap: 4px;
  height: 100%;
}

/* 分类触发器（mega menu 入口） */
.category-nav {
  display: flex;
  gap: 2px;
  height: 100%;
  align-items: center;
}
.cat-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  background: none;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text-regular);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  height: 34px;
  position: relative;
  white-space: nowrap;
}
.cat-trigger:hover {
  color: var(--color-primary);
  background: rgba(26, 107, 92, 0.06);
}
.cat-trigger.active {
  color: var(--color-primary);
  background: rgba(212, 168, 83, 0.12);
  font-weight: 600;
}
.cat-trigger.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 14px;
  right: 14px;
  height: 2px;
  background: var(--color-accent);
  border-radius: 1px;
}
.cat-trigger .cat-icon {
  color: var(--color-accent);
}
.cat-trigger.active .cat-icon {
  color: var(--color-primary);
}
.cat-trigger .chevron {
  opacity: 0.5;
  transition: transform 0.2s;
}
.cat-trigger.active .chevron {
  transform: rotate(180deg);
  opacity: 0.9;
}

/* Mega Menu 面板 */
.mega-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  z-index: 99;
  padding: 18px 0 22px;
}
.mega-inner {
  display: block;
}
.mega-panel {
  display: block;
}
.mega-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--color-border);
  margin-bottom: 14px;
  color: var(--color-primary);
}
.mega-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.mega-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-soft);
  padding: 2px 10px;
  border-radius: 999px;
}
.mega-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.mega-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-bg-soft);
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.18s;
  text-align: left;
  position: relative;
}
.mega-item:hover {
  background: rgba(26, 107, 92, 0.06);
  border-color: rgba(26, 107, 92, 0.2);
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 107, 92, 0.1);
}
.mega-item.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 14px rgba(26, 107, 92, 0.3);
}
.mega-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(212, 168, 83, 0.15);
  color: var(--color-accent);
  flex-shrink: 0;
}
.mega-item.active .mega-item-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.mega-item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mega-item-check {
  color: #fff;
  flex-shrink: 0;
}

/* Mega 动画 */
.mega-enter-active,
.mega-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top center;
}
.mega-enter-from,
.mega-leave-to {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.96);
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--color-text-regular);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  height: 100%;
}
.nav-item:hover {
  color: var(--color-primary);
  background: rgba(26, 107, 92, 0.05);
}
.nav-item.active {
  color: var(--color-primary);
  font-weight: 600;
}
.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 14px;
  right: 14px;
  height: 2px;
  background: var(--color-accent);
  border-radius: 1px;
}
.nav-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mobile-menu-btn {
  display: none;
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  align-items: center;
  justify-content: center;
}

.mobile-drawer {
  position: absolute;
  top: 100px;
  left: 0;
  right: 0;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mobile-group-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--color-border);
}
.mobile-group-tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: var(--color-bg-soft);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-regular);
  cursor: pointer;
}
.mobile-group-tabs button.active {
  background: var(--color-primary);
  color: #fff;
}
.mobile-commerce-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--color-border);
}
.mobile-commerce-tabs button {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-regular);
  cursor: pointer;
}
.mobile-commerce-tabs button.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}
.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border: none;
  background: none;
  text-align: left;
  font-size: 15px;
  color: var(--color-text-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}
.mobile-nav-item:hover,
.mobile-nav-item.active {
  background: var(--color-bg-soft);
  color: var(--color-primary);
}
.mobile-nav-item.logout {
  color: var(--color-danger);
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
  border-radius: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 900px) {
  .group-switcher { display: none; }
  .spacer { display: none; }
}
@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .category-nav { display: none; }
  .sub-nav { display: none; }
  .mega-menu { display: none; }
  .mobile-menu-btn { display: flex; }
  .logo-sub { display: none; }
  .logo-text { font-size: 16px; }
  .mobile-drawer { top: 56px; }
  .top-actions { gap: 4px; }
}
</style>
