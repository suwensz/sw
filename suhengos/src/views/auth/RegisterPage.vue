<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import type { RegisterPayload, HealthProfile } from '@/types'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const currentStep = ref(0)
const formRef = ref()
const codeCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null
const agreeTerms = ref(false)

const form = reactive({
  account: '',
  password: '',
  confirmPassword: '',
  code: '',
  nickname: '',
})

const healthProfile = reactive<{
  gender: 'male' | 'female' | 'other' | undefined
  age: number | undefined
  height: number | undefined
  weight: number | undefined
  allergies: string
  chronicConditions: string
}>({
  gender: undefined,
  age: undefined,
  height: undefined,
  weight: undefined,
  allergies: '',
  chronicConditions: '',
})

const accountRules = {
  account: [
    { required: true, message: t('auth.accountRequired'), trigger: 'blur' },
    {
      validator: (_r: any, value: string, cb: any) => {
        if (value && !/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value) && !/^\d{6,}$/.test(value)) {
          cb(new Error(t('auth.invalidEmail')))
        } else cb()
      },
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: t('auth.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('auth.passwordTooShort'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('auth.passwordRequired'), trigger: 'blur' },
    {
      validator: (_r: any, value: string, cb: any) => {
        if (value !== form.password) cb(new Error(t('auth.passwordNotMatch')))
        else cb()
      },
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: t('auth.codeRequired'), trigger: 'blur' }],
  nickname: [{ required: true, message: t('auth.nickname'), trigger: 'blur' }],
}

const steps = [
  { title: t('auth.stepAccount') },
  { title: t('auth.stepHealth') },
  { title: t('auth.stepComplete') },
]

async function nextStep() {
  if (currentStep.value === 0) {
    if (!agreeTerms.value) {
      ElMessage.warning(t('auth.agreeRequired'))
      return
    }
    if (!formRef.value) return
    await formRef.value.validate(async (valid: boolean) => {
      if (valid) currentStep.value = 1
    })
  } else if (currentStep.value === 1) {
    currentStep.value = 2
  }
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

async function sendCode() {
  if (!form.account) {
    ElMessage.warning(t('auth.accountRequired'))
    return
  }
  await authStore.sendVerificationCode(form.account)
  ElMessage.success('验证码已发送（Mock：任意6位数字）')
  codeCountdown.value = 60
  countdownTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0 && countdownTimer) clearInterval(countdownTimer)
  }, 1000)
}

async function handleRegister() {
  const allergies = healthProfile.allergies
    ? (healthProfile.allergies as string).split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    : []
  const chronicConditions = healthProfile.chronicConditions
    ? (healthProfile.chronicConditions as string).split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    : []

  const payload: RegisterPayload = {
    account: form.account,
    password: form.password,
    nickname: form.nickname,
    verificationCode: form.code,
    healthProfile: {
      ...healthProfile,
      allergies,
      chronicConditions,
    } as HealthProfile,
  }

  const result = await authStore.register(payload)
  if (result.success) {
    ElMessage.success(t('auth.registerSuccess'))
    setTimeout(() => router.push('/'), 1500)
  } else {
    ElMessage.error(result.message || t('common.failed'))
  }
}
</script>

<template>
  <AuthLayout :title="t('auth.createAccount')" :subtitle="t('auth.registerSubtitle')">
    <template #form-header>
      <div class="top-nav">
        <span class="top-brand">素衡OS</span>
      </div>
    </template>

    <!-- 步骤条 -->
    <el-steps :active="currentStep" align-center class="steps">
      <el-step :title="steps[0].title" />
      <el-step :title="steps[1].title" />
      <el-step :title="steps[2].title" />
    </el-steps>

    <!-- Step 1: 账号信息 -->
    <div v-show="currentStep === 0" class="step-content">
      <el-form ref="formRef" :model="form" :rules="accountRules" label-position="top" size="large">
        <el-form-item :label="t('auth.emailOrPhone')" prop="account">
          <el-input v-model="form.account" :prefix-icon="'Message'" />
        </el-form-item>
        <el-form-item :label="t('auth.verificationCode')" prop="code">
          <div class="code-input-row">
            <el-input v-model="form.code" :prefix-icon="'Key'" maxlength="6" />
            <el-button type="primary" plain :disabled="codeCountdown > 0" @click="sendCode">
              {{ codeCountdown > 0 ? t('auth.codeCountdown', { seconds: codeCountdown }) : t('auth.getCode') }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item :label="t('auth.nickname')" prop="nickname">
          <el-input v-model="form.nickname" :prefix-icon="'User'" />
        </el-form-item>
        <el-form-item :label="t('auth.password')" prop="password">
          <el-input v-model="form.password" type="password" show-password :prefix-icon="'Lock'" />
        </el-form-item>
        <el-form-item :label="t('auth.confirmPassword')" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password :prefix-icon="'Lock'" @keyup.enter="nextStep" />
        </el-form-item>
        <div class="agree-row">
          <el-checkbox v-model="agreeTerms">
            {{ t('auth.iAgree') }}
            <a href="#" @click.prevent>{{ t('auth.userAgreement') }}</a>
            {{ t('auth.and') }}
            <a href="#" @click.prevent>{{ t('auth.privacyPolicy') }}</a>
          </el-checkbox>
        </div>
      </el-form>
    </div>

    <!-- Step 2: 健康档案 -->
    <div v-show="currentStep === 1" class="step-content">
      <p class="step-hint">{{ t('auth.stepHealth') }} — {{ t('auth.skipForNow') }}</p>
      <el-form label-position="top" size="large">
        <div class="form-row">
          <el-form-item :label="t('auth.gender')">
            <el-radio-group v-model="healthProfile.gender">
              <el-radio value="male">{{ t('auth.male') }}</el-radio>
              <el-radio value="female">{{ t('auth.female') }}</el-radio>
              <el-radio value="other">{{ t('auth.other') }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
        <div class="form-row three-cols">
          <el-form-item :label="t('auth.age')">
            <el-input-number v-model="healthProfile.age" :min="1" :max="150" controls-position="right" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="t('auth.height')">
            <el-input-number v-model="healthProfile.height" :min="50" :max="250" controls-position="right" style="width: 100%" />
          </el-form-item>
          <el-form-item :label="t('auth.weight')">
            <el-input-number v-model="healthProfile.weight" :min="10" :max="300" controls-position="right" style="width: 100%" />
          </el-form-item>
        </div>
        <el-form-item :label="t('auth.allergies')">
          <el-input v-model="healthProfile.allergies as string" type="textarea" :rows="2" :placeholder="t('auth.allergiesPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('auth.chronicConditions')">
          <el-input v-model="healthProfile.chronicConditions as string" type="textarea" :rows="2" :placeholder="t('auth.chronicPlaceholder')" />
        </el-form-item>
      </el-form>
    </div>

    <!-- Step 3: 完成 -->
    <div v-show="currentStep === 2" class="step-content complete-step">
      <div class="complete-icon">
        <el-icon><CircleCheckFilled /></el-icon>
      </div>
      <h3>{{ t('auth.registerSuccess') }}</h3>
      <p>{{ t('auth.registerSuccessDesc') }}</p>
    </div>

    <!-- 操作按钮 -->
    <div class="step-actions" v-if="currentStep < 2">
      <el-button v-if="currentStep === 1" plain size="large" @click="prevStep">
        {{ t('common.prev') }}
      </el-button>
      <el-button type="primary" size="large" :loading="authStore.loading" @click="nextStep">
        {{ currentStep === 1 ? t('auth.completeSetup') : t('common.next') }}
      </el-button>
    </div>
    <div class="step-actions" v-else>
      <el-button type="primary" size="large" :loading="authStore.loading" @click="handleRegister">
        {{ t('auth.completeSetup') }}
      </el-button>
    </div>

    <template #footer>
      <span>{{ t('auth.hasAccount') }}</span>
      <router-link to="/login" class="auth-link">{{ t('auth.goLogin') }}</router-link>
    </template>
  </AuthLayout>
</template>

<style scoped>
.top-nav {
  margin-bottom: 24px;
}
.top-brand {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 1px;
}
.steps {
  margin-bottom: 28px;
}
.step-content {
  min-height: 320px;
}
.step-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 16px;
}
.code-input-row {
  display: flex;
  gap: 12px;
  width: 100%;
}
.code-input-row .el-input { flex: 1; }
.form-row.three-cols {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.agree-row {
  margin-top: 4px;
  font-size: 13px;
}
.agree-row a {
  color: var(--color-primary);
}
.step-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
.step-actions .el-button {
  flex: 1;
  height: 44px;
  border-radius: 8px;
}
.complete-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 0;
}
.complete-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(82, 166, 122, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.complete-icon .el-icon {
  font-size: 40px;
  color: var(--color-success);
}
.complete-step h3 {
  font-size: 22px;
  margin: 0 0 8px;
  color: var(--color-text-primary);
}
.complete-step p {
  color: var(--color-text-regular);
  margin: 0;
}
.auth-link {
  color: var(--color-primary);
  font-weight: 500;
  margin-left: 4px;
}
</style>
