import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from '@/i18n'
import '@/styles/index.css'

/**
 * 开发端入口（:5300）—— 占位骨架
 * 规划功能：API 密钥管理、Webhook 配置、i18n 翻译编辑器、构建发布、日志查看。
 * 待管理端 / 运营端稳定后按需开发。
 */
const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.mount('#app')
