<script setup lang="ts">
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="auth-layout">
    <!-- 左侧品牌展示区 -->
    <div class="auth-brand">
      <div class="brand-overlay"></div>
      <div class="brand-content">
        <div class="brand-logo">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" opacity="0.4" />
            <path
              d="M20 8 C14 14 14 22 20 32 C26 22 26 14 20 8Z"
              fill="currentColor"
              opacity="0.9"
            />
            <circle cx="20" cy="18" r="3" fill="white" opacity="0.8" />
          </svg>
          <span class="brand-name">素衡OS</span>
        </div>
        <h1 class="brand-title">中医智慧<br />全球健康</h1>
        <p class="brand-desc">
          融合千年中医智慧与现代科技，为全球用户提供个性化健康管理与正宗中医药产品
        </p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>AI 中医智能体 7×24 在线</span>
          </div>
          <div class="feature-item">
            <el-icon><UserFilled /></el-icon>
            <span>家庭健康管理与预警</span>
          </div>
          <div class="feature-item">
            <el-icon><Van /></el-icon>
            <span>正宗中药全球直邮</span>
          </div>
        </div>
      </div>
      <div class="lang-switch">
        <LanguageSwitcher />
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-form-area">
      <div class="auth-form-container">
        <slot name="form-header" />
        <div class="form-title-block">
          <h2>{{ title }}</h2>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
        <slot />
        <div class="auth-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
}

/* 左侧品牌区 */
.auth-brand {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 60%, var(--color-primary-light) 100%);
  color: #fff;
  overflow: hidden;
}

.auth-brand::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 168, 83, 0.15) 0%, transparent 70%);
}

.auth-brand::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: -80px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
}

.brand-content {
  position: relative;
  z-index: 1;
  max-width: 420px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}
.brand-logo svg {
  width: 40px;
  height: 40px;
  color: var(--color-accent);
}
.brand-name {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 2px;
}

.brand-title {
  font-size: 40px;
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 20px;
}
.brand-desc {
  font-size: 15px;
  line-height: 1.8;
  opacity: 0.85;
  margin: 0 0 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  opacity: 0.9;
}
.feature-item .el-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent-light);
}

.lang-switch {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
}
.lang-switch :deep(.lang-trigger) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.lang-switch :deep(.lang-trigger:hover) {
  background: rgba(255, 255, 255, 0.2);
}

/* 右侧表单区 */
.auth-form-area {
  width: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  background: var(--color-bg);
  overflow-y: auto;
}

.auth-form-container {
  width: 100%;
  max-width: 380px;
}

.form-title-block {
  margin-bottom: 32px;
}
.form-title-block h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}
.form-title-block p {
  font-size: 14px;
  color: var(--color-text-regular);
  margin: 0;
  line-height: 1.6;
}

.auth-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* 响应式 */
@media (max-width: 960px) {
  .auth-brand {
    display: none;
  }
  .auth-form-area {
    width: 100%;
    padding: 32px 20px;
  }
}
</style>
