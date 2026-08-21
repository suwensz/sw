<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <footer class="main-footer">
    <div class="footer-inner qh-container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <svg viewBox="0 0 40 40" fill="none" class="logo-icon">
              <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" opacity="0.3" />
              <path d="M20 8 C14 14 14 22 20 32 C26 22 26 14 20 8Z" fill="currentColor" />
              <circle cx="20" cy="18" r="3" fill="white" opacity="0.8" />
            </svg>
            <span>素衡OS</span>
          </div>
          <p class="footer-desc">{{ t('footer.aboutDesc') }}</p>
        </div>
        <div class="footer-col">
          <h4>{{ t('footer.quickLinks') }}</h4>
          <router-link to="/">{{ t('nav.home') }}</router-link>
          <router-link to="/chat">{{ t('nav.chat') }}</router-link>
          <router-link to="/health/family">{{ t('nav.family') }}</router-link>
          <router-link to="/shop">{{ t('nav.shop') }}</router-link>
        </div>
        <div class="footer-col">
          <h4>{{ t('footer.customerService') }}</h4>
          <a href="#">{{ t('footer.helpCenter') }}</a>
          <a href="#">{{ t('footer.shippingInfo') }}</a>
          <a href="#">{{ t('footer.returns') }}</a>
          <a href="#">{{ t('footer.contactUs') }}</a>
        </div>
        <div class="footer-col">
          <h4>{{ t('footer.followUs') }}</h4>
          <div class="social-icons">
            <a href="#" class="social-icon"><el-icon><ChatDotRound /></el-icon></a>
            <a href="#" class="social-icon"><el-icon><Promotion /></el-icon></a>
            <a href="#" class="social-icon"><el-icon><Message /></el-icon></a>
          </div>
          <p class="newsletter-desc">{{ t('footer.newsletterDesc') }}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>{{ t('footer.rightsReserved') }}</p>
        <p class="disclaimer">{{ t('footer.disclaimer') }}</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.main-footer {
  background: var(--color-primary-dark);
  color: rgba(255, 255, 255, 0.8);
  margin-top: 64px;
}
.footer-inner {
  padding: 48px 48px 24px;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
}
.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--color-accent-light);
}
.footer-desc {
  font-size: 13px;
  line-height: 1.8;
  opacity: 0.7;
  margin: 0;
}
.footer-col h4 {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px;
}
.footer-col a {
  display: block;
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  margin-bottom: 10px;
  transition: color 0.2s;
}
.footer-col a:hover {
  color: var(--color-accent-light);
}
.social-icons {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.social-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background 0.2s;
}
.social-icon:hover {
  background: var(--color-accent);
}
.newsletter-desc {
  font-size: 13px;
  opacity: 0.65;
  line-height: 1.6;
}
.footer-bottom {
  padding-top: 20px;
  text-align: center;
  font-size: 12px;
  opacity: 0.6;
}
.footer-bottom p {
  margin: 4px 0;
}
.disclaimer {
  font-size: 11px;
  opacity: 0.5;
}
@media (max-width: 768px) {
  .footer-inner {
    padding: 32px 16px 16px;
  }
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }
  .footer-brand {
    grid-column: 1 / -1;
  }
}
</style>
