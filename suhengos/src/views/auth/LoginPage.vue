<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import type { LoginMethod } from '@/types'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const loginMethod = ref<LoginMethod>('password')
const formRef = ref()
const codeCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  account: '',
  password: '',
  code: '',
  remember: false,
})

const rules = {
  account: [
    { required: true, message: t('auth.accountRequired'), trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value && !/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value) && !/^\d{6,}$/.test(value)) {
          callback(new Error(t('auth.invalidEmail')))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  password: [{ required: true, message: t('auth.passwordRequired'), trigger: 'blur' }],
  code: [{ required: true, message: t('auth.codeRequired'), trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    const result = await authStore.login({
      account: form.account,
      password: form.password,
      code: form.code,
      method: loginMethod.value,
    })
    if (result.success) {
      ElMessage.success(t('common.success'))
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    } else {
      ElMessage.error(result.message || t('auth.loginFailed'))
    }
  })
}

async function sendCode() {
  if (!form.account) {
    ElMessage.warning(t('auth.accountRequired'))
    return
  }
  const result = await authStore.sendVerificationCode(form.account)
  if (result.success) {
    ElMessage.success('验证码已发送（Mock：任意6位数字）')
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer)
      }
    }, 1000)
  }
}

async function handleThirdParty(provider: string) {
  await authStore.thirdPartyLogin(provider)
  ElMessage.success(t('common.success'))
  router.push('/')
}

const socialProviders = [
  { id: 'google', label: 'Google', icon: 'google', color: '#4285f4' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook', color: '#1877f2' },
  { id: 'apple', label: 'Apple', icon: 'apple', color: '#000' },
  { id: 'wechat', label: '微信', icon: 'wechat', color: '#07c160' },
]
</script>

<template>
  <AuthLayout :title="t('auth.welcomeBack')" :subtitle="t('auth.loginSubtitle')">
    <template #form-header>
      <div class="top-nav">
        <span class="top-brand">素衡OS</span>
      </div>
    </template>

    <!-- 登录方式切换 -->
    <div class="method-tabs">
      <button
        :class="{ active: loginMethod === 'password' }"
        @click="loginMethod = 'password'"
      >
        {{ t('auth.loginWithPassword') }}
      </button>
      <button
        :class="{ active: loginMethod === 'code' }"
        @click="loginMethod = 'code'"
      >
        {{ t('auth.loginWithCode') }}
      </button>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large">
      <el-form-item prop="account">
        <el-input
          v-model="form.account"
          :placeholder="t('auth.emailOrPhone')"
          :prefix-icon="'User'"
        />
      </el-form-item>

      <el-form-item v-if="loginMethod === 'password'" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          :placeholder="t('auth.password')"
          :prefix-icon="'Lock'"
          show-password
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <el-form-item v-else prop="code">
        <div class="code-input-row">
          <el-input
            v-model="form.code"
            :placeholder="t('auth.verificationCode')"
            :prefix-icon="'Message'"
            maxlength="6"
          />
          <el-button
            type="primary"
            plain
            :disabled="codeCountdown > 0"
            @click="sendCode"
          >
            {{ codeCountdown > 0 ? t('auth.codeCountdown', { seconds: codeCountdown }) : t('auth.getCode') }}
          </el-button>
        </div>
      </el-form-item>

      <div class="form-options">
        <el-checkbox v-model="form.remember">{{ t('auth.rememberMe') }}</el-checkbox>
        <router-link to="/forgot-password" class="forgot-link">
          {{ t('auth.forgotPassword') }}
        </router-link>
      </div>

      <el-button
        type="primary"
        class="submit-btn"
        :loading="authStore.loading"
        @click="handleLogin"
      >
        {{ t('auth.login') }}
      </el-button>
    </el-form>

    <!-- 开发环境提示 -->
    <div class="dev-hint">
      <el-icon><InfoFilled /></el-icon>
      {{ t('auth.devAccountHint') }}
    </div>

    <!-- 分割线 -->
    <div class="divider">
      <span>{{ t('auth.or') }}</span>
    </div>

    <!-- 第三方登录 -->
    <div class="social-login">
      <button
        v-for="provider in socialProviders"
        :key="provider.id"
        class="social-btn"
        :title="provider.label"
        @click="handleThirdParty(provider.id)"
      >
        <svg v-if="provider.id === 'google'" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <svg v-else-if="provider.id === 'facebook'" viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <svg v-else-if="provider.id === 'apple'" viewBox="0 0 24 24" width="20" height="20" fill="#000">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
        <svg v-else-if="provider.id === 'wechat'" viewBox="0 0 24 24" width="22" height="22" fill="#07C160">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
        </svg>
      </button>
    </div>

    <template #footer>
      <span>{{ t('auth.noAccount') }}</span>
      <router-link to="/register" class="auth-link">{{ t('auth.goRegister') }}</router-link>
    </template>
  </AuthLayout>
</template>

<style scoped>
.top-nav {
  margin-bottom: 32px;
}
.top-brand {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 1px;
}

.method-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}
.method-tabs button {
  padding: 8px 0;
  border: none;
  background: none;
  font-size: 15px;
  color: var(--color-text-secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}
.method-tabs button.active {
  color: var(--color-primary);
  font-weight: 600;
}
.method-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
}

.code-input-row {
  display: flex;
  gap: 12px;
  width: 100%;
}
.code-input-row .el-input {
  flex: 1;
}
.code-input-row .el-button {
  white-space: nowrap;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.forgot-link {
  color: var(--color-primary);
  font-size: 14px;
  text-decoration: none;
}
.forgot-link:hover {
  color: var(--color-primary-light);
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.dev-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 14px;
  background: var(--color-bg-soft);
  border-radius: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0 20px;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.divider span {
  padding: 0 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
}
.social-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-light);
}

.auth-link {
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  margin-left: 4px;
}
.auth-link:hover {
  color: var(--color-primary-light);
}
</style>
