import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginPayload, RegisterPayload, HealthProfile } from '@/types'
import { getLocale } from '@/i18n'

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

// 开发环境测试账号（仅 DEV 环境生效）
const DEV_TEST_ACCOUNTS: Array<{ email: string; password: string; user: UserInfo }> = [
  {
    email: 'dev_user@coze.dev',
    password: 'dev123456',
    user: {
      id: 'dev-001',
      email: 'dev_user@coze.dev',
      name: '岐黄体验官',
      nickname: '岐黄体验官',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=qihuang',
      role: 'user',
      locale: 'zh',
      healthProfile: {
        gender: 'female',
        age: 32,
        height: 165,
        weight: 55,
        constitution: 'qiDeficiency',
      },
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  {
    email: 'dev_admin@coze.dev',
    password: 'dev123456',
    user: {
      id: 'dev-admin-001',
      email: 'dev_admin@coze.dev',
      name: '系统管理员',
      nickname: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suheng-admin',
      role: 'admin',
      locale: 'zh',
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  {
    email: 'dev_ops@coze.dev',
    password: 'dev123456',
    user: {
      id: 'dev-ops-001',
      email: 'dev_ops@coze.dev',
      name: '跨境运营员',
      nickname: '跨境运营员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suheng-ops',
      role: 'ops',
      locale: 'zh',
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  {
    email: 'dev_dev@coze.dev',
    password: 'dev123456',
    user: {
      id: 'dev-dev-001',
      email: 'dev_dev@coze.dev',
      name: '研发工程师',
      nickname: '研发工程师',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=suheng-dev',
      role: 'dev',
      locale: 'zh',
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
]

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
      // 模拟网络延迟
      await new Promise((r) => setTimeout(r, 800))

      // 开发环境测试账号
      if (payload.method === 'password') {
        const devAccount = DEV_TEST_ACCOUNTS.find(
          (a) => a.email === payload.account && a.password === payload.password,
        )
        if (devAccount) {
          setAuth(devAccount.user, 'dev-token-' + Date.now())
          return { success: true }
        }
      }

      // 验证码登录：任意6位数字验证码均可通过（Mock）
      if (payload.method === 'code' && payload.code && payload.code.length === 6) {
        const newUser: UserInfo = {
          id: 'u-' + Date.now(),
          email: payload.account.includes('@') ? payload.account : '',
          phone: payload.account.includes('@') ? undefined : payload.account,
          name: payload.account.includes('@') ? payload.account.split('@')[0] : payload.account,
          nickname: payload.account.includes('@') ? payload.account.split('@')[0] : payload.account,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.account)}`,
          role: 'user',
          locale: getLocale(),
          createdAt: new Date().toISOString(),
        }
        setAuth(newUser, 'token-' + Date.now())
        return { success: true }
      }

      // 密码登录：已注册用户（Mock：任意6位以上密码可登录）
      if (payload.method === 'password' && payload.password && payload.password.length >= 6) {
        const existing = localStorage.getItem('qh_registered_' + payload.account)
        if (existing) {
          const regData = JSON.parse(existing) as RegisterPayload
          if (regData.password === payload.password) {
            const newUser: UserInfo = {
              id: 'u-' + Date.now(),
              email: payload.account.includes('@') ? payload.account : '',
              phone: payload.account.includes('@') ? undefined : payload.account,
              name: regData.nickname,
              nickname: regData.nickname,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.account)}`,
              role: 'user',
              locale: getLocale(),
              healthProfile: regData.healthProfile,
              createdAt: new Date().toISOString(),
            }
            setAuth(newUser, 'token-' + Date.now())
            return { success: true }
          }
          return { success: false, message: loginFailedMsg() }
        }
        // 未注册但格式正确，自动创建（Mock 便利）
        const newUser: UserInfo = {
          id: 'u-' + Date.now(),
          email: payload.account.includes('@') ? payload.account : '',
          phone: payload.account.includes('@') ? undefined : payload.account,
          name: payload.account.includes('@') ? payload.account.split('@')[0] : payload.account,
          nickname: payload.account.includes('@') ? payload.account.split('@')[0] : payload.account,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.account)}`,
          role: 'user',
          locale: getLocale(),
          createdAt: new Date().toISOString(),
        }
        setAuth(newUser, 'token-' + Date.now())
        return { success: true }
      }

      return { success: false, message: loginFailedMsg() }
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<{ success: boolean; message?: string }> {
    loading.value = true
    try {
      await new Promise((r) => setTimeout(r, 1000))
      // 保存注册信息
      localStorage.setItem('qh_registered_' + payload.account, JSON.stringify(payload))
      const newUser: UserInfo = {
        id: 'u-' + Date.now(),
        email: payload.account.includes('@') ? payload.account : '',
        phone: payload.account.includes('@') ? undefined : payload.account,
        name: payload.nickname,
        nickname: payload.nickname,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.nickname)}`,
        role: 'user',
        locale: getLocale(),
        healthProfile: payload.healthProfile,
        createdAt: new Date().toISOString(),
      }
      setAuth(newUser, 'token-' + Date.now())
      return { success: true }
    } finally {
      loading.value = false
    }
  }

  async function sendVerificationCode(_account: string): Promise<{ success: boolean }> {
    await new Promise((r) => setTimeout(r, 500))
    return { success: true }
  }

  async function thirdPartyLogin(provider: string): Promise<{ success: boolean }> {
    loading.value = true
    try {
      await new Promise((r) => setTimeout(r, 800))
      const newUser: UserInfo = {
        id: provider + '-' + Date.now(),
        email: `user@${provider}.com`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        nickname: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
        role: 'user',
        locale: getLocale(),
        createdAt: new Date().toISOString(),
      }
      setAuth(newUser, 'token-' + provider + '-' + Date.now())
      return { success: true }
    } finally {
      loading.value = false
    }
  }

  function updateHealthProfile(profile: HealthProfile) {
    if (user.value) {
      user.value.healthProfile = { ...user.value.healthProfile, ...profile }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
    }
  }

  function updateProfile(partial: Partial<UserInfo>) {
    if (user.value) {
      user.value = { ...user.value, ...partial }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
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
