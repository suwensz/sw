# 健康预警引擎

## 文件位置
- `src/views/health/AlertsPage.vue`
- `src/stores/health.ts`
- `src/mock/wuyun.ts`
- `src/composables/useSpeech.ts`（语音播报）
- `src/composables/useDesktop.ts`（桌面通知）

## 三大中医数据库

### 1. 五运六气（WuyunLiuqi）
以出生年天干地支推算：
- **主运**：木/火/土/金/水（岁运）
- **客运**：年岁天干对应的五运推移
- **司天/在泉**：年支对应的六气（少阴君火、太阴湿土等）
- **六气**：六步气位（厥阴风木、少阴君火、少阳相火、太阴湿土、阳明燥金、太阳寒水）

### 2. 流年气候（ClimateData）
60 年周期气候数据：
- 年份、干支、岁运、气候特征、温度偏差、降水偏差
- 易发疾病倾向
- 对应调理原则

### 3. 三因司天（SanyinShit ian）
- 岁运太过/不及
- 方宜（地域适宜）
- 民病类型
- 运气方
- 胜复郁发

## 预警生成逻辑

```
家人出生年月日 → 天干地支
              → 主运/客运/司天/在泉
              + 当前流年气候（climateByYear[当前年]）
              + 节气
              ↓
         匹配易发疾病 + 脏腑倾向
              ↓
         生成 HealthAlert（含药食同源方案）
```

## 药食同源方案
每条预警包含：
- **方剂**（3 个）：名称、组成、用法
- **食材**（4 种）：名称、功效、推荐量
- **穴位**（3 个）：名称、定位、按摩方法
- **药膳**（1 道）：名称、做法、功效

## 预警等级
| 等级 | 颜色 | 场景 |
|------|------|------|
| danger | 警示红 | 手表指标异常、高危疾病倾向 |
| warning | 警示橙 | 中等风险、气候诱发 |
| info | 青瓷 | 季节性养生提示 |
| success | 健康绿 | 良好状态 |

## 语音播报
```ts
import { useSpeech } from '@/composables/useSpeech'
const { speak, speakQueue, stop, isSpeaking } = useSpeech()
speak(alert.title + alert.symptoms)       // 单条
speakQueue(alerts.map(a => a.title))      // 队列
```
- 基于 Web Speech API `speechSynthesis`
- 自动跟随 i18n locale 选择语音（zh/en/ja/ko/es/fr 映射）

## 桌面通知
桌面端运行时，危险级预警自动弹出系统通知，点击跳转预警中心：
```ts
import { useDesktop } from '@/composables/useDesktop'
const { sendAlert } = useDesktop()
sendAlert({ title: '血压偏高预警', body: '...', level: 'danger' })
```
