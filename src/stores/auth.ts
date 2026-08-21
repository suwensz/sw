import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  HealthProfile,
  LoginPayload,
  RegisterPayload,
  UserInfo,
} from '@/types'

/** 运营端快捷登录渠道 */
export type AuthProvider =
  | 'phone'
  | 'email'
  | 'wechat'
  | 'alipay'
  | 'google'
  | 'facebook'
  | 'qq'
  | 'weibo'
  | 'telegram'
  | 'whatsapp'

const USER_KEY = 'qh_user'

function loadUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserInfo
    return parsed && parsed.id && parsed.email ? parsed : null
  } catch {
    return null
  }
}

function mockUser(input: { account?: string; nickname?: string; provider?: string }): UserInfo {
  const account = input.account || ''
  const nickname =
    input.nickname ||
    (account.includes('@') ? account.split('@')[0] : account) ||
    `${input.provider || 'suheng'}用户`
  return {
    id: `u-${Date.now().toString(36)}`,
    email: account.includes('@') ? account : `${account || 'user'}@suheng.os`,
    phone: account && !account.includes('@') ? account : undefined,
    name: nickname,
    nickname,
    avatar: '',
    role: 'user',
    locale: 'zh',
    createdAt: new Date().toISOString(),
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 登录认证（Mock 实现）：
 * 账号密码 / 验证码登录、注册、第三方（微信/支付宝/Google/Facebook 等）、
 * 个人资料与健康档案更新、运营端多渠道快捷登录。
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(loadUser())
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  /** 运营端登录态别名 */
  const isLoggedIn = isAuthenticated

  const bmi = computed(() => {
    const h = user.value?.healthProfile?.height
    const w = user.value?.healthProfile?.weight
    if (!h || !w || h <= 0) return 0
    return +(w / (h / 100) ** 2).toFixed(1)
  })

  function persist() {
    if (user.value) localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    else localStorage.removeItem(USER_KEY)
  }

  async function login(payload: LoginPayload): Promise<{ success: boolean; message?: string }> {
    loading.value = true
    await delay(600)
    loading.value = false
    if (!payload.account) return { success: false, message: '请输入账号' }
    if (payload.method === 'password' && !payload.password) return { success: false, message: '请输入密码' }
    if (payload.method === 'code' && !payload.code) return { success: false, message: '请输入验证码' }
    user.value = mockUser({ account: payload.account })
    persist()
    return { success: true }
  }

  async function register(payload: RegisterPayload): Promise<{ success: boolean; message?: string }> {
    loading.value = true
    await delay(800)
    loading.value = false
    if (!payload.account || !payload.password) return { success: false, message: '请完整填写注册信息' }
    user.value = mockUser({ account: payload.account, nickname: payload.nickname })
    if (payload.healthProfile) user.value.healthProfile = payload.healthProfile
    persist()
    return { success: true }
  }

  async function sendVerificationCode(_account: string): Promise<{ success: boolean; message?: string }> {
    await delay(500)
    return { success: true, message: '验证码已发送（Mock：任意6位数字）' }
  }

  async function thirdPartyLogin(provider: string): Promise<void> {
    loading.value = true
    await delay(700)
    loading.value = false
    user.value = mockUser({ nickname: `${provider} 用户` })
    persist()
  }

  /** 运营端多渠道快捷登录（手机号/邮箱/微信/支付宝/Google/Facebook/QQ/微博/Telegram/WhatsApp） */
  function quickLogin(input: { provider: AuthProvider; name?: string; contact?: string }) {
    user.value = mockUser({ account: input.contact, nickname: input.name })
    persist()
    return user.value
  }

  function updateProfile(patch: Partial<Pick<UserInfo, 'name' | 'nickname' | 'avatar' | 'locale'>>) {
    if (!user.value) return
    user.value = { ...user.value, ...patch }
    persist()
  }

  function updateHealthProfile(patch: Partial<HealthProfile>) {
    if (!user.value) return
    user.value = {
      ...user.value,
      healthProfile: { ...(user.value.healthProfile || {}), ...patch },
    }
    persist()
  }

  function logout() {
    user.value = null
    persist()
  }

  return {
    user,
    loading,
    isAuthenticated,
    isLoggedIn,
    bmi,
    login,
    register,
    sendVerificationCode,
    thirdPartyLogin,
    quickLogin,
    updateProfile,
    updateHealthProfile,
    logout,
  }
})
