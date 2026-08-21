# 12. 设计规范

完整设计规范见仓库根目录 `DESIGN.md`。以下是要点摘要。

## 气质与意象
- **意象锚点**：宋代青瓷与素绢——温润如玉的深青釉色，搭配宣纸般的浅米底，点缀暖金如烛光
- **气质**：东方简约、沉静专业、温润可信，现代设计语言下的东方留白

## Design Tokens

### 主色
| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `#1a6b5c` | 深青绿，主色 |
| `--color-primary-light` | `#2d8b7a` | hover |
| `--color-primary-dark` | `#124d42` | 深色背景 |
| `--color-accent` | `#d4a853` | 暖金，点缀 |
| `--color-bg` | `#faf8f3` | 浅米背景 |

### 状态色
| Token | 值 | 用途 |
|-------|-----|------|
| `--color-success` | `#52a67a` | 健康绿 |
| `--color-warning` | `#e6a23c` | 警示橙 |
| `--color-danger` | `#d96b5c` | 警示红（偏暖） |

### 圆角
- 按钮/输入框：8px
- 卡片：12px
- 弹窗：16px
- 胶囊标签：999px

### 阴影
- 卡片：`0 2px 12px rgba(26, 107, 92, 0.06)`
- hover：`0 4px 20px rgba(26, 107, 92, 0.12)`

## 布局
- 最大内容宽度：1280px
- 导航栏高度：64px（PC）/ 56px（移动端）
- 断点：sm 640 / md 768 / lg 1024 / xl 1280

## 动效
- 过渡：200ms（基础）/ 300ms（页面切换）
- 缓动：`cubic-bezier(0.4, 0, 0.2, 1)`
- 卡片 hover：`translateY(-2px)` + 阴影加深

## 设计禁忌
- ❌ 科技蓝/紫蓝渐变
- ❌ 高饱和大红大绿
- ❌ 古风边框/纹样堆砌
- ❌ 冷灰色调
- ❌ 金色大面积使用（仅点缀）
- ❌ 粗糙阴影和强发光

## 字体
- 中文：`"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif`
- 英文/数字：`"Inter", "Helvetica Neue", Arial, sans-serif`
- Google Fonts CN 域名：`fonts.googleapis.cn`
