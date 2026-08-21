#!/usr/bin/env node
/* 检测 node_modules/.pnpm 中入口文件缺失（打包/安装中断导致）的包 */
const fs = require('fs')
const path = require('path')

const pnpmDir = path.join(__dirname, '..', 'node_modules', '.pnpm')
const broken = []
const total = []

function collectFiles(pkg, out) {
  if (pkg.main) out.push(pkg.main)
  if (pkg.module) out.push(pkg.module)
  if (pkg.types) out.push(pkg.types)
  if (pkg.typings) out.push(pkg.typings)
  if (pkg.exports && typeof pkg.exports === 'object') {
    for (const key of Object.keys(pkg.exports)) {
      const v = pkg.exports[key]
      if (typeof v === 'string') out.push(v)
      else if (v && typeof v === 'object') {
        for (const k of ['types', 'import', 'require', 'default']) {
          if (typeof v[k] === 'string') out.push(v[k])
        }
      }
    }
  }
}

for (const dir of fs.readdirSync(pnpmDir)) {
  if (dir.startsWith('.')) continue
  const nm = path.join(pnpmDir, dir, 'node_modules')
  if (!fs.existsSync(nm)) continue
  for (const scope of fs.readdirSync(nm)) {
    const scopePath = path.join(nm, scope)
    if (scope.startsWith('@')) {
      if (!fs.statSync(scopePath).isDirectory()) continue
      for (const n of fs.readdirSync(scopePath)) {
        check(path.join(scope, n), path.join(scopePath, n))
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
  if (!pkg.version) return
  total.push(name)
  const files = []
  collectFiles(pkg, files)
  if (!files.length) return
  const missing = files.filter((f) => f && !fs.existsSync(path.join(base, f)))
  if (missing.length) {
    broken.push({ name, version: pkg.version, base, missing: missing.slice(0, 2) })
  }
}

console.error(`checked ${total.length} packages, broken: ${broken.length}`)
for (const b of broken) {
  console.log(`${b.name}@${b.version} -> ${b.base}`)
  console.log(`   missing: ${b.missing.join(', ')}`)
}
