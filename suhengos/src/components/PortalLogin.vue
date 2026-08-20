<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const props = defineProps<{
  /** 端口名称，如「管理端」「运营端」 */
  portalName: string
  /** 登录提示语 */
  subtitle?: string
  /** 测试账号提示（仅开发期展示） */
  devHint?: string
}>()

const emit = defineEmits<{ success: [] }>()

const auth = useAuthStore()
const formRef = ref()
const form = reactive({
  account: '',
  password: '',
})
const errorMsg = ref('')

const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  errorMsg.value = ''
  const res = await auth.login({ account: form.account, password: form.password, method: 'password' })
  if (res.success) {
    emit('success')
  } else {
    errorMsg.value = res.message || '登录失败，请重试'
  }
}
</script>

<template>
  <div class="portal-login">
    <div class="portal-login__bg" aria-hidden="true"></div>
    <div class="portal-login__card">
      <div class="portal-login__header">
        <div class="brand">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="brand-icon">
            <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" opacity="0.4" />
            <path d="M20 8 C14 14 14 22 20 32 C26 22 26 14 20 8Z" fill="currentColor" opacity="0.9" />
            <circle cx="20" cy="18" r="3" fill="white" opacity="0.8" />
          </svg>
          <div class="brand-text">
            <span class="brand-name">素衡OS</span>
            <span class="brand-portal">{{ portalName }}</span>
          </div>
        </div>
        <div class="lang"><LanguageSwitcher /></div>
      </div>

      <h2 class="login-title">{{ portalName }}登录</h2>
      <p class="login-subtitle">{{ subtitle || '请使用工作账号登录' }}</p>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="account">
          <el-input v-model="form.account" placeholder="账号 / 邮箱" :prefix-icon="'User'" autocomplete="username" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="'Lock'"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item v-if="errorMsg">
          <el-alert :title="errorMsg" type="error" show-icon :closable="false" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="auth.loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <p v-if="devHint" class="dev-hint">测试账号：{{ devHint }}</p>
    </div>
  </div>
</template>

<style scoped>
.portal-login {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
  padding: 24px;
}

.portal-login__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 20%, rgba(26, 107, 92, 0.08) 0%, transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(212, 168, 83, 0.1) 0%, transparent 45%);
  pointer-events: none;
}

.portal-login__card {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 36px 32px 28px;
  box-shadow: 0 12px 40px rgba(44, 44, 44, 0.08);
}

.portal-login__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 36px;
  height: 36px;
  color: var(--color-primary);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.brand-name {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--color-text-primary);
}

.brand-portal {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.login-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.login-subtitle {
  margin: 0 0 24px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.login-btn {
  width: 100%;
}

.dev-hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-soft);
  border-radius: 6px;
  padding: 8px 12px;
}
</style>
