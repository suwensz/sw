/**
 * 素衡OS · 门户独立 Vite 配置
 * 由 scripts/portal.cjs 调用，通过环境变量 PORTAL 选择：
 *   dev   -> 开发端（dev-portal.html）
 *   ops   -> 运营端（ops-portal.html）
 *   admin -> 管理端（admin-portal.html）
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

const PORTALS = {
  dev: { html: 'dev-portal.html', port: 6101 },
  ops: { html: 'ops-portal.html', port: 6102 },
  admin: { html: 'admin-portal.html', port: 6103 },
}

const name = process.env.PORTAL || 'dev'
const portal = PORTALS[name] || PORTALS.dev

export default defineConfig({
  base: './',
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
    outDir: `dist-portals/${name}`,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        portal: path.resolve(__dirname, portal.html),
      },
    },
  },
  server: {
    port: portal.port,
    host: true,
    open: `/${portal.html}`,
    // AI 服务本地转发代理（同 vite.config.ts，规避 CORS）
    proxy: {
      '/api/llm': {
        target: 'http://127.0.0.1:8898',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/llm$/, '/llm'),
        configure: (proxy) => {
          proxy.on('error', () => undefined)
        },
      },
    },
  },
})
