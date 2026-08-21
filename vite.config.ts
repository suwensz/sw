import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig({
  // Electron 打包时使用相对路径，Web 部署时使用绝对路径
  base: process.env.ELECTRON_BUILD ? './' : '/',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      // 多入口：主站 + 开发端 / 运营端 / 管理端 三个独立门户
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'dev-portal': path.resolve(__dirname, 'dev-portal.html'),
        'ops-portal': path.resolve(__dirname, 'ops-portal.html'),
        'admin-portal': path.resolve(__dirname, 'admin-portal.html'),
      },
    },
  },
  server: {
    port: Number(process.env.DEPLOY_RUN_PORT) || 5000,
    host: true,
    hmr: {
      port: 6000,
      path: '/hot/vite-hmr',
    },
    // AI 服务本地转发代理：浏览器请求 /api/llm → llm-proxy.cjs(127.0.0.1:8898)
    // 规避浏览器直连 DeepSeek/豆包/扣子的 CORS 限制（llm-proxy 需先启动）
    proxy: {
      '/api/llm': {
        target: 'http://127.0.0.1:8898',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/llm$/, '/llm'),
        configure: (proxy) => {
          // 代理未启动时返回 502，让前端直连兜底（DeepSeek 支持浏览器跨域）
          proxy.on('error', () => undefined)
        },
      },
    },
  },
})
