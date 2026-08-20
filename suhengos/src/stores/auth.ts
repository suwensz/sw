import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginPayload, RegisterPayload, HealthProfile } from '@/types'
import { getLocale } from '@/i18n'
import { authApi } from '@/api'

const LOGIN_FAILED_MSG: Record<string, string> = {
  zh: '账号或密码错误',
  en: 'Invalid account or password',
  ja: 'アカウントまたはパスワードが正しくありません',
  ko: '계정 또는 비밀번호가 올바르지 않습니다',
  es: 'Cuenta o contrasena incorrecta',
  fr: 'Compte ou mot de passe incorrect',
}

function loginFailedMsg() {
  return LOGIN_FAILED_MSG[getLocale()] || LOGIN_FAILED_MSG.en
}

const STORAGE_KEY = 'qh_auth_user'
const TOKEN_KEY = 'qh_auth_token'

function loadUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserInfo) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(loadUser())
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const loading = ref(false)

  // 桌面端：恢复登录态时同步上报角色（应用重启后菜单可用性恢复）
  if (user.value?.role) {
    window.suhengOS?.setRole?.(user.value.role)
  }

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  const bmi = computed(() => {
    const hp = user.value?.healthProfile
    if (!hp?.height || !hp?.weight) return null
    const h = hp.height / 100
    return Math.round((hp.weight / (h * h)) * 10) / 10
  })

  function setAuth(u: UserInfo, t: string) {
    user.value = u
    token.value = t
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    localStorage.setItem(TOKEN_KEY, t)
    // 向 Electron 主进程上报角色，用于「工作台」菜单的可用性
    window.suhengOS?.setRole?.(u.role)
  }

  async function login(payload: LoginPayload): Promise<{ success: boolean; message?: string }> {
    loading.value = true
    try {
      const res = await authApi.login(payload)
      setAuth(res.user, res.token)
      return { success: true }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } }
      if (error?.response?.status === 400 || error?.response?.status === 401) {
        return { success: false, message: loginFailedMsg() }
      }
      return { success: false, message: (error?.response?.data?.message) || loginFailedMsg() }
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<{ success: boolean; message?: string }> {
    loading.value = true
    try {
      const res = await authApi.register(payload)
      setAuth(res.user, res.token)
      return { success: true }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return { success: false, message: error?.response?.data?.message || '注册失败' }
    } finally {
      loading.value = false
    }
  }

  async function sendVerificationCode(account: string): Promise<{ success: boolean }> {
    try {
      await authApi.sendCode(account)
      return { success: true }
    } catch {
      return { success: false }
    }
  }

  async function thirdPartyLogin(provider: string): Promise<{ success: boolean }> {
    loading.value = true
    try {
      const res = await authApi.thirdPartyLogin(provider)
      setAuth(res.user, res.token)
      return { success: true }
    } catch {
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  async function updateHealthProfile(profile: HealthProfile) {
    if (user.value) {
      try {
        const updated = await authApi.updateHealthProfile(profile)
        user.value = updated
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // 降级：本地更新
        user.value.healthProfile = { ...user.value.healthProfile, ...profile }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
      }
    }
  }

  async function updateProfile(partial: Partial<UserInfo>) {
    if (user.value) {
      try {
        const updated = await authApi.updateProfile(partial)
        user.value = updated
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // 降级：本地更新
        user.value = { ...user.value, ...partial }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
      }
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    window.suhengOS?.setRole?.(null)
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    bmi,
    login,
    register,
    sendVerificationCode,
    thirdPartyLogin,
    updateHealthProfile,
    updateProfile,
    logout,
  }
})
