# 家人管理模块

## 文件位置
- `src/views/health/FamilyPage.vue`
- `src/stores/health.ts`
- `src/mock/wuyun.ts`（五运六气运算）

## 功能
- 添加/编辑/删除家人
- 字段：姓名、性别、出生年月日、关系、身高、体重、过敏史、既往病史
- 自动推算：年龄、生肖、BMI、中医体质倾向
- 每位家人绑定 0~N 台素衡智能手表
- 出生年月日 → 天干地支 → 五运六气运算 → 参与健康预警生成

## Store 关键 API

```ts
const health = useHealthStore()

health.addFamilyMember({
  name: '张三', gender: 'male', birthDate: '1980-05-15',
  relation: 'father', height: 175, weight: 72,
  allergies: [], medicalHistory: []
})

health.updateFamilyMember(id, { weight: 70 })
health.removeFamilyMember(id)
health.selectFamily(id)
```

## 五运六气运算（mock/wuyun.ts）

```ts
import { getWuyunByBirth, getZodiac, calcAge } from '@/mock/wuyun'

// 天干地支
const { gan, zhi, zodiac, wuyun, liuqi } = getWuyunByBirth('1980-05-15')
// gan: '庚'  zhi: '申'  zodiac: '猴'
// wuyun: { zhuYun, keYun, siTian, zaiQuan }
```

## 数据结构
```ts
interface FamilyMember {
  id: string
  name: string
  gender: 'male' | 'female' | 'other'
  birthDate: string          // YYYY-MM-DD
  relation: string
  avatar?: string
  height?: number            // cm
  weight?: number            // kg
  bmi?: number
  allergies: string[]
  medicalHistory: string[]
  constitution?: string      // 体质倾向
  watches: string[]          // 绑定的设备 ID
  createdAt: string
}
```
