/**
 * 素衡OS · 门户通用引导
 * 开发端 / 运营端 / 管理端 三个独立门户共用此引导，
 * 统一注入 Pinia、Vue Router、Vue I18n、Element Plus（中文）与全局图标。
 */
import { createApp } from 'vue'
import type { Component } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { Router } from 'vue-router'
import { i18n } from '@/i18n'
import '@/styles/index.css'
import './portal.css'

export function createPortalApp(root: Component, router: Router) {
  const app = createApp(root)

  // 全局注册 Element Plus 图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  app.use(createPinia())
  app.use(router)
  app.use(i18n)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')
}
