# 素衡OS 应用图标

## 图标文件

打包前请将以下格式的图标放入本目录：

| 文件 | 平台 | 规格 |
|------|------|------|
| `icon.ico` | Windows | 256×256，多分辨率（16/32/48/64/128/256） |
| `icon.icns` | macOS | 1024×1024，含 @1x/@2x |
| `icon.png` | Linux | 512×512 |

## 从 SVG 生成

已提供 `icon.svg` 源文件。使用以下工具转换：

### 使用 ImageMagick
```bash
# PNG (512x512)
convert -background none -resize 512x512 icon.svg icon.png

# ICO (Windows, 多尺寸)
convert -background none icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### 使用在线工具
- https://cloudconvert.com/svg-to-ico
- https://icon.kitchen/

### macOS icns
```bash
# 创建 iconset 目录
mkdir icon.iconset
for s in 16 32 64 128 256 512; do
  convert -background none -resize ${s}x${s} icon.svg icon.iconset/icon_${s}x${s}.png
  convert -background none -resize $((s*2))x$((s*2)) icon.svg icon.iconset/icon_${s}x${s}@2x.png
done
iconutil -c icns icon.iconset
```

## 设计说明
- 主体：青瓷绿圆角方块背景
- 图案：暖金色"中"字抽象（竖线+四横，寓意中医）
- 点缀：底部半透明绿色心电波形（寓意健康监测）
- 外环：淡白圆环（如青瓷开片）
