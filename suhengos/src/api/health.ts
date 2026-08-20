/**
 * Health API 服务（手表、预警、家人、五运六气）
 */

import http from './http'
import type { SmartWatch, HealthAlert, FamilyMember, WuYunLiuQi, ForecastDay, DietRecipe, ConstitutionType, ConstitutionQuestion, AssessmentResult, Conversation, ChatMessage } from '@/types'
import type { LocaleCode } from '@/types'

export const healthApi = {
  /** 获取智能手表列表 */
  getWatches(): Promise<SmartWatch[]> {
    return http.get('/api/v1/health/watches') as unknown as Promise<SmartWatch[]>
  },

  /** 获取健康预警 */
  getAlerts(): Promise<HealthAlert[]> {
    return http.get('/api/v1/health/alerts') as unknown as Promise<HealthAlert[]>
  },

  /** 获取家人列表 */
  getFamily(): Promise<FamilyMember[]> {
    return http.get('/api/v1/health/family') as unknown as Promise<FamilyMember[]>
  },
}

export const wuyunApi = {
  /** 获取五运六气 */
  getWuYunLiuQi(year: number): Promise<WuYunLiuQi> {
    return http.get(`/api/v1/wuyun/year/${year}`) as unknown as Promise<WuYunLiuQi>
  },

  /** 获取气候预测 */
  getForecast(start: string, days: number): Promise<ForecastDay[]> {
    return http.get('/api/v1/wuyun/forecast', { params: { start, days } }) as unknown as Promise<ForecastDay[]>
  },

  /** 获取药膳方案 */
  getDietRecipes(): Promise<DietRecipe[]> {
    return http.get('/api/v1/wuyun/diet-recipes') as unknown as Promise<DietRecipe[]>
  },

  /** 根据出生日期推算体质 */
  getConstitution(birthDate: string): Promise<unknown> {
    return http.get(`/api/v1/wuyun/constitution/${encodeURIComponent(birthDate)}`) as unknown as Promise<unknown>
  },
}

export const constitutionApi = {
  /** 获取体质类型 */
  getTypes(): Promise<ConstitutionType[]> {
    return http.get('/api/v1/constitution/types') as unknown as Promise<ConstitutionType[]>
  },

  /** 获取问卷题目 */
  getQuestions(): Promise<ConstitutionQuestion[]> {
    return http.get('/api/v1/constitution/questions') as unknown as Promise<ConstitutionQuestion[]>
  },
}

export const chatApi = {
  /** 获取会话列表 */
  getConversations(): Promise<Conversation[]> {
    return http.get('/api/v1/conversations') as unknown as Promise<Conversation[]>
  },

  /** 获取消息列表 */
  getMessages(conversationId: string): Promise<ChatMessage[]> {
    return http.get(`/api/v1/conversations/${conversationId}/messages`) as unknown as Promise<ChatMessage[]>
  },

  /** 发送消息 */
  sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    return http.post(`/api/v1/conversations/${conversationId}/messages`, { content }) as unknown as Promise<ChatMessage>
  },

  /** 获取推荐问题 */
  getSuggestedQuestions(): Promise<Record<LocaleCode, string[]>> {
    return http.get('/api/v1/conversations/suggested-questions') as unknown as Promise<Record<LocaleCode, string[]>>
  },
}
