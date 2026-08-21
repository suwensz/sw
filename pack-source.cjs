const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

const projectRoot = 'C:\\Users\\Administrator\\WorkBuddy\\2026-08-18-01-25-20\\tcm-crossborder-ecommerce-agent'
const outputPath = 'C:\\Users\\Administrator\\WorkBuddy\\2026-08-18-14-10-31\\SuhengOS-full-source.zip'

// Directories to exclude (build output, temp, vcs metadata)
const excludeDirs = new Set([
  'release',        // 1.3GB Electron installer binaries
  '.git',           // Git metadata
  'asar_stage',     // Temp staging
  'asar_extract',   // Temp extraction
  'asar_check',     // Temp check
  '_stage',         // Temp staging
  'app.asar.unpacked', // Unpacked asar
  'node_modules\\.cache', // Build cache
])

// File patterns to exclude
const excludeFilePatterns = [
  /\.log$/,
  /\.tsbuildinfo$/,
  /^app\.asar$/,
  /^app_err\.log$/,
  /^app_out\.log$/,
]

// Also exclude this script itself and the output zip
const excludeFiles = new Set([
  'pack-source.js',
  'SuhengOS-full-source.zip',
  'SuhengOS-source-code.zip',
])

function shouldExcludeDir(relPath) {
  const parts = relPath.split(path.sep)
  for (const part of parts) {
    if (excludeDirs.has(part)) return true
    if (excludeDirs.has(relPath.replace(/\\/g, '/'))) return true
  }
  // Check normalized path
  const normalized = relPath.replace(/\\/g, '/')
  for (const dir of excludeDirs) {
    if (normalized.startsWith(dir.replace(/\\/g, '/'))) return true
  }
  return false
}

function shouldExcludeFile(fileName) {
  if (excludeFiles.has(fileName)) return true
  for (const pattern of excludeFilePatterns) {
    if (pattern.test(fileName)) return true
  }
  return false
}

const output = fs.createWriteStream(outputPath)
const archive = archiver('zip', { zlib: { level: 6 } })

let fileCount = 0
let totalBytes = 0

output.on('close', () => {
  console.log(`\n=== DONE ===`)
  console.log(`Files: ${fileCount}`)
  console.log(`Uncompressed: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`ZIP size: ${(archive.pointer() / 1024 / 1024).toFixed(1)} MB`)
  console.log(`Output: ${outputPath}`)
})

archive.on('warning', (err) => {
  if (err.code !== 'ENOENT') console.warn('Warning:', err.message)
})

archive.on('error', (err) => {
  console.error('Error:', err)
  process.exit(1)
})

archive.on('entry', (entry) => {
  fileCount++
  if (entry.stats) totalBytes += entry.stats.size
  if (fileCount % 500 === 0) {
    process.stdout.write(`\r  Packing... ${fileCount} files, ${(totalBytes / 1024 / 1024).toFixed(0)} MB`)
  }
})

archive.pipe(output)

// Walk the directory tree
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
