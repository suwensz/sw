<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Monitor } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useHealthStore } from '@/stores/health'
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
const activeGroup = ref<'health' | 'commerce'>(
  (route.meta.group as 'health' | 'commerce') || 'health',
)

const healthNavItems = computed(() => [
  { name: 'Home', label: t('nav.home'), path: '/' },
  { name: 'Chat', label: t('nav.chat'), path: '/chat' },
  { name: 'HealthAlerts', label: t('nav.alerts'), path: '/health/alerts', badge: healthStore.unreadCount },
  { name: 'Family', label: t('nav.family'), path: '/health/family' },
  { name: 'Watch', label: t('nav.watch'), path: '/health/watch' },
])

const commerceNavItems = computed(() => [
  { name: 'Shop', label: t('nav.shop'), path: '/shop' },
  { name: 'Competitor', label: t('nav.competitor'), path: '/ops/competitor' },
  { name: 'Supply', label: t('nav.supply'), path: '/ops/supply' },
  { name: 'Demand', label: t('nav.demand'), path: '/ops/demand' },
  { name: 'Creative', label: t('nav.creative'), path: '/ops/creative' },
  { name: 'Listing', label: t('nav.listing'), path: '/ops/listing' },
])

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigate(path: string) {
  mobileMenuOpen.value = false
  router.push(path)
}

function switchGroup(group: 'health' | 'commerce') {
  activeGroup.value = group
  const items = group === 'health' ? healthNavItems.value : commerceNavItems.value
  const current = items.find((i) => isActive(i.path))
  if (current) {
    navigate(current.path)
  } else {
    navigate(items[0].path)
  }
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
  } else if (to.meta.group === 'health') {
    activeGroup.value = 'health'
  }
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

        <!-- 双导航组切换（最左侧） -->
        <div class="group-switcher">
          <button
            :class="['group-btn', { active: activeGroup === 'health' }]"
            @click="switchGroup('health')"
          >
            <el-icon><FirstAidKit /></el-icon>
            <span>{{ t('dualNav.healthGroup') }}</span>
          </button>
          <button
            :class="['group-btn commerce', { active: activeGroup === 'commerce' }]"
            @click="switchGroup('commerce')"
          >
            <el-icon><Goods /></el-icon>
            <span>{{ t('dualNav.commerceGroup') }}</span>
          </button>
        </div>

        <div class="top-actions">
          <div class="spacer"></div>

          <LanguageSwitcher />

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

    <!-- 二级导航栏：左侧为当前组导航，右上角保持全局操作 -->
    <div class="sub-nav">
      <div class="sub-nav-inner qh-container">
        <nav class="desktop-nav">
          <button
            v-for="item in (activeGroup === 'health' ? healthNavItems : commerceNavItems)"
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

    <!-- 移动端抽屉 -->
    <transition name="slide-down">
      <div v-if="mobileMenuOpen" class="mobile-drawer">
        <div class="mobile-group-tabs">
          <button :class="{ active: activeGroup === 'health' }" @click="activeGroup = 'health'">
            {{ t('dualNav.healthGroup') }}
          </button>
          <button :class="{ active: activeGroup === 'commerce' }" @click="activeGroup = 'commerce'">
            {{ t('dualNav.commerceGroup') }}
          </button>
        </div>
        <button
          v-for="item in (activeGroup === 'health' ? healthNavItems : commerceNavItems)"
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
  .sub-nav { display: none; }
  .mobile-menu-btn { display: flex; }
  .logo-sub { display: none; }
  .logo-text { font-size: 16px; }
  .mobile-drawer { top: 56px; }
  .top-actions { gap: 4px; }
}
</style>
