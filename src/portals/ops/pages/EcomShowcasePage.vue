<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tText } from '@/i18n'
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
    image: p.image.startsWith('data:') ? '' : p.image,
    market: p.market,
    socialApps: [...p.socialApps],
    edge: !!p.edge,
  })
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
          <el-input v-model="form.image" :placeholder="t('portal.showcase.fieldImageTip')" clearable />
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
