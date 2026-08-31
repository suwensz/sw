/**
 * 门户元信息（开发端 / 运营端 / 管理端共用）
 * 各门户在 App.vue 中 provide，登录页等公共组件 inject 后按当前门户渲染品牌信息，
 * 避免三端共用组件出现「运营端」这类写死的品牌文案。
 */
import type { InjectionKey } from 'vue'

export interface PortalMeta {
  /** 门户全称，如「素衡OS 开发端」 */
  title: string
  /** 门户英文名，如「Developer Console」 */
  subtitle: string
  /** 门户简称，如「开发端」 */
  portalTag: string
}

export const PORTAL_META_KEY: InjectionKey<PortalMeta> = Symbol('suheng-portal-meta')

export const FALLBACK_PORTAL_META: PortalMeta = {
  title: '素衡OS',
  subtitle: 'Suheng OS',
  portalTag: '门户',
}
