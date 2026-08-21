# 体质测评模块

## 文件位置
- `src/views/AssessmentPage.vue`
- `src/mock/constitution.ts`
- `src/stores/app.ts`（保存测评结果）

## 九种体质
平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质

## 问卷流程
1. 每个体质维度若干题（5 档分值：1-5）
2. 逐题呈现，进度条显示完成度
3. 自动翻题，也可上一题修改
4. 完成后计算各维度平均分（换算为百分制）

## 结果展示
- 主导体质 + 次要体质
- **ECharts 雷达图**（9 维度）
- 各维度得分条
- 饮食建议 + 起居建议
- 推荐商品（基于体质关联）

## Store 持久化
结果存 `useAppStore().assessmentResult`，同会话内跨页面保留。

## 数据结构
```ts
interface ConstitutionType {
  id: string
  name: LocaleText
  description: LocaleText
  traits: LocaleText
  dietAdvice: LocaleText
  lifestyleAdvice: LocaleText
  recommendedProducts: string[]  // product ids
}
```
