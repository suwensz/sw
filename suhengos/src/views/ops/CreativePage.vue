<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOpsStore } from '@/stores/ops'
import type { CreativeAsset } from '@/types'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const ops = useOpsStore()

const activeTab = ref<'image' | 'video'>('image')
const imagePrompt = ref('')
const videoPrompt = ref('')
const aspectRatio = ref('1:1')
const videoDuration = ref(15)
const generating = ref(false)
const activeFilter = ref<'all' | 'image' | 'video'>('all')

async function doGenerate() {
  if (activeTab.value === 'image') {
    if (!imagePrompt.value.trim()) return
    generating.value = true
    await ops.generateImage(imagePrompt.value, aspectRatio.value)
    generating.value = false
    imagePrompt.value = ''
  } else {
    if (!videoPrompt.value.trim()) return
    generating.value = true
    await ops.generateVideo(videoPrompt.value, videoDuration.value)
    generating.value = false
    videoPrompt.value = ''
  }
}

const samplePrompts = [
  '青瓷色背景，中药材玻璃瓶居中，暖光侧打，专业电商主图',
  '白色极简背景，枸杞特写，水珠，4K 商业摄影',
  '艾灸盒使用场景，暖色调，居家养生氛围',
  '人参礼盒平铺，红金色丝绸背景，节日送礼感',
]

function useSample(p: string) {
  imagePrompt.value = p
}

function downloadAsset(asset: CreativeAsset) {
  const link = document.createElement('a')
  link.href = asset.url
  link.download = `${asset.id}.${asset.type === 'image' ? 'png' : 'mp4'}`
  link.target = '_blank'
  link.click()
  ElMessage.success(t('common.success'))
}

const filteredAssets = computed(() =>
  ops.creativeAssets.filter((a) => activeFilter.value === 'all' || a.type === activeFilter.value),
)
</script>

<template>
  <div class="creative-page qh-container">
    <div class="page-header">
      <h1>{{ t('ops.creative.title') }}</h1>
      <p>{{ t('ops.creative.subtitle') }}</p>
    </div>

    <div class="creative-layout">
      <section class="generator qh-card">
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="t('ops.creative.generateImage')" name="image">
            <div class="form-block">
              <label>{{ t('ops.creative.imagePrompt') }}</label>
              <el-input v-model="imagePrompt" type="textarea" :rows="4" />
              <div class="sample-prompts">
                <span class="sample-label">示例：</span>
                <el-tag v-for="(p, i) in samplePrompts" :key="i" class="sample-tag" @click="useSample(p)">
                  {{ p.slice(0, 14) }}...
                </el-tag>
              </div>
            </div>
            <div class="form-block">
              <label>{{ t('ops.creative.aspectRatio') }}</label>
              <el-select v-model="aspectRatio" style="width: 100%">
                <el-option label="1:1 方形" value="1:1" />
                <el-option label="16:9 横版" value="16:9" />
                <el-option label="9:16 竖版" value="9:16" />
              </el-select>
            </div>
            <el-button type="primary" size="large" style="width: 100%" :loading="generating" @click="doGenerate">
              {{ generating ? t('ops.creative.generating') : t('ops.creative.generateImage') }}
            </el-button>
            <div class="quick-actions">
              <el-button size="small" plain>{{ t('ops.creative.retouch') }}</el-button>
              <el-button size="small" plain>{{ t('ops.creative.removeBg') }}</el-button>
              <el-button size="small" plain>{{ t('ops.creative.enhance') }}</el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('ops.creative.generateVideo')" name="video">
            <div class="form-block">
              <label>{{ t('ops.creative.videoPrompt') }}</label>
              <el-input v-model="videoPrompt" type="textarea" :rows="5" />
            </div>
            <div class="form-row">
              <div class="form-block">
                <label>{{ t('ops.creative.duration') }} ({{ t('ops.creative.seconds') }})</label>
                <el-slider v-model="videoDuration" :min="5" :max="60" :step="5" show-stops />
              </div>
              <div class="form-block">
                <label>{{ t('ops.creative.aspectRatio') }}</label>
                <el-select v-model="aspectRatio" style="width: 100%">
                  <el-option label="16:9" value="16:9" />
                  <el-option label="9:16" value="9:16" />
                  <el-option label="1:1" value="1:1" />
                </el-select>
              </div>
            </div>
            <el-button type="primary" size="large" style="width: 100%" :loading="generating" @click="doGenerate">
              {{ generating ? t('ops.creative.generating') : t('ops.creative.generateVideo') }}
            </el-button>
          </el-tab-pane>
        </el-tabs>
      </section>

      <section class="assets-section">
        <div class="assets-header qh-card">
          <h3>{{ t('ops.creative.history') }}</h3>
          <div class="filter-tabs">
            <button :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">All</button>
            <button :class="{ active: activeFilter === 'image' }" @click="activeFilter = 'image'">IMG</button>
            <button :class="{ active: activeFilter === 'video' }" @click="activeFilter = 'video'">VID</button>
          </div>
        </div>
        <div class="assets-grid">
          <div v-for="asset in filteredAssets" :key="asset.id" class="asset-card qh-card">
            <div class="asset-preview">
              <img v-if="asset.type === 'image'" :src="asset.url" :alt="asset.prompt" />
              <div v-else class="video-thumb">
                <img :src="asset.thumbnail" />
                <div class="play-icon"><el-icon :size="28"><VideoPlay /></el-icon></div>
                <span class="duration">{{ asset.duration }}{{ t('ops.creative.seconds') }}</span>
              </div>
            </div>
            <div class="asset-info">
              <p class="asset-prompt">{{ asset.prompt?.slice(0, 50) }}...</p>
              <div class="asset-meta">
                <span>{{ asset.size }}</span>
                <span>{{ new Date(asset.createdAt).toLocaleDateString() }}</span>
              </div>
              <div class="asset-actions">
                <el-button size="small" @click="downloadAsset(asset)">
                  <el-icon style="margin-right:4px"><Download /></el-icon>{{ t('ops.creative.download') }}
                </el-button>
                <el-button size="small" type="primary" plain>{{ t('ops.creative.useForListing') }}</el-button>
                <el-button size="small" text @click="ops.deleteAsset(asset.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          <div v-if="!filteredAssets.length" class="empty-assets qh-card">
            <el-icon :size="48" color="var(--color-text-secondary)"><Picture /></el-icon>
            <p>暂无素材，输入描述开始生成</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.creative-page { padding: 24px 0 48px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 24px; margin: 0 0 4px; }
.page-header p { color: var(--color-text-secondary); margin: 0; font-size: 14px; }
.creative-layout { display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start; }
.generator { padding: 24px; position: sticky; top: 120px; }
.form-block { margin-bottom: 18px; }
.form-block label { display: block; font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 8px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sample-prompts { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.sample-label { font-size: 11px; color: var(--color-text-secondary); }
.sample-tag { cursor: pointer; transition: all 0.2s; }
.sample-tag:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.quick-actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.assets-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; margin-bottom: 16px; }
.assets-header h3 { margin: 0; font-size: 15px; color: var(--color-primary); }
.filter-tabs { display: flex; gap: 4px; }
.filter-tabs button { padding: 4px 12px; border: none; background: var(--color-bg-soft); border-radius: 6px; cursor: pointer; font-size: 13px; }
.filter-tabs button.active { background: var(--color-primary); color: #fff; }
.assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.asset-card { padding: 0; overflow: hidden; transition: all 0.2s; }
.asset-card:hover { transform: translateY(-2px); }
.asset-preview { width: 100%; aspect-ratio: 1; background: var(--color-bg-soft); overflow: hidden; position: relative; }
.asset-preview img { width: 100%; height: 100%; object-fit: cover; }
.video-thumb { position: relative; width: 100%; height: 100%; }
.play-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; background: rgba(0,0,0,0.5); width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.duration { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.asset-info { padding: 12px; }
.asset-prompt { font-size: 12px; color: var(--color-text-regular); margin: 0 0 8px; line-height: 1.5; height: 36px; overflow: hidden; }
.asset-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--color-text-secondary); margin-bottom: 10px; }
.asset-actions { display: flex; gap: 4px; flex-wrap: wrap; }
.empty-assets { grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--color-text-secondary); display: flex; flex-direction: column; align-items: center; gap: 12px; }
@media (max-width: 1024px) { .creative-layout { grid-template-columns: 1fr; } .generator { position: static; } }
</style>
