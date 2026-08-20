/**
 * Auth API 服务
 */

import http from './http'
import type { UserInfo, LoginPayload, RegisterPayload, HealthProfile } from '@/types'

export interface AuthResponse {
  user: UserInfo
  token: string
}

export const authApi = {
  /** 登录 */
  login(payload: LoginPayload): Promise<AuthResponse> {
    return http.post('/api/v1/auth/login', payload) as unknown as Promise<AuthResponse>
  },

  /** 注册 */
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return http.post('/api/v1/auth/register', payload) as unknown as Promise<AuthResponse>
  },

  /** 发送验证码 */
  sendCode(account: string): Promise<{ success: boolean }> {
    return http.post('/api/v1/auth/send-code', { account }) as unknown as Promise<{ success: boolean }>
  },

  /** 第三方登录 */
  thirdPartyLogin(provider: string): Promise<AuthResponse> {
    return http.post('/api/v1/auth/third-party', { provider }) as unknown as Promise<AuthResponse>
  },

  /** 获取当前用户信息 */
  getProfile(): Promise<UserInfo> {
    return http.get('/api/v1/auth/profile') as unknown as Promise<UserInfo>
  },

  /** 更新用户信息 */
  updateProfile(partial: Partial<UserInfo>): Promise<UserInfo> {
    return http.put('/api/v1/auth/profile', partial) as unknown as Promise<UserInfo>
  },

  /** 更新健康档案 */
  updateHealthProfile(profile: HealthProfile): Promise<UserInfo> {
    return http.put('/api/v1/auth/health-profile', profile) as unknown as Promise<UserInfo>
  },
}
