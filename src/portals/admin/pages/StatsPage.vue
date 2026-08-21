<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'

const { t } = useI18n()

const orderChartRef = ref<HTMLDivElement | null>(null)
const userChartRef = ref<HTMLDivElement | null>(null)
const sourceChartRef = ref<HTMLDivElement | null>(null)

let orderChart: echarts.ECharts | null = null
let userChart: echarts.ECharts | null = null
let sourceChart: echarts.ECharts | null = null

const PRIMARY = '#1a6b5c'
const ACCENT = '#d4a853'

const orderOption: echarts.EChartsOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [
    {
      name: '订单数',
      type: 'bar',
      barWidth: 22,
      itemStyle: { color: PRIMARY, borderRadius: [4, 4, 0, 0] },
      data: [22, 28, 25, 34, 30, 41, 38],
    },
  ],
}

const userOption: echarts.EChartsOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'] },
  yAxis: { type: 'value' },
  series: [
    {
      name: '新增用户',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: PRIMARY },
      areaStyle: { color: 'rgba(26, 107, 92, 0.12)' },
      data: [8, 12, 15, 18, 24, 30, 42, 55],
    },
  ],
}

const sourceOption: echarts.EChartsOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      name: '访问来源',
      type: 'pie',
      radius: ['42%', '68%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {d}%' },
      data: [
        { value: 45, name: '主站直达', itemStyle: { color: PRIMARY } },
        { value: 25, name: '搜索引擎', itemStyle: { color: ACCENT } },
        { value: 18, name: '社交媒体', itemStyle: { color: '#7fb3a8' } },
        { value: 12, name: '其他', itemStyle: { color: '#c9bfae' } },
      ],
    },
  ],
}

function initCharts() {
  if (orderChartRef.value) orderChart = echarts.init(orderChartRef.value)
  if (userChartRef.value) userChart = echarts.init(userChartRef.value)
  if (sourceChartRef.value) sourceChart = echarts.init(sourceChartRef.value)
  orderChart?.setOption(orderOption)
  userChart?.setOption(userOption)
  sourceChart?.setOption(sourceOption)
}

function handleResize() {
  orderChart?.resize()
  userChart?.resize()
  sourceChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  orderChart?.dispose()
  userChart?.dispose()
  sourceChart?.dispose()
})
</script>

<template>
  <div class="portal-page">
    <h2>数据统计</h2>
    <p class="portal-stat-desc">平台经营数据概览（演示数据，基于前端 Mock）。</p>

    <el-row :gutter="16">
      <el-col :span="12" :xs="24" style="margin-bottom: 16px">
        <el-card shadow="never">
          <template #header><b>{{ t('admin.stats.range7d') }} · 订单</b></template>
          <div ref="orderChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12" :xs="24" style="margin-bottom: 16px">
        <el-card shadow="never">
          <template #header><b>{{ t('admin.stats.userTrend') }}</b></template>
          <div ref="userChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-card shadow="never">
      <template #header><b>{{ t('admin.stats.storageDist') }}</b></template>
      <div ref="sourceChartRef" style="height: 300px"></div>
    </el-card>
  </div>
</template>
