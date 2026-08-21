/**
 * 素衡OS · 生成 node_modules/.bin shim
 * 打包后的源码包丢失了 .bin 链接（pnpm 安装时生成）。
 * 本脚本为 node_modules 顶层直接依赖中带 bin 字段的包生成
 * POSIX(sh) + Windows(CMD) 两套 shim，行为与 pnpm 一致。
 * 用法：node scripts/gen-bins.cjs
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const nm = path.join(root, 'node_modules')
const binDir = path.join(nm, '.bin')

if (!fs.existsSync(nm)) {
  console.error('[gen-bins] node_modules 不存在，请先安装依赖')
  process.exit(1)
}
fs.mkdirSync(binDir, { recursive: true })

function getBin(pkgDir) {
  const pkgFile = path.join(pkgDir, 'package.json')
  if (!fs.existsSync(pkgFile)) return null
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
  } catch {
    return null
  }
  return pkg.bin || null
}

function posixShim(target) {
  return [
    '#!/bin/sh',
    'basedir=$(dirname "$(echo "$0" | sed -e \'s,\\\\,/,g\')")',
    'case `uname` in',
    '    *CYGWIN*|*MINGW*|*MSYS*) basedir=`cygpath -w "$basedir"`;;',
    'esac',
    '',
    'if [ -x "$basedir/node" ]; then',
    `  exec "$basedir/node" "$basedir/../${target}" "$@"`,
    'else',
    `  exec node "$basedir/../${target}" "$@"`,
    'fi',
    '',
  ].join('\n')
}

function cmdShim(target) {
  const winTarget = target.split('/').join('\\')
  return [
    '@ECHO off',
    'GOTO start',
    ':find_dp0',
    'SET dp0=%~dp0',
    'EXIT /b',
    ':start',
    'SETLOCAL',
    'CALL :find_dp0',
    '',
    'IF EXIST "%dp0%\\node.exe" (',
    '  SET "_prog=%dp0%\\node.exe"',
    ') ELSE (',
    '  SET "_prog=node"',
    '  SET PATHEXT=%PATHEXT:;.JS;=;%',
    ')',
    '',
    `endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\..\\${winTarget}" %*`,
    '',
  ].join('\r\n')
}

const entries = fs.readdirSync(nm, { withFileTypes: true })
let count = 0
const created = []

for (const e of entries) {
  if (e.name.startsWith('.')) continue
  const pkgDir = path.join(nm, e.name)
  if (!fs.existsSync(path.join(pkgDir, 'package.json'))) continue
  const bin = getBin(pkgDir)
  if (!bin) continue

  const bins = typeof bin === 'string' ? { [e.name]: bin } : bin
  for (const [name, rel] of Object.entries(bins)) {
    const target = path.posix.join(e.name, rel)
    const shimFile = path.join(binDir, name)
    fs.writeFileSync(shimFile, posixShim(target), { mode: 0o755 })
    fs.writeFileSync(shimFile + '.CMD', cmdShim(target))
    created.push(name)
    count++
  }
}

// 兜底：vite 与 vue-tsc 即使不在顶层也生成（保证脚本可运行）
const fallbacks = [
  ['vite', 'node_modules/vite/bin/vite.js'],
  ['vue-tsc', 'node_modules/vue-tsc/bin/vue-tsc.js'],
]
for (const [name, rel] of fallbacks) {
  const target = rel.replace('node_modules/', '')
  if (!created.includes(name) && fs.existsSync(path.join(nm, rel.replace('node_modules/', '')))) {
    fs.writeFileSync(path.join(binDir, name), posixShim(target), { mode: 0o755 })
    fs.writeFileSync(path.join(binDir, name + '.CMD'), cmdShim(target))
    created.push(name)
    count++
  }
}

console.log(`[gen-bins] 已生成 ${count} 个 .bin shim: ${created.join(', ')}`)
