import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

/**
 * 多端口多入口架构（一套代码库，四个端）：
 *  - client 客户端 :5000  —— 消费者/患者（健康组 + 电商组）
 *  - admin  管理端 :5100  —— 系统管理员（用户/商品/订单/内容审核/看板）
 *  - ops    运营端 :5200  —— 电商运营（竞品/供应链/需求/创意/Listing）
 *  - dev    开发端 :5300  —— 开发者工具（预留）
 *
 * 启动：vite --mode admin  （client 为默认，无需 mode）
 * 构建：vite build --mode ops  → 产物输出到 dist-ops/
 *
 * 注意：dev 模式关闭 dts 生成（dts: false）—— 多个 vite 进程并发写
 * src/auto-imports.d.ts / src/components.d.ts 会触发 watcher 无限重载，
 * 导致事件循环卡死（Windows 文件锁）。dts 仅在 build 时统一生成。
 */
const APPS = {
  client: { port: 5000, hmrPort: 6000, entry: 'index.html' },
  admin: { port: 5100, hmrPort: 6100, entry: 'admin.html' },
  ops: { port: 5200, hmrPort: 6200, entry: 'ops.html' },
  dev: { port: 5300, hmrPort: 6300, entry: 'dev.html' },
} as const

type AppName = keyof typeof APPS

function resolveApp(mode: string): AppName {
  return (mode && mode in APPS ? mode : 'client') as AppName
}

// 类型声明文件（构建时生成，dev 时忽略其变更避免重载循环）
const DTS_FILES = ['**/src/auto-imports.d.ts', '**/src/components.d.ts']

export default defineConfig(({ mode, command }) => {
  const appName = resolveApp(mode)
  const app = APPS[appName]
  const isBuild = command === 'build'

  return {
    // Electron 打包时使用相对路径，Web 部署时使用绝对路径
    base: process.env.ELECTRON_BUILD ? './' : '/',
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'vue-router', 'pinia'],
        dts: isBuild ? 'src/auto-imports.d.ts' : false,
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: isBuild ? 'src/components.d.ts' : false,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      // 客户端保持 dist（Electron 打包依赖 dist/**），其余端独立目录
      outDir: appName === 'client' ? 'dist' : `dist-${appName}`,
      rollupOptions: {
        input: {
          [appName]: path.resolve(__dirname, app.entry),
        },
      },
    },
    server: {
      port: Number(process.env.DEPLOY_RUN_PORT) || app.port,
      host: true,
      hmr: {
        port: app.hmrPort,
        path: '/hot/vite-hmr',
      },
      watch: {
        ignored: DTS_FILES,
      },
    },
  }
})
