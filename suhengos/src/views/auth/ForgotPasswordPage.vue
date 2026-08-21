<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const stage = ref<'request' | 'sent'>('request')
const formRef = ref()
const form = reactive({ email: '' })
const codeCountdown = ref(0)

const rules = {
  email: [
    { required: true, message: t('auth.accountRequired'), trigger: 'blur' },
    { type: 'email' as const, message: t('auth.invalidEmail'), trigger: 'blur' },
  ],
}

async function sendResetLink() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    await authStore.sendVerificationCode(form.email)
    stage.value = 'sent'
    ElMessage.success(t('auth.resetLinkSent'))
  })
}

function resend() {
  codeCountdown.value = 60
  const timer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) clearInterval(timer)
  }, 1000)
}
</script>

<template>
  <AuthLayout :title="t('auth.forgotPasswordTitle')" :subtitle="t('auth.forgotPasswordSubtitle')">
    <template #form-header>
      <div class="top-nav">
        <span class="top-brand">素衡OS</span>
      </div>
    </template>

    <!-- 请求重置 -->
    <div v-if="stage === 'request'" class="stage">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large">
        <el-form-item :label="t('auth.email')" prop="email">
          <el-input v-model="form.email" :placeholder="t('auth.email')" :prefix-icon="'Message'" />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="authStore.loading" @click="sendResetLink">
          {{ t('auth.sendResetLink') }}
        </el-button>
      </el-form>
    </div>

    <!-- 发送成功 -->
    <div v-else class="stage sent-stage">
      <div class="sent-icon">
        <el-icon><Message /></el-icon>
      </div>
      <h3>{{ t('auth.resetLinkSent') }}</h3>
      <p>{{ form.email }}</p>
      <el-button plain class="resend-btn" :disabled="codeCountdown > 0" @click="resend">
        {{ codeCountdown > 0 ? t('auth.codeCountdown', { seconds: codeCountdown }) : t('auth.resendCode') }}
      </el-button>
    </div>

    <template #footer>
      <router-link to="/login" class="back-link">
        <el-icon><ArrowLeft /></el-icon>
        {{ t('auth.backToLogin') }}
      </router-link>
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
.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
}
.sent-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}
.sent-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(26, 107, 92, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.sent-icon .el-icon {
  font-size: 32px;
  color: var(--color-primary);
}
.sent-stage h3 {
  font-size: 18px;
  margin: 0 0 8px;
}
.sent-stage p {
  color: var(--color-text-regular);
  margin: 0 0 20px;
  word-break: break-all;
}
.resend-btn {
  border-radius: 8px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  text-decoration: none;
}
.back-link:hover {
  color: var(--color-primary-light);
}
</style>
