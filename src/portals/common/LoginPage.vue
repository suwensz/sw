<script setup lang="ts">
import { computed, inject, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useAuthStore, type AuthProvider } from '@/stores/auth'
import { FALLBACK_PORTAL_META, PORTAL_META_KEY } from '@/portals/common/portalMeta'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

/** 当前门户元信息，由各端 App.vue provide，登录页据此显示对应品牌 */
const portalMeta = inject(PORTAL_META_KEY, FALLBACK_PORTAL_META)

type Mode = 'login' | 'register'
const mode = ref<Mode>('login')

/** 账号方式：phone=手机号验证码 / email=邮箱密码 */
type AccountMethod = 'phone' | 'email'
const method = ref<AccountMethod>('phone')

const phoneForm = reactive({ phone: '', code: '' })
const emailForm = reactive({ email: '', password: '', confirm: '' })

const codeCountdown = ref(0)
let codeTimer: ReturnType<typeof setInterval> | null = null

const formValid = computed(() => {
  if (mode.value === 'register' && method.value === 'email') {
    return !!emailForm.email && emailForm.password.length >= 6 && emailForm.password === emailForm.confirm
  }
  if (method.value === 'phone') return /^1\d{6,}$/.test(phoneForm.phone.replace(/\D/g, '')) && phoneForm.code.length >= 4
  return !!emailForm.email && emailForm.password.length >= 6
})

/** 社交登录渠道（国内外聊天社交软件） */
const socialProviders: Array<{ id: AuthProvider; label: string; color: string; icon: string }> = [
  { id: 'wechat', label: '微信', color: '#07c160', icon: '💬' },
  { id: 'alipay', label: '支付宝', color: '#1677ff', icon: '🅰️' },
  { id: 'google', label: 'Google', color: '#ea4335', icon: '🌐' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2', icon: '📘' },
  { id: 'qq', label: 'QQ', color: '#12b7f5', icon: '🐧' },
  { id: 'weibo', label: '微博', color: '#e6162d', icon: '🔴' },
  { id: 'telegram', label: 'Telegram', color: '#229ed9', icon: '✈️' },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25d366', icon: '📱' },
]

function sendCode() {
  if (!/^1\d{6,}$/.test(phoneForm.phone.replace(/\D/g, ''))) {
    ElMessage.warning(t('portal.auth.phoneInvalid'))
    return
  }
  codeCountdown.value = 60
  codeTimer && clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0 && codeTimer) {
      clearInterval(codeTimer)
      codeTimer = null
    }
  }, 1000)
  ElMessage.success(t('portal.auth.codeSent'))
}

function onAccountSubmit() {
  if (!formValid.value) {
    ElMessage.warning(t('portal.auth.formInvalid'))
    return
  }
  if (method.value === 'phone') {
    authStore.quickLogin({ provider: 'phone', contact: phoneForm.phone })
  } else {
    authStore.quickLogin({ provider: 'email', contact: emailForm.email })
  }
  ElMessage.success(t('portal.auth.welcomeBack'))
  gotoRedirect()
}

function onSocialLogin(provider: AuthProvider, label: string) {
  authStore.quickLogin({ provider, name: label })
  ElMessage.success(t('portal.auth.welcomeBack'))
  gotoRedirect()
}

function gotoRedirect() {
  const redirect = (route.query.redirect as string) || '/dashboard'
  router.replace(redirect)
}

function switchMode(m: Mode) {
  mode.value = m
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-aurora" />
    <div class="auth-panel">
      <div class="auth-brand">
        <div class="auth-logo">素</div>
        <div>
          <div class="auth-title">{{ portalMeta.title }}</div>
          <div class="auth-sub">{{ portalMeta.subtitle }} · {{ t('portal.auth.brandSub') }}</div>
        </div>
      </div>

      <!-- 登录 / 注册切换 -->
      <div class="auth-mode-tabs">
        <button
          class="auth-mode-tab"
          :class="{ 'is-active': mode === 'login' }"
          @click="switchMode('login')"
        >{{ t('portal.auth.loginTab') }}</button>
        <button
          class="auth-mode-tab"
          :class="{ 'is-active': mode === 'register' }"
          @click="switchMode('register')"
        >{{ t('portal.auth.registerTab') }}</button>
      </div>

      <!-- 账号方式切换 -->
      <div class="auth-method-chips">
        <button
          class="auth-chip"
          :class="{ 'is-active': method === 'phone' }"
          @click="method = 'phone'"
        >{{ t('portal.auth.methodPhone') }}</button>
        <button
          class="auth-chip"
          :class="{ 'is-active': method === 'email' }"
          @click="method = 'email'"
        >{{ t('portal.auth.methodEmail') }}</button>
      </div>

      <!-- 手机号 + 验证码 -->
      <form v-if="method === 'phone'" class="auth-form" @submit.prevent="onAccountSubmit">
        <div class="auth-field">
          <span class="auth-field-icon">📱</span>
          <input
            v-model.trim="phoneForm.phone"
            class="auth-input"
            type="text"
            :placeholder="t('portal.auth.phonePlaceholder')"
          />
        </div>
        <div class="auth-field">
          <span class="auth-field-icon">🔑</span>
          <input
            v-model.trim="phoneForm.code"
            class="auth-input"
            type="text"
            maxlength="6"
            :placeholder="t('portal.auth.codePlaceholder')"
          />
          <button
            type="button"
            class="auth-code-btn"
            :disabled="codeCountdown > 0"
            @click="sendCode"
          >{{ codeCountdown > 0 ? `${codeCountdown}s` : t('portal.auth.sendCode') }}</button>
        </div>
        <button type="submit" class="auth-submit">
          {{ mode === 'login' ? t('portal.auth.loginBtn') : t('portal.auth.registerBtn') }}
        </button>
      </form>

      <!-- 邮箱 + 密码 -->
      <form v-else class="auth-form" @submit.prevent="onAccountSubmit">
        <div class="auth-field">
          <span class="auth-field-icon">📧</span>
          <input
            v-model.trim="emailForm.email"
            class="auth-input"
            type="email"
            :placeholder="t('portal.auth.emailPlaceholder')"
          />
        </div>
        <div class="auth-field">
          <span class="auth-field-icon">🔒</span>
          <input
            v-model="emailForm.password"
            class="auth-input"
            type="password"
            :placeholder="t('portal.auth.passwordPlaceholder')"
          />
        </div>
        <div v-if="mode === 'register'" class="auth-field">
          <span class="auth-field-icon">🔒</span>
          <input
            v-model="emailForm.confirm"
            class="auth-input"
            type="password"
            :placeholder="t('portal.auth.confirmPlaceholder')"
          />
        </div>
        <button type="submit" class="auth-submit">
          {{ mode === 'login' ? t('portal.auth.loginBtn') : t('portal.auth.registerBtn') }}
        </button>
      </form>

      <div class="auth-divider">
        <span>{{ t('portal.auth.socialDivider') }}</span>
      </div>

      <!-- 社交登录 -->
      <div class="auth-social-grid">
        <button
          v-for="sp in socialProviders"
          :key="sp.id"
          class="auth-social-btn"
          @click="onSocialLogin(sp.id, sp.label)"
        >
          <span class="auth-social-icon" :style="{ background: sp.color }">{{ sp.icon }}</span>
          <span class="auth-social-label">{{ sp.label }}</span>
        </button>
      </div>

      <div class="auth-footer">Suheng OS · {{ t('portal.auth.footerNote') }}</div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(1200px 600px at 20% -10%, #1a6b5c 0%, #124d42 45%, #0d2b26 100%);
  overflow: auto;
  padding: 24px;
}

.auth-aurora {
  position: absolute;
  width: 560px;
  height: 560px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 168, 83, 0.22) 0%, transparent 65%);
  top: -160px;
  right: -120px;
  pointer-events: none;
}

.auth-panel {
  position: relative;
  width: min(440px, 100%);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 20px;
  padding: 28px 26px 20px;
  backdrop-filter: blur(12px);
  color: #f2f5f7;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.auth-logo {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a6b5c, #d4a853);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.auth-title {
  font-size: 18px;
  font-weight: 700;
}

.auth-sub {
  font-size: 12px;
  color: rgba(242, 245, 247, 0.55);
  margin-top: 2px;
}

.auth-mode-tabs {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 14px;
}

.auth-mode-tab {
  flex: 1;
  border: none;
  background: transparent;
  color: rgba(242, 245, 247, 0.65);
  padding: 8px 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.auth-mode-tab.is-active {
  background: linear-gradient(135deg, #1a6b5c, #d4a853);
  color: #fff;
  font-weight: 600;
}

.auth-method-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.auth-chip {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: rgba(242, 245, 247, 0.7);
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-chip.is-active {
  border-color: #d4a853;
  color: #d4a853;
  background: rgba(212, 168, 83, 0.1);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-field {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0 10px;
}

.auth-field-icon {
  font-size: 15px;
  margin-right: 8px;
}

.auth-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #f2f5f7;
  padding: 11px 0;
  font-size: 14px;
  min-width: 0;
}

.auth-input::placeholder {
  color: rgba(242, 245, 247, 0.35);
}

.auth-code-btn {
  border: none;
  background: rgba(212, 168, 83, 0.18);
  color: #d4a853;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.auth-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-submit {
  margin-top: 4px;
  border: none;
  background: linear-gradient(135deg, #1a6b5c, #d4a853);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 0;
  border-radius: 10px;
  cursor: pointer;
  transition: filter 0.2s;
}

.auth-submit:hover {
  filter: brightness(1.1);
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 12px;
  color: rgba(242, 245, 247, 0.4);
  font-size: 12px;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.auth-social-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.auth-social-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 10px;
  padding: 10px 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-social-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.auth-social-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.auth-social-label {
  font-size: 11px;
  color: rgba(242, 245, 247, 0.7);
}

.auth-footer {
  margin-top: 16px;
  text-align: center;
  font-size: 11px;
  color: rgba(242, 245, 247, 0.35);
}
</style>
