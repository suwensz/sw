<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const menus = [
  { path: '/dashboard', title: '数据看板', icon: 'DataAnalysis' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/products', title: '商品管理', icon: 'Goods' },
  { path: '/orders', title: '订单管理', icon: 'List' },
  { path: '/content', title: '多语言内容审核', icon: 'DocumentChecked' },
  { path: '/settings', title: '系统设置', icon: 'Setting' },
]

const activeMenu = computed(() => '/' + String(route.path.split('/')[1] || 'dashboard'))
const pageTitle = computed(() => (route.meta.title as string) || '素衡OS 管理端')

function handleCommand(cmd: string) {
  if (cmd === 'logout') {
    auth.logout()
    router.push({ name: 'AdminLogin' })
  } else if (cmd === 'profile') {
    // 预留：个人资料
  }
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="brand-icon">
          <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" opacity="0.4" />
          <path d="M20 8 C14 14 14 22 20 32 C26 22 26 14 20 8Z" fill="currentColor" opacity="0.9" />
          <circle cx="20" cy="18" r="3" fill="white" opacity="0.8" />
        </svg>
        <div class="brand-text">
          <span class="brand-name">素衡OS</span>
          <span class="brand-portal">管理端</span>
        </div>
      </div>

      <el-menu
        class="sidebar-menu"
        :default-active="activeMenu"
        background-color="transparent"
        text-color="rgba(255,255,255,0.72)"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">v1.0.0 · Admin</div>
    </aside>

    <div class="admin-main">
      <header class="admin-header">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div class="header-actions">
          <LanguageSwitcher />
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-chip">
              <el-avatar :size="30" :src="auth.user?.avatar">{{ auth.user?.nickname?.charAt(0) }}</el-avatar>
              <span class="user-name">{{ auth.user?.nickname }}</span>
              <el-icon class="arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile" disabled>个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="admin-content">
        <RouterView v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

/* 侧边栏 */
.admin-sidebar {
  display: flex;
  flex-direction: column;
  width: 232px;
  flex-shrink: 0;
  background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  color: #fff;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
}

.brand-icon {
  width: 32px;
  height: 32px;
  color: var(--color-accent-light);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.brand-portal {
  font-size: 11px;
  opacity: 0.7;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  padding: 8px;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 44px;
  margin-bottom: 4px;
  border-radius: 8px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.14);
  font-weight: 600;
}

.sidebar-footer {
  padding: 14px 18px;
  font-size: 11px;
  opacity: 0.55;
}

/* 主区域 */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
}

.page-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}

.user-chip:hover {
  background: var(--color-bg-soft);
}

.user-name {
  font-size: 13px;
  color: var(--color-text-regular);
}

.arrow {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

@media (max-width: 860px) {
  .admin-sidebar {
    width: 64px;
  }
  .brand-text,
  .sidebar-footer,
  .sidebar-menu :deep(.el-menu-item span) {
    display: none;
  }
  .sidebar-menu :deep(.el-menu-item) {
    justify-content: center;
  }
}
</style>
