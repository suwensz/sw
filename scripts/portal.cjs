/**
 * 素衡OS · 门户启动/构建辅助脚本
 * 用法：
 *   node scripts/portal.cjs dev dev        # 启动开发端 dev server
 *   node scripts/portal.cjs dev ops        # 启动运营端 dev server
 *   node scripts/portal.cjs dev admin      # 启动管理端 dev server
 *   node scripts/portal.cjs build ops      # 构建运营端
 * 通过环境变量 PORTAL 告知 vite.portal.config.ts 使用哪个门户入口。
 */
const { spawn } = require('child_process')
const path = require('path')

const mode = process.argv[2] || 'dev' // dev | build
const portal = process.argv[3] || 'dev' // dev | ops | admin

const PORTALS = { dev: 'dev', ops: 'ops', admin: 'admin' }
if (!PORTALS[portal]) {
  console.error(`[portal.cjs] 未知门户: ${portal}，可选: dev / ops / admin`)
  process.exit(1)
}

const viteBin = path.join(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js')
const configFile = path.join(__dirname, '..', 'vite.portal.config.ts')

const args = [viteBin]
if (mode === 'build') args.push('build')
args.push('--config', configFile)

console.log(`[portal.cjs] ${mode === 'build' ? '构建' : '启动'} ${portal} 门户...`)

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: { ...process.env, PORTAL: portal },
})

child.on('error', (err) => {
  console.error('[portal.cjs] 启动失败:', err.message)
  process.exit(1)
})
child.on('exit', (code) => process.exit(code ?? 0))
