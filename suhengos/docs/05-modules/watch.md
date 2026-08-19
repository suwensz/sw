# 素衡智能手表监测模块

## 文件位置
- `src/views/health/WatchPage.vue`
- `src/components/EcgChart.vue`
- `src/stores/health.ts`
- `src/mock/watch.ts`

## 六项核心指标
| 指标 | 字段 | 单位 | 正常范围 |
|------|------|------|----------|
| 血压 | bp | mmHg | 90/60 ~ 120/80 |
| 血糖 | glucose | mmol/L | 3.9 ~ 6.1 |
| 血脂 | lipids | mmol/L | < 5.2 |
| 尿酸 | uricAcid | μmol/L | 150 ~ 420 |
| 肌酐 | creatinine | μmol/L | 44 ~ 133 |
| 心电图 | ecg | - | 窦性心律 |

## 设备状态
- 电量百分比（`battery`）
- 在线/离线/同步中（`status`）
- 最后同步时间（`lastSync`）
- 设备型号、固件版本

## Store 关键 API

```ts
const health = useHealthStore()

health.pairWatch(memberId, device)   // 配对新设备
health.updateMetric(watchId, metric) // 更新指标
health.syncWatch(watchId)            // 同步数据
health.removeWatch(watchId)
health.generateWatchAlert(watchId, abnormalMetrics)  // 异常生成预警
```

## 心电图组件（EcgChart.vue）
- SVG `<path>` 渲染 PQRST 波形
- `stroke-dasharray` + `stroke-dashoffset` 动画描边
- 支持播放/暂停
- 异常波形（房颤/早搏/ST 段异常）视觉警示

## 手表悬浮窗（桌面端）
桌面端通过托盘菜单或 IPC 打开 `watch:openWatcher` 事件，创建 360×520 无边框置顶窗口，加载 `/health/watch?mode=floating`，实时查看监测数据。

## 数据结构
```ts
interface SmartWatch {
  id: string
  name: string
  model: string
  ownerId: string
  status: 'online' | 'offline' | 'syncing'
  battery: number
  lastSync: string
  firmware: string
  metrics: {
    bp: MetricValue
    glucose: MetricValue
    lipids: MetricValue
    uricAcid: MetricValue
    creatinine: MetricValue
    ecg: EcgData
  }
}
```
