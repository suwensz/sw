# 9. Mock 数据规范

所有数据为前端 Mock，无真实后端。

## 文件清单

| 文件 | 数据 |
|------|------|
| `products.ts` | 8 款中医药商品（6 语名称/描述/成分/用法） |
| `constitution.ts` | 九种体质定义 + 问卷题 |
| `conversation.ts` | 智能体会话与初始消息 |
| `shop.ts` | 商品分类、币种汇率 |
| `wuyun.ts` | 五运六气、流年气候、三因司天、药食同源方案、天干地支运算 |
| `watch.ts` | 智能手表设备、监测指标、心电图采样点 |
| `operations.ts` | 竞品、供应商、需求趋势、创意素材、上架任务生成器 |

## 多语言字段
```ts
interface LocaleText {
  zh: string
  en: string
  ja: string
  ko: string
  es: string
  fr: string
}
```
通过 `tText(obj, locale)` 读取。

## 登录约定
- 密码任意 6 位以上即可登录
- 验证码任意 6 位数字
- 测试账号：`dev_user@coze.dev` / `dev123456`
- 注册信息存 localStorage，下次可用相同密码登录

## 五运六气运算
`wuyun.ts` 提供纯函数：
```ts
getWuyunByBirth(birthDate: string): {
  gan: string          // 天干
  zhi: string          // 地支
  zodiac: string       // 生肖
  age: number
  wuyun: { zhuYun: string; keYun: string; siTian: string; zaiQuan: string }
  liuqi: string[]
}
```

## 替换为真实后端
1. 创建 `src/api/` 目录，按模块拆分接口
2. 在 store action 中用 axios 替换 Mock import
3. 保留类型定义不变
4. 接口路径建议 `/api/v1/xxx`
