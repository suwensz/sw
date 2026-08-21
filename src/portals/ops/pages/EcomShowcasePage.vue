<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tText } from '@/i18n'
import {
  analyzeImage,
  autoRetouch,
  fileToImage,
  generateProductCopy,
  generateProductVideo,
  isVideoSupported,
} from '@/services/mediaAI'
import {
  SHOWCASE_CATEGORIES,
  showcaseImage,
  type ShowcaseCategoryId,
  type ShowcaseSubId,
} from '@/mock/ecomShowcase'
import { useEcomShowcaseStore, type ShowcaseEditProduct } from '@/stores/ecomShowcase'
import { COUNTRY_SOCIAL_MAP, SOCIAL_APPS, SOCIAL_APP_MAP } from '@/mock/socialData'
import type { SocialAppId } from '@/types'

/**
 * 电商展示（运营端）
 * - 全部内容可编辑：品名/简介/深度说明/价格/库存/图片/分类，新增/删除产品，localStorage 持久化
 * - 产品图下方展示主销国家的当地主流社交软件，可增加/删除（编辑弹窗内勾选）
 * - 深度文案（品名/简介/详情）多语言：zh/en，其余语言回退英文
 */
const { t, locale } = useI18n()
const store = useEcomShowcaseStore()

type CatFilter = ShowcaseCategoryId | 'all'
type SubFilter = ShowcaseSubId | ''

const activeCat = ref<CatFilter>('all')
const activeSub = ref<SubFilter>('')
const detail = ref<ShowcaseEditProduct | null>(null)

const catCounts = computed(() => {
  const counts: Record<string, number> = { all: store.products.length }
  for (const c of SHOWCASE_CATEGORIES) {
    counts[c.id] = store.products.filter((p) => p.category === c.id).length
  }
  return counts
})

const filteredProducts = computed(() => {
  let list = store.products
  if (activeCat.value !== 'all') {
    list = list.filter((p) => p.category === activeCat.value)
  }
  if (activeSub.value) {
    list = list.filter((p) => p.sub === activeSub.value)
  }
  return list
})

const activeCategory = computed(() => SHOWCASE_CATEGORIES.find((c) => c.id === activeCat.value))

function selectCat(cat: CatFilter) {
  activeCat.value = cat
  activeSub.value = ''
}

function catName(cat: ShowcaseCategoryId): string {
  return t(SHOWCASE_CATEGORIES.find((c) => c.id === cat)!.nameKey)
}

function productName(p: ShowcaseEditProduct): string {
  return tText(p.name)
}

function priceLabel(p: ShowcaseEditProduct): string {
  const n = p.price.toLocaleString(locale.value === 'zh' || locale.value === 'zh-TW' ? 'zh-CN' : 'en-US')
  return `$${n}`
}

const detailVisible = computed({
  get: () => detail.value !== null,
  set: (v: boolean) => {
    if (!v) detail.value = null
  },
})

// ===== 社交软件（随国家） =====
const countryOptions = COUNTRY_SOCIAL_MAP.map((c) => ({
  value: c.code,
  label: `${c.flag} ${tText(c.name)}`,
}))

function countryOf(code: string) {
  return COUNTRY_SOCIAL_MAP.find((c) => c.code === code)
}

function appName(id: SocialAppId): string {
  return tText(SOCIAL_APP_MAP[id].name)
}
function appColor(id: SocialAppId): string {
  return SOCIAL_APP_MAP[id].color
}

// ===== 编辑 / 新增 =====
const editorVisible = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  category: 'hardware' as ShowcaseCategoryId,
  sub: '' as SubFilter,
  nameZh: '',
  nameEn: '',
  descZh: '',
  descEn: '',
  detailZh: '',
  detailEn: '',
  price: 0,
  originalPrice: undefined as number | undefined,
  stock: 0,
  sales: 0,
  rating: 4.5,
  image: '',
  market: 'SA',
  socialApps: [] as SocialAppId[],
  edge: false,
})

const formCategory = computed(() => SHOWCASE_CATEGORIES.find((c) => c.id === form.category))

// ===== AI 媒体能力：图片上传 / 自动修图 / AI 文案 / 短视频 =====
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const retouching = ref(false)
const copyLoading = ref(false)
/** 上传时的原始图（未修图），用于撤销 */
const originalImage = ref('')

const videoVisible = ref(false)
const videoLoading = ref(false)
const videoUrl = ref('')
const videoDuration = ref(8)

async function acceptFile(file: File | undefined | null) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning(t('portal.showcase.ai.notImage'))
    return
  }
  uploading.value = true
  try {
    const info = await fileToImage(file)
    form.image = info.dataUrl
    originalImage.value = info.dataUrl
  } catch {
    ElMessage.error(t('portal.showcase.ai.notImage'))
  } finally {
    uploading.value = false
  }
}

function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement
  void acceptFile(input.files?.[0])
  input.value = ''
}

function onDropImage(e: DragEvent) {
  void acceptFile(e.dataTransfer?.files?.[0])
}

async function onRetouch() {
  if (!form.image) {
    ElMessage.warning(t('portal.showcase.ai.videoNoImage'))
    return
  }
  retouching.value = true
  try {
    form.image = await autoRetouch(form.image)
    ElMessage.success(t('portal.showcase.ai.retouchDone'))
  } catch {
    ElMessage.error(t('portal.showcase.ai.retouchDone'))
  } finally {
    retouching.value = false
  }
}

function onRevertImage() {
  if (originalImage.value) form.image = originalImage.value
}

async function onAiCopy() {
  if (!form.image) {
    ElMessage.warning(t('portal.showcase.ai.videoNoImage'))
    return
  }
  copyLoading.value = true
  try {
    const features = await analyzeImage(form.image)
    const res = await generateProductCopy({
      features,
      categoryLabel: catName(form.category),
      nameZh: form.nameZh,
      nameEn: form.nameEn,
      price: Number(form.price) || 0,
    })
    if (!form.nameEn.trim() && res.nameEn) form.nameEn = res.nameEn
    form.descZh = res.descZh
    form.descEn = res.descEn
    form.detailZh = res.detailZh
    form.detailEn = res.detailEn
    ElMessage.success(
      t(res.source === 'llm' ? 'portal.showcase.ai.copyDone' : 'portal.showcase.ai.copyLocal'),
    )
  } catch {
    ElMessage.error(t('portal.showcase.ai.copyLocal'))
  } finally {
    copyLoading.value = false
  }
}

function openVideoDialog() {
  if (!form.image) {
    ElMessage.warning(t('portal.showcase.ai.videoNoImage'))
    return
  }
  videoUrl.value = ''
  videoVisible.value = true
}

async function onGenVideo() {
  if (!form.image || videoLoading.value) return
  if (!isVideoSupported()) {
    ElMessage.warning(t('portal.showcase.ai.videoUnsupported'))
    return
  }
  videoLoading.value = true
  videoUrl.value = ''
  try {
    videoUrl.value = await generateProductVideo({
      image: form.image,
      title: form.nameZh.trim() || form.nameEn.trim() || catName(form.category),
      subtitle: form.price > 0 ? `$${form.price}` : '',
      duration: videoDuration.value,
    })
    ElMessage.success(t('portal.showcase.ai.videoDone'))
  } catch {
    ElMessage.error(t('portal.showcase.ai.videoUnsupported'))
  } finally {
    videoLoading.value = false
  }
}

function onMarketChange(code: string) {
  // 切换主销国家时，社交软件自动同步为该国主流应用（仍可手动增删）
  const c = countryOf(code)
  form.socialApps = c ? [...c.apps] : []
}

function openAdd() {
  editingId.value = null
  Object.assign(form, {
    category: 'hardware',
    sub: '',
    nameZh: '',
    nameEn: '',
    descZh: '',
    descEn: '',
    detailZh: '',
    detailEn: '',
    price: 0,
    originalPrice: undefined,
    stock: 0,
    sales: 0,
    rating: 4.5,
    image: '',
    market: 'SA',
    socialApps: [...(countryOf('SA')?.apps ?? [])],
    edge: false,
  })
  originalImage.value = ''
  editorVisible.value = true
}

function openEdit(p: ShowcaseEditProduct, e?: Event) {
  e?.stopPropagation()
  editingId.value = p.id
  Object.assign(form, {
    category: p.category,
    sub: (p.sub ?? '') as SubFilter,
    nameZh: p.name.zh ?? '',
    nameEn: p.name.en ?? '',
    descZh: p.description.zh ?? '',
    descEn: p.description.en ?? '',
    detailZh: p.detail?.zh ?? '',
    detailEn: p.detail?.en ?? '',
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    sales: p.sales,
    rating: p.rating,
    image: p.image,
    market: p.market,
    socialApps: [...p.socialApps],
    edge: !!p.edge,
  })
  originalImage.value = p.image
  editorVisible.value = true
}

function saveForm() {
  if (!form.nameZh.trim() && !form.nameEn.trim()) {
    ElMessage.warning(t('portal.showcase.fieldNameEn'))
    return
  }
  const nameEn = form.nameEn.trim() || form.nameZh.trim()
  const image =
    form.image.trim() || showcaseImage(form.category, form.nameZh.trim() || nameEn, nameEn)
  const payload: Partial<ShowcaseEditProduct> = {
    category: form.category,
    sub: form.category === 'tcm' ? (form.sub || undefined) : undefined,
    name: { zh: form.nameZh.trim() || nameEn, en: nameEn },
    description: { zh: form.descZh.trim() || form.descEn.trim(), en: form.descEn.trim() },
    detail: { zh: form.detailZh.trim() || form.detailEn.trim(), en: form.detailEn.trim() },
    price: Number(form.price) || 0,
    originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
    stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
    sales: Math.max(0, Math.floor(Number(form.sales) || 0)),
    rating: Math.min(5, Math.max(0, Number(form.rating) || 0)),
    image,
    market: form.market,
    socialApps: [...form.socialApps],
    edge: form.category === 'phone' ? true : form.edge,
  }
  if (editingId.value) {
    store.updateProduct(editingId.value, payload)
    ElMessage.success(t('portal.showcase.save'))
  } else {
    store.addProduct({
      id: `sc-c-${Date.now()}`,
      custom: true,
      ...payload,
    } as ShowcaseEditProduct)
    ElMessage.success(t('portal.showcase.save'))
  }
  editorVisible.value = false
}

async function removeProduct(p: ShowcaseEditProduct, e?: Event) {
  e?.stopPropagation()
  try {
    await ElMessageBox.confirm(
      `${productName(p)}`,
      t('portal.showcase.delConfirm'),
      { type: 'warning', confirmButtonText: t('portal.showcase.del'), cancelButtonText: t('portal.showcase.cancel') },
    )
  } catch {
    return
  }
  store.removeProduct(p.id)
  if (detail.value?.id === p.id) detail.value = null
}

async function resetAll() {
  try {
    await ElMessageBox.confirm(
      t('portal.showcase.resetConfirm'),
      t('portal.showcase.reset'),
      { type: 'warning', confirmButtonText: t('portal.showcase.reset'), cancelButtonText: t('portal.showcase.cancel') },
    )
  } catch {
    return
  }
  store.resetAll()
  ElMessage.success(t('portal.showcase.reset'))
}
</script>

<template>
  <div class="showcase-page">
    <header class="showcase-hero">
      <div class="showcase-hero-text">
        <h1 class="showcase-hero-title">
          <el-icon :size="26" color="#d4a853"><Goods /></el-icon>
          {{ t('portal.showcase.title') }}
        </h1>
        <p class="showcase-hero-subtitle">{{ t('portal.showcase.subtitle') }}</p>
      </div>
      <div class="showcase-hero-actions">
        <el-tag type="warning" effect="plain" size="large" round>
          {{ t('portal.showcase.totalProducts') }} · {{ store.products.length }}
        </el-tag>
        <el-button type="primary" round @click="openAdd">
          <el-icon><Plus /></el-icon>{{ t('portal.showcase.add') }}
        </el-button>
        <el-button plain round @click="resetAll">
          <el-icon><RefreshLeft /></el-icon>{{ t('portal.showcase.reset') }}
        </el-button>
      </div>
    </header>

    <!-- 分类筛选：五金/建材、家电、手机（边缘产品）、箱包、中医养生 -->
    <nav class="showcase-cats">
      <button
        class="showcase-cat"
        :class="{ 'is-active': activeCat === 'all' }"
        @click="selectCat('all')"
      >
        <span class="showcase-cat-icon">🛍️</span>
        <span>{{ t('portal.showcase.all') }}</span>
        <span class="showcase-cat-count">{{ catCounts.all }}</span>
      </button>
      <button
        v-for="c in SHOWCASE_CATEGORIES"
        :key="c.id"
        class="showcase-cat"
        :class="{ 'is-active': activeCat === c.id }"
        @click="selectCat(c.id)"
      >
        <span class="showcase-cat-icon">{{ c.icon }}</span>
        <span>{{ t(c.nameKey) }}</span>
        <span class="showcase-cat-count">{{ catCounts[c.id] }}</span>
      </button>
    </nav>

    <!-- 中医养生子分类：中药茶包 / 中医养生产品 -->
    <nav v-if="activeCategory?.subs?.length" class="showcase-subs">
      <button
        v-for="s in activeCategory.subs"
        :key="s.id"
        class="showcase-sub"
        :class="{ 'is-active': activeSub === s.id }"
        @click="activeSub = activeSub === s.id ? '' : s.id"
      >
        {{ t(s.nameKey) }}
        <span class="showcase-cat-count">
          {{ store.products.filter((p) => p.sub === s.id).length }}
        </span>
      </button>
    </nav>

    <!-- 产品网格：图-类别-说明同步，图下方当地社交软件 -->
    <section class="showcase-grid">
      <article
        v-for="p in filteredProducts"
        :key="p.id"
        class="showcase-card"
        @click="detail = p"
      >
        <div class="showcase-card-img">
          <img :src="p.image" :alt="productName(p)" loading="lazy" />
          <el-tag v-if="p.edge" class="showcase-edge-tag" size="small" type="warning" effect="dark">
            {{ t('portal.showcase.edgeTag') }}
          </el-tag>
          <div class="showcase-card-tools">
            <button class="sc-tool" :title="t('portal.showcase.edit')" @click="openEdit(p, $event)">
              <el-icon><EditPen /></el-icon>
            </button>
            <button class="sc-tool danger" :title="t('portal.showcase.del')" @click="removeProduct(p, $event)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>
        <div class="showcase-card-body">
          <!-- 图片下方：随国家的当地主流社交软件 -->
          <div v-if="p.socialApps.length" class="showcase-social-row">
            <span class="showcase-social-flag">{{ countryOf(p.market)?.flag || '🌍' }}</span>
            <button
              v-for="a in p.socialApps"
              :key="a"
              class="showcase-social-app"
              :style="{ color: appColor(a), borderColor: appColor(a) + '66', background: appColor(a) + '0f' }"
              @click.stop
            >
              <span class="showcase-social-dot" :style="{ background: appColor(a) }"></span>{{ appName(a) }}
            </button>
          </div>
          <div class="showcase-card-cat">
            <span class="showcase-card-cat-dot" :style="{ background: activeCategory?.colorA || '#1a6b5c' }"></span>
            {{ catName(p.category) }}
            <span v-if="p.sub" class="showcase-card-sub">
              · {{ t(`portal.showcase.subs.${p.sub}`) }}
            </span>
          </div>
          <h3 class="showcase-card-name">{{ productName(p) }}</h3>
          <p class="showcase-card-desc">{{ tText(p.description) }}</p>
          <div class="showcase-card-foot">
            <span class="showcase-price">
              {{ priceLabel(p) }}
              <del v-if="p.originalPrice" class="showcase-price-old">${{ p.originalPrice }}</del>
            </span>
            <span class="showcase-meta">
              ★{{ p.rating }} · {{ t('portal.showcase.sold') }} {{ p.sales.toLocaleString() }}
            </span>
          </div>
        </div>
      </article>
      <el-empty v-if="!filteredProducts.length" :description="t('shop.noProducts')" class="showcase-empty" />
    </section>

    <!-- 产品详情：深度文案多语言同步 -->
    <el-dialog v-model="detailVisible" width="560px" class="showcase-dialog">
      <template v-if="detail">
        <div class="showcase-detail">
          <img :src="detail.image" :alt="productName(detail)" class="showcase-detail-img" />
          <div class="showcase-detail-body">
            <div v-if="detail.socialApps.length" class="showcase-social-row">
              <span class="showcase-social-flag">{{ countryOf(detail.market)?.flag || '🌍' }}</span>
              <span
                v-for="a in detail.socialApps"
                :key="a"
                class="showcase-social-app"
                :style="{ color: appColor(a), borderColor: appColor(a) + '66', background: appColor(a) + '0f' }"
              >
                <span class="showcase-social-dot" :style="{ background: appColor(a) }"></span>{{ appName(a) }}
              </span>
            </div>
            <div class="showcase-card-cat">
              <span class="showcase-card-cat-dot"></span>
              {{ catName(detail.category) }}
              <span v-if="detail.sub"> · {{ t(`portal.showcase.subs.${detail.sub}`) }}</span>
            </div>
            <h3 class="showcase-detail-name">{{ productName(detail) }}</h3>
            <div class="showcase-detail-price">
              {{ priceLabel(detail) }}
              <del v-if="detail.originalPrice" class="showcase-price-old">${{ detail.originalPrice }}</del>
              <el-tag size="small" type="success" effect="plain">
                {{ t('portal.showcase.stock') }} {{ detail.stock.toLocaleString() }}
              </el-tag>
            </div>
            <div class="showcase-detail-actions">
              <el-button size="small" type="primary" plain @click="openEdit(detail)">
                <el-icon><EditPen /></el-icon>{{ t('portal.showcase.edit') }}
              </el-button>
              <el-button size="small" type="danger" plain @click="removeProduct(detail)">
                <el-icon><Delete /></el-icon>{{ t('portal.showcase.del') }}
              </el-button>
            </div>
          </div>
        </div>
        <el-divider />
        <h4 class="showcase-detail-section">{{ t('portal.showcase.deepDetail') }}</h4>
        <p class="showcase-detail-text">{{ tText(detail.detail) }}</p>
        <el-divider />
        <h4 class="showcase-detail-section">{{ t('portal.showcase.descSection') }}</h4>
        <p class="showcase-detail-text">{{ tText(detail.description) }}</p>
      </template>
    </el-dialog>

    <!-- 编辑 / 新增产品：全部内容可修改 -->
    <el-dialog v-model="editorVisible" width="640px" class="showcase-dialog" destroy-on-close>
      <template #header>
        <span class="showcase-editor-title">
          {{ editingId ? t('portal.showcase.editTitle') : t('portal.showcase.addTitle') }}
        </span>
      </template>

      <h4 class="showcase-form-section">{{ t('portal.showcase.secBasic') }}</h4>
      <div class="showcase-form-grid">
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldNameZh') }}</label>
          <el-input v-model="form.nameZh" />
        </div>
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldNameEn') }}</label>
          <el-input v-model="form.nameEn" />
        </div>
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.formCategory') }}</label>
          <el-select v-model="form.category" @change="form.sub = ''">
            <el-option
              v-for="c in SHOWCASE_CATEGORIES"
              :key="c.id"
              :value="c.id"
              :label="`${c.icon} ${t(c.nameKey)}`"
            />
          </el-select>
        </div>
        <div v-if="formCategory?.subs?.length" class="showcase-form-item">
          <label>{{ t('portal.showcase.subSection') }}</label>
          <el-select v-model="form.sub" clearable>
            <el-option v-for="s in formCategory.subs" :key="s.id" :value="s.id" :label="t(s.nameKey)" />
          </el-select>
        </div>
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldPrice') }}</label>
          <el-input-number v-model="form.price" :min="0" :precision="2" class="w-full" />
        </div>
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldOriginal') }}</label>
          <el-input-number v-model="form.originalPrice" :min="0" :precision="2" class="w-full" />
        </div>
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldStock') }}</label>
          <el-input-number v-model="form.stock" :min="0" class="w-full" />
        </div>
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldSales') }}</label>
          <el-input-number v-model="form.sales" :min="0" class="w-full" />
        </div>
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldRating') }}</label>
          <el-input-number v-model="form.rating" :min="0" :max="5" :precision="1" class="w-full" />
        </div>
        <div class="showcase-form-item showcase-form-item-wide">
          <label>{{ t('portal.showcase.fieldImage') }}</label>
          <div
            class="ai-media"
            :class="{ 'has-image': !!form.image, 'is-loading': uploading }"
            role="button"
            tabindex="0"
            @click="fileInputRef?.click()"
            @keydown.enter.prevent="fileInputRef?.click()"
            @dragover.prevent
            @drop.prevent="onDropImage"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              hidden
              @change="onPickFile"
            />
            <img v-if="form.image" :src="form.image" class="ai-media-preview" alt="product" />
            <div v-else class="ai-media-empty">
              <el-icon :size="28" color="#1a6b5c"><UploadFilled /></el-icon>
              <span>{{ t('portal.showcase.ai.uploadTip') }}</span>
            </div>
            <div v-if="uploading" class="ai-media-mask">
              <el-icon class="is-loading" :size="22"><Loading /></el-icon>
            </div>
          </div>
          <div class="ai-media-actions">
            <el-button size="small" :loading="retouching" :disabled="!form.image" @click.stop="onRetouch">
              <el-icon v-if="!retouching"><MagicStick /></el-icon>
              {{ t('portal.showcase.ai.retouch') }}
            </el-button>
            <el-button
              v-if="originalImage && originalImage !== form.image"
              size="small"
              text
              @click.stop="onRevertImage"
            >
              {{ t('portal.showcase.ai.revert') }}
            </el-button>
            <el-button
              size="small"
              type="primary"
              :loading="copyLoading"
              :disabled="!form.image"
              @click.stop="onAiCopy"
            >
              <el-icon v-if="!copyLoading"><EditPen /></el-icon>
              {{ t('portal.showcase.ai.copy') }}
            </el-button>
            <el-button size="small" plain :disabled="!form.image" @click.stop="openVideoDialog">
              <el-icon><VideoCamera /></el-icon>
              {{ t('portal.showcase.ai.video') }}
            </el-button>
          </div>
          <el-input
            v-model="form.image"
            :placeholder="t('portal.showcase.fieldImageTip')"
            clearable
            class="ai-media-url"
          />
        </div>
      </div>

      <h4 class="showcase-form-section">{{ t('portal.showcase.secText') }}</h4>
      <div class="showcase-form-grid">
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldDescZh') }}</label>
          <el-input v-model="form.descZh" type="textarea" :rows="2" />
        </div>
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldDescEn') }}</label>
          <el-input v-model="form.descEn" type="textarea" :rows="2" />
        </div>
        <div class="showcase-form-item showcase-form-item-wide">
          <label>{{ t('portal.showcase.fieldDetailZh') }}</label>
          <el-input v-model="form.detailZh" type="textarea" :rows="3" />
        </div>
        <div class="showcase-form-item showcase-form-item-wide">
          <label>{{ t('portal.showcase.fieldDetailEn') }}</label>
          <el-input v-model="form.detailEn" type="textarea" :rows="3" />
        </div>
      </div>

      <h4 class="showcase-form-section">{{ t('portal.showcase.secSocial') }}</h4>
      <div class="showcase-form-grid">
        <div class="showcase-form-item">
          <label>{{ t('portal.showcase.fieldMarket') }}</label>
          <el-select v-model="form.market" @change="onMarketChange">
            <el-option v-for="o in countryOptions" :key="o.value" :value="o.value" :label="o.label" />
          </el-select>
        </div>
        <div class="showcase-form-item showcase-form-item-wide">
          <label>{{ t('portal.showcase.fieldSocial') }}</label>
          <el-checkbox-group v-model="form.socialApps" class="showcase-app-checks">
            <el-checkbox v-for="a in SOCIAL_APPS" :key="a.id" :value="a.id">
              <span class="showcase-app-opt" :style="{ color: a.color }">
                <span class="showcase-social-dot" :style="{ background: a.color }"></span>{{ tText(a.name) }}
              </span>
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <template #footer>
        <el-button @click="editorVisible = false">{{ t('portal.showcase.cancel') }}</el-button>
        <el-button type="primary" @click="saveForm">{{ t('portal.showcase.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- AI 商品短视频合成 -->
    <el-dialog
      v-model="videoVisible"
      width="520px"
      class="showcase-dialog"
      append-to-body
      destroy-on-close
    >
      <template #header>
        <span class="showcase-editor-title">{{ t('portal.showcase.ai.videoTitle') }}</span>
      </template>
      <p class="ai-video-tip">{{ t('portal.showcase.ai.videoTip') }}</p>
      <div class="ai-video-controls">
        <span class="ai-video-label">{{ t('portal.showcase.ai.videoDuration') }}</span>
        <el-radio-group v-model="videoDuration" :disabled="videoLoading">
          <el-radio-button :value="6">6 {{ t('portal.showcase.ai.seconds') }}</el-radio-button>
          <el-radio-button :value="8">8 {{ t('portal.showcase.ai.seconds') }}</el-radio-button>
          <el-radio-button :value="12">12 {{ t('portal.showcase.ai.seconds') }}</el-radio-button>
        </el-radio-group>
        <el-button
          type="primary"
          round
          :loading="videoLoading"
          @click="onGenVideo"
        >
          <el-icon v-if="!videoLoading"><VideoCamera /></el-icon>
          {{ t('portal.showcase.ai.videoGen') }}
        </el-button>
      </div>
      <div v-if="videoLoading" class="ai-video-box is-loading-box">
        <el-icon class="is-loading" :size="30" color="#1a6b5c"><Loading /></el-icon>
      </div>
      <video
        v-else-if="videoUrl"
        :src="videoUrl"
        controls
        autoplay
        loop
        muted
        class="ai-video-box"
      />
      <div v-else class="ai-video-box is-empty-box">
        <el-icon :size="30" color="#c0c4cc"><VideoCamera /></el-icon>
      </div>
      <div v-if="videoUrl" class="ai-video-foot">
        <a :href="videoUrl" download="suheng-product.webm" class="ai-video-download">
          <el-button type="success" plain round>
            <el-icon><Download /></el-icon>
            {{ t('portal.showcase.ai.videoDownload') }}
          </el-button>
        </a>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.showcase-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 8px 4px 40px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.showcase-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 26px;
  border-radius: 16px;
  background: linear-gradient(135deg, #b8860b, #8a5a2b);
  color: #faf8f3;
  box-shadow: 0 10px 28px rgba(138, 90, 43, 0.26);
}
.showcase-hero-text {
  flex: 1;
  min-width: 0;
}
.showcase-hero-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.showcase-hero-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(250, 248, 243, 0.8);
}
.showcase-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.showcase-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.showcase-cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 999px;
  background: #ffffff;
  font-size: 13px;
  color: var(--color-text-regular, #606266);
  cursor: pointer;
  transition: all 0.2s ease;
}
.showcase-cat:hover {
  border-color: rgba(26, 107, 92, 0.45);
  color: #1a6b5c;
}
.showcase-cat.is-active {
  background: #1a6b5c;
  border-color: #1a6b5c;
  color: #faf8f3;
  font-weight: 600;
}
.showcase-cat-icon {
  font-size: 15px;
}
.showcase-cat-count {
  min-width: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  font-size: 11px;
  text-align: center;
  line-height: 16px;
}
.showcase-cat.is-active .showcase-cat-count {
  background: rgba(250, 248, 243, 0.22);
}
.showcase-subs {
  display: flex;
  gap: 8px;
  margin-top: -6px;
}
.showcase-sub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px dashed rgba(26, 107, 92, 0.4);
  border-radius: 999px;
  background: rgba(26, 107, 92, 0.05);
  font-size: 12px;
  color: #1a6b5c;
  cursor: pointer;
}
.showcase-sub.is-active {
  background: #1a6b5c;
  color: #faf8f3;
  border-style: solid;
  border-color: #1a6b5c;
}
.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.showcase-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid var(--color-border, #e4e7ed);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.showcase-card:hover {
  border-color: rgba(26, 107, 92, 0.4);
  box-shadow: 0 8px 22px rgba(15, 43, 36, 0.12);
  transform: translateY(-2px);
}
.showcase-card-img {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}
.showcase-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.showcase-edge-tag {
  position: absolute;
  top: 10px;
  left: 10px;
}
.showcase-card-tools {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease;
}
.showcase-card:hover .showcase-card-tools {
  opacity: 1;
  transform: translateY(0);
}
.sc-tool {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  color: #1a6b5c;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
}
.sc-tool:hover {
  background: #1a6b5c;
  color: #fff;
}
.sc-tool.danger:hover {
  background: #c45656;
}
.showcase-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px 14px;
}
/* 图片下方：当地主流社交软件行 */
.showcase-social-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--color-border, #e4e7ed);
}
.showcase-social-flag {
  font-size: 15px;
}
.showcase-social-app {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease;
  background: transparent;
}
.showcase-social-app:hover {
  transform: translateY(-1px);
}
.showcase-social-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.showcase-card-cat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-secondary, #909399);
}
.showcase-card-cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1a6b5c;
}
.showcase-card-sub {
  color: #b8860b;
}
.showcase-card-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
  line-height: 1.45;
}
.showcase-card-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary, #909399);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.showcase-card-foot {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.showcase-price {
  font-size: 17px;
  font-weight: 800;
  color: #b8860b;
}
.showcase-price-old {
  margin-left: 5px;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary, #909399);
}
.showcase-meta {
  font-size: 11px;
  color: var(--color-text-secondary, #909399);
}
.showcase-empty {
  grid-column: 1 / -1;
}
.showcase-detail {
  display: flex;
  gap: 16px;
}
.showcase-detail-img {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}
.showcase-detail-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.showcase-detail-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
  line-height: 1.5;
}
.showcase-detail-price {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 800;
  color: #b8860b;
}
.showcase-detail-actions {
  display: flex;
  gap: 8px;
}
.showcase-detail-section {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1a6b5c;
}
.showcase-detail-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--color-text-regular, #606266);
}
/* 编辑表单 */
.showcase-editor-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary, #303133);
}
.showcase-form-section {
  margin: 14px 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1a6b5c;
  padding-left: 8px;
  border-left: 3px solid #b8860b;
}
.showcase-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
}
.showcase-form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.showcase-form-item-wide {
  grid-column: 1 / -1;
}
.showcase-form-item label {
  font-size: 12px;
  color: var(--color-text-secondary, #909399);
}
.showcase-form-item .w-full {
  width: 100%;
}
.showcase-app-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}
.showcase-app-opt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}
/* AI 媒体能力：上传 / 修图 / 文案 / 短视频 */
.ai-media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
  border: 1.5px dashed rgba(26, 107, 92, 0.4);
  border-radius: 12px;
  background: rgba(26, 107, 92, 0.04);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.ai-media:hover,
.ai-media.has-image {
  border-color: #1a6b5c;
  background: #eef7f2;
}
.ai-media-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}
.ai-media-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--color-text-secondary, #909399);
  padding: 0 16px;
  text-align: center;
}
.ai-media-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(250, 248, 243, 0.7);
}
.ai-media-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}
.ai-media-url {
  margin-top: 8px;
}
/* 短视频弹窗 */
.ai-video-tip {
  margin: 4px 0 12px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--color-text-secondary, #909399);
}
.ai-video-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.ai-video-label {
  font-size: 12.5px;
  color: var(--color-text-regular, #606266);
}
.ai-video-box {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  background: #f7faf8;
  border: 1px solid #e4ebe7;
  display: block;
}
.is-loading-box,
.is-empty-box {
  display: flex;
  align-items: center;
  justify-content: center;
}
.ai-video-foot {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.ai-video-download {
  text-decoration: none;
}
@media (max-width: 640px) {
  .showcase-form-grid {
    grid-template-columns: 1fr;
  }
  .showcase-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
