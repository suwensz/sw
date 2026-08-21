// 素衡OS · 商品媒体 AI 服务（运营端电商展示）
// 1) 图片上传：本地文件 → Canvas 压缩 → dataURL（可直接随产品入 localStorage）
// 2) 自动修图：亮度 / 对比度 / 饱和度增强（电商主图优化预设，可撤销）
// 3) AI 识别写文案：图像特征分析（主色 / 明度 / 宽高比）+ askAI 云端生成，本地模板兜底
// 4) 商品短视频：Canvas + MediaRecorder 实时合成 Ken Burns 动态视频（可下载 webm）
import { askAI } from '@/services/llm'

/* ---------------- 基础图片工具 ---------------- */

export interface ImageInfo {
  dataUrl: string
  width: number
  height: number
}

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}

/** 本地文件 → 压缩 dataURL（最长边 maxSide，JPEG 90%） */
export async function fileToImage(file: File, maxSide = 1280): Promise<ImageInfo> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.9), width: w, height: h }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/* ---------------- 自动修图 ---------------- */

export type RetouchStrength = 'light' | 'standard' | 'strong'

const RETOUCH_FILTER: Record<RetouchStrength, string> = {
  light: 'brightness(1.04) contrast(1.05) saturate(1.06)',
  standard: 'brightness(1.08) contrast(1.12) saturate(1.15)',
  strong: 'brightness(1.14) contrast(1.2) saturate(1.28)',
}

/** 自动修图：电商主图优化（提亮 + 增强对比与饱和），返回新 dataURL */
export async function autoRetouch(src: string, strength: RetouchStrength = 'standard'): Promise<string> {
  const img = await loadImage(src, true)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.filter = RETOUCH_FILTER[strength]
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.92)
}

/* ---------------- 图像特征分析 ---------------- */

export interface ImageFeatures {
  /** 主色 HEX */
  dominant: string
  /** 主色中文名 */
  colorName: string
  /** 平均明度 0~1 */
  brightness: number
  /** 宽高比 */
  aspect: number
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function colorNameOf(h: number, s: number, l: number): string {
  if (l > 0.85) return '白色'
  if (l < 0.12) return '黑色'
  if (s < 0.12) return '灰色'
  const deg = h * 360
  if (deg < 15 || deg >= 345) return '红色'
  if (deg < 40) return l < 0.4 ? '棕色' : '橙色'
  if (deg < 70) return '黄色'
  if (deg < 160) return '绿色'
  if (deg < 200) return '青色'
  if (deg < 260) return '蓝色'
  if (deg < 300) return '紫色'
  return '粉红色'
}

/** 图像特征分析：缩样取主色 / 明度 / 宽高比 */
export async function analyzeImage(src: string): Promise<ImageFeatures> {
  const img = await loadImage(src, true)
  const n = 48
  const canvas = document.createElement('canvas')
  canvas.width = n
  canvas.height = n
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, n, n)
  const data = ctx.getImageData(0, 0, n, n).data
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  const count = data.length / 4
  r = Math.round(r / count)
  g = Math.round(g / count)
  b = Math.round(b / count)
  const [h, s, l] = rgbToHsl(r, g, b)
  return {
    dominant: `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`,
    colorName: colorNameOf(h, s, l),
    brightness: Number(l.toFixed(2)),
    aspect: Number((img.naturalWidth / img.naturalHeight).toFixed(2)),
  }
}

/* ---------------- AI 识别商品写文案 ---------------- */

export interface ProductCopyParams {
  features: ImageFeatures
  /** 分类名（当前界面语言） */
  categoryLabel: string
  nameZh: string
  nameEn: string
  price: number
}

export interface ProductCopy {
  nameEn: string
  descZh: string
  descEn: string
  detailZh: string
  detailEn: string
  source: 'llm' | 'local'
}

/** 从 AI 回答中提取 JSON 对象（容忍 ```json 围栏与前后杂文） */
function extractJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

/** 本地兜底文案：按图片特征 + 分类模板生成 */
function localCopy(p: ProductCopyParams): ProductCopy {
  const name = p.nameZh.trim() || p.nameEn.trim() || p.categoryLabel
  const en = p.nameEn.trim() || name
  const tone =
    p.features.brightness > 0.7 ? '清新明亮' : p.features.brightness < 0.3 ? '沉稳大气' : '均衡经典'
  const priceTag = p.price > 0 ? `，批发价 $${p.price}` : ''
  return {
    nameEn: en,
    descZh: `${name}｜${p.categoryLabel}精选款。${p.features.colorName}主调设计，${tone}，工艺扎实、品质稳定，适合批发采购与跨境分销。`,
    descEn: `${en} | Premium ${p.categoryLabel} selection with ${p.features.colorName} tone design, solid craftsmanship, ideal for wholesale and cross-border distribution.`,
    detailZh: `${name}采用${p.features.colorName}主色调整体设计，视觉${tone}。整机/整件出厂前经 3% 抽检并附质检报告，支持样品试单与第三方验货；支持小批量起订，量大价优，可按客户要求定制包装${priceTag}。`,
    detailEn: `${en} features a ${p.features.colorName} dominant design with a ${p.features.brightness > 0.7 ? 'bright' : 'classic'} look. Each batch is 3% sampled with QC reports; samples and third-party inspection supported. Low MOQ, volume discounts and custom packaging available${p.price > 0 ? `, wholesale from $${p.price}` : ''}.`,
    source: 'local',
  }
}

/** AI 识别商品图片并生成文案：云端 LLM 优先（依据图像特征描述），本地模板兜底 */
export async function generateProductCopy(p: ProductCopyParams): Promise<ProductCopy> {
  const name = p.nameZh.trim() || p.nameEn.trim() || p.categoryLabel
  const question =
    `请为电商商品撰写中英双语文案。商品信息：分类「${p.categoryLabel}」，品名「${name}」，价格 $${p.price || '待定'}。` +
    `商品图片 AI 视觉分析结果：主色${p.features.colorName}（${p.features.dominant}），明度 ${p.features.brightness}，宽高比 ${p.features.aspect}。` +
    '请依据以上视觉特征推断商品风格与卖点，只返回 JSON（不要多余文字）：' +
    '{"nameEn":"英文品名","descZh":"中文简介30字内","descEn":"English description within 20 words","detailZh":"中文详情80字内","detailEn":"English detail within 60 words"}'
  const res = await askAI('ecom', question)
  if (res.source === 'llm' && res.answer) {
    const j = extractJson(res.answer)
    if (j && typeof j.descZh === 'string' && typeof j.descEn === 'string') {
      const s = (k: string) => (typeof j[k] === 'string' ? (j[k] as string).trim() : '')
      const local = localCopy(p)
      return {
        nameEn: s('nameEn') || local.nameEn,
        descZh: s('descZh') || local.descZh,
        descEn: s('descEn') || local.descEn,
        detailZh: s('detailZh') || local.detailZh,
        detailEn: s('detailEn') || local.detailEn,
        source: 'llm',
      }
    }
  }
  return localCopy(p)
}

/* ---------------- 商品短视频合成 ---------------- */

export interface VideoOptions {
  image: string
  title: string
  /** 片尾展示（如价格） */
  subtitle: string
  /** 秒 */
  duration?: number
}

/** 检测浏览器是否支持 Canvas 视频合成 */
export function isVideoSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  )
}

function pickMime(): string | null {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? null
}

function drawRoundImg(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number },
  scale: number,
  panX: number,
): void {
  const { x, y, w, h } = box
  ctx.save()
  ctx.beginPath()
  const r = 18
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, w, h)
  // Ken Burns：等比放大填满裁剪框
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  const cover = Math.max(w / iw, h / ih) * scale
  const dw = iw * cover
  const dh = ih * cover
  ctx.drawImage(img, x + (w - dw) / 2 + panX, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

/**
 * 商品短视频合成：720×720 Canvas + MediaRecorder 实时录制。
 * 品牌渐变背景 + 图片 Ken Burns 动态展示 + 标题/片尾字幕 + 底部进度条。
 * 返回可下载的 webm Blob URL。
 */
export async function generateProductVideo(opts: VideoOptions): Promise<string> {
  if (!isVideoSupported()) throw new Error('unsupported')
  const mime = pickMime()
  if (!mime) throw new Error('unsupported')

  const img = await loadImage(opts.image, true)
  const size = 720
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const stream = canvas.captureStream(30)
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data)
  }

  const durationMs = Math.max(3, opts.duration ?? 8) * 1000
  const start = performance.now()

  return new Promise<string>((resolve, reject) => {
    rec.onerror = () => reject(new Error('recorder error'))
    rec.onstop = () => resolve(URL.createObjectURL(new Blob(chunks, { type: mime })))

    function easeInOut(t: number): number {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    }

    function frame(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const e = easeInOut(t)

      // 背景：品牌深绿渐变
      const bg = ctx.createLinearGradient(0, 0, size, size)
      bg.addColorStop(0, '#124d42')
      bg.addColorStop(1, '#1a6b5c')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, size, size)
      // 背景装饰光斑
      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#d4a853'
      ctx.beginPath()
      ctx.arc(size * 0.82, size * 0.16, 130 + 30 * Math.sin(t * Math.PI * 2), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      // 商品图：Ken Burns 缩放 + 平移
      const box = { x: 70, y: 110, w: size - 140, h: size - 220 }
      drawRoundImg(ctx, img, box, 1 + 0.12 * e, 26 * e - 13)

      // 顶部标题（前 85% 时间展示，淡入淡出）
      const titleAlpha = t < 0.1 ? t / 0.1 : t > 0.82 ? Math.max(0, (0.94 - t) / 0.12) : 1
      if (titleAlpha > 0) {
        ctx.globalAlpha = titleAlpha
        ctx.fillStyle = '#faf8f3'
        ctx.font = '700 40px "Microsoft YaHei", "PingFang SC", sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.35)'
        ctx.shadowBlur = 8
        const title = opts.title.length > 14 ? opts.title.slice(0, 13) + '…' : opts.title
        ctx.fillText(title, size / 2, 74)
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }

      // 片尾字幕（价格等）
      if (t > 0.86 && opts.subtitle) {
        const a = Math.min(1, (t - 0.86) / 0.1)
        ctx.globalAlpha = a
        ctx.fillStyle = '#d4a853'
        ctx.font = '800 52px "Microsoft YaHei", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(opts.subtitle, size / 2, size - 58)
        ctx.globalAlpha = 1
      }

      // 底部进度条
      ctx.fillStyle = 'rgba(250,248,243,0.25)'
      ctx.fillRect(120, size - 26, size - 240, 5)
      ctx.fillStyle = '#d4a853'
      ctx.fillRect(120, size - 26, (size - 240) * t, 5)

      if (t < 1) {
        requestAnimationFrame(frame)
      } else {
        // 收尾静置 0.4s 保证编码完整
        window.setTimeout(() => rec.stop(), 400)
      }
    }

    rec.start(200)
    requestAnimationFrame(frame)
  })
}
