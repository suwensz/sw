// 素衡OS 源码打包脚本（源码版：不含 node_modules / .git / 密钥库 / 日志）
// 产出 ZIP 到桌面，含 dist 构建产物，解压后 npm install 即可运行
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

const projectRoot = __dirname
const stamp = '20260824'
const outputPath = path.join('C:\\Users\\Administrator\\Desktop', `SuhengOS-source-${stamp}.zip`)

// 排除目录（依赖、版本库、临时、构建缓存、密钥）
const excludeDirs = new Set([
  'node_modules',
  '.git',
  'release',
  'asar_stage',
  'asar_extract',
  'asar_check',
  '_stage',
  'dist-node_modules',
])

// 排除文件名
const excludeFiles = new Set([
  '.vault.json',            // 密钥保险箱（含加密凭据，不入包）
  'pack-source.cjs',
  'pack-source-this.cjs',
  'tsconfig.tsbuildinfo',
])

// 排除文件模式
const excludeFilePatterns = [
  /\.log$/,
  /\.tsbuildinfo$/,
  /^_tmp_/,
  /^app\.asar$/,
]

function shouldExcludeDir(relPath) {
  const parts = relPath.replace(/\\/g, '/').split('/')
  return parts.some((p) => excludeDirs.has(p))
}

function shouldExcludeFile(fileName) {
  if (excludeFiles.has(fileName)) return true
  return excludeFilePatterns.some((pat) => pat.test(fileName))
}

const output = fs.createWriteStream(outputPath)
const archive = archiver('zip', { zlib: { level: 6 } })

let fileCount = 0
let totalBytes = 0

output.on('close', () => {
  console.log('=== DONE ===')
  console.log(`Files: ${fileCount}`)
  console.log(`Uncompressed: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`ZIP size: ${(archive.pointer() / 1024 / 1024).toFixed(1)} MB`)
  console.log(`Output: ${outputPath}`)
})

archive.on('warning', (err) => { if (err.code !== 'ENOENT') console.warn('Warning:', err.message) })
archive.on('error', (err) => { console.error('Error:', err); process.exit(1) })
archive.on('entry', (entry) => {
  fileCount++
  if (entry.stats) totalBytes += entry.stats.size
  if (fileCount % 500 === 0) {
    process.stdout.write(`\r  Packing... ${fileCount} files, ${(totalBytes / 1024 / 1024).toFixed(0)} MB`)
  }
})

archive.pipe(output)

function walkDir(dir, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = path.relative(baseDir, fullPath)
    if (entry.isDirectory()) {
      if (shouldExcludeDir(relPath)) continue
      walkDir(fullPath, baseDir)
    } else if (entry.isFile()) {
      if (shouldExcludeFile(entry.name)) continue
      if (shouldExcludeDir(relPath)) continue
      archive.file(fullPath, { name: relPath.replace(/\\/g, '/') })
    }
  }
}

console.log('Scanning project directory...')
walkDir(projectRoot, projectRoot)
console.log(`\n  Found ${fileCount} files, finalizing zip...`)
archive.finalize()
