<script setup lang="ts">
import { computed } from 'vue'
import type { EcgPoint } from '@/types'

const props = withDefaults(defineProps<{
  data: EcgPoint[]
  width?: number
  height?: number
  color?: string
  animated?: boolean
}>(), {
  width: 600,
  height: 160,
  color: '#1a6b5c',
  animated: true,
})

const pathD = computed(() => {
  if (!props.data.length) return ''
  const maxV = 1.5
  const minV = -0.5
  const range = maxV - minV
  const pts = props.data.map((p, i) => {
    const x = (i / (props.data.length - 1)) * props.width
    const y = props.height - ((p.v - minV) / range) * props.height - 8
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  })
  return pts.join(' ')
})

const gridPath = computed(() => {
  let d = ''
  // 竖线
  for (let i = 0; i <= 10; i++) {
    const x = (i / 10) * props.width
    d += `M${x},0 L${x},${props.height} `
  }
  // 横线
  for (let i = 0; i <= 4; i++) {
    const y = (i / 4) * props.height
    d += `M0,${y} L${props.width},${y} `
  }
  return d
})
</script>

<template>
  <div class="ecg-container">
    <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height" preserveAspectRatio="none" class="ecg-svg">
      <defs>
        <linearGradient :id="`ecgGrad-${color.replace('#', '')}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path :d="gridPath" fill="none" stroke="rgba(26,107,92,0.08)" stroke-width="0.5" />
      <path :d="pathD" fill="none" :stroke="color" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"
        :class="{ 'ecg-line': animated }" vector-effect="non-scaling-stroke" />
    </svg>
  </div>
</template>

<style scoped>
.ecg-container {
  width: 100%;
  background: #fafcfb;
  border-radius: 8px;
  overflow: hidden;
}
.ecg-svg { width: 100%; height: 100%; display: block; }
.ecg-line {
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: draw 2s ease-out forwards;
}
@keyframes draw {
  to { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ecg-line { animation: none; stroke-dasharray: none; }
}
</style>
