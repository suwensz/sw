import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from '@/i18n'
import '@/styles/index.css'

/**
 * 开发端入口（:5300）—— 内部研发工作台
 * - Mock 数据管理：浏览 / 覆盖各 Mock 数据集，联调免改代码
 * - i18n 覆盖检查：12 语种缺失键统计
 * - 环境与日志：环境切换、API 地址配置、运行日志
 * - Feature Flags：功能开关（写入 localStorage 供全端读取）
 */
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
