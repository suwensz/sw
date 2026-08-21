#!/usr/bin/env node
/* 批量恢复 node_modules/.pnpm 中被裁剪的包（从 npmmirror 下载 tarball 覆盖解压） */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const pnpmDir = path.join(ROOT, 'node_modules', '.pnpm')
const DRY = process.argv.includes('--dry')

function existsEntry(base, rel) {
  if (!rel) return true
  rel = rel.replace(/^\.\//, '')
  const p = path.join(base, rel)
  if (fs.existsSync(p)) return true
  // 无扩展名尝试
  for (const ext of ['.js', '.cjs', '.mjs', '.json', '.node']) {
    if (fs.existsSync(p + ext)) return true
  }
  for (const idx of ['index.js', 'index.cjs', 'index.mjs', 'index.json']) {
    if (fs.existsSync(path.join(p, idx))) return true
  }
  // 目录带 package.json
  if (fs.existsSync(path.join(p, 'package.json'))) return true
  return false
}

function collectEntries(pkg, out) {
  if (pkg.main) out.push(pkg.main)
  if (pkg.module) out.push(pkg.module)
  if (pkg.types) out.push(pkg.types)
  if (pkg.typings) out.push(pkg.typings)
  if (pkg.exports && typeof pkg.exports === 'object') {
    for (const key of Object.keys(pkg.exports)) {
      const v = pkg.exports[key]
      if (typeof v === 'string') {
        if (!v.includes('*')) out.push(v)
      } else if (v && typeof v === 'object') {
        for (const k of ['types', 'import', 'require', 'default']) {
          if (typeof v[k] === 'string' && !v[k].includes('*')) out.push(v[k])
        }
      }
    }
  }
}

// name@version -> [目录...]
const broken = new Map()

for (const dir of fs.readdirSync(pnpmDir)) {
  if (dir.startsWith('.')) continue
  const nm = path.join(pnpmDir, dir, 'node_modules')
  if (!fs.existsSync(nm)) continue
  for (const scope of fs.readdirSync(nm)) {
    const scopePath = path.join(nm, scope)
    if (scope.startsWith('@')) {
      if (!fs.statSync(scopePath).isDirectory()) continue
      for (const n of fs.readdirSync(scopePath)) {
        check(scope + '/' + n, path.join(scopePath, n))
      }
    } else {
      check(scope, scopePath)
    }
  }
}

function check(name, base) {
  const pkgPath = path.join(base, 'package.json')
  if (!fs.existsSync(pkgPath)) return
  let pkg
  try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) } catch { return }
  if (!pkg.version || base.includes('_tmp_')) return
  const entries = []
  collectEntries(pkg, entries)
  if (!entries.length) return
  const missing = entries.filter((e) => !existsEntry(base, e))
  if (missing.length) {
    const key = `${name}@${pkg.version}`
    if (!broken.has(key)) broken.set(key, { name, version: pkg.version, targets: [] })
    broken.get(key).targets.push(base)
  }
}

const list = [...broken.values()]
console.log(`需要恢复的包（去重后）：${list.length}`)

if (DRY) {
  for (const b of list) console.log(`${b.name}@${b.version} (${b.targets.length} 处)`)
  process.exit(0)
}

// 生成 bash 恢复脚本（execSync+bash 在 Windows 下不可靠，改为外部执行）
const scriptPath = path.join(ROOT, '.fix-packages.sh')
const lines = ['set -o pipefail']
for (const b of list) {
  const tarName = b.name.includes('/') ? b.name.split('/')[1] : b.name
  const url = `https://registry.npmmirror.com/${b.name}/-/${tarName}-${b.version}.tgz`
  for (const target of b.targets) {
    const posixTarget = path.relative(ROOT, target).split(path.sep).join('/')
    lines.push(`echo "FIX ${b.name}@${b.version}"`)
    lines.push(`curl -sL --max-time 90 "${url}" | tar -xz -C "${posixTarget}" --strip-components=1 || echo "FAIL ${b.name}@${b.version} -> ${posixTarget}"`)
  }
}
fs.writeFileSync(scriptPath, lines.join('\n') + '\n')
console.log(`已生成 ${scriptPath}（共 ${lines.length - 1} 行命令），请在 bash 中执行：
  NODE_OPTIONS= bash .fix-packages.sh`)
