# WordPress.org Plugin Assets

这个目录同时保留可发布展示素材和旧截图。当前只允许发布 banner 与 icon；`screenshot-1.png` 到 `screenshot-5.png` 是 3.0 重构前的历史截图，内容已经失真，**不得上传到 WordPress.org SVN**。等管理界面冻结后再重新采集截图，并同步恢复 `README.txt` 的 Screenshots 区段。

## 文件

- `banner-772x250.png`
  - 标准横幅图
  - 尺寸：772 x 250
  - SHA-256：`531d839f681f49d753bf6fdea3a5731f39c3bde40c9f3bb7f696f0c40dc78289`

- `banner-1544x500.png`
  - Retina 横幅图
  - 尺寸：1544 x 500
  - SHA-256：`b82d10ea9a54b8e05e874304803eb21502ea23bac7ad8cb4d56ca4c2b97807e0`

- `icon-128x128.png`
  - 标准插件图标
  - 尺寸：128 x 128
  - SHA-256：`731c360556550ea1910129c32c3e70532bac152e2598538cd7d08b18467f5f25`

- `icon-256x256.png`
  - Retina 插件图标
  - 尺寸：256 x 256
  - SHA-256：`43d5ecca4b3bb98f81c2620c1d047bb5ab83c5616a57bc980924ba9e7bec7a8c`

## 上传位置

这些图片不是插件 zip 的一部分。WordPress.org 插件审核通过并分配 SVN 仓库后，只把以下四个当前素材放到 SVN 顶层 `assets/` 目录：

```text
assets/banner-772x250.png
assets/banner-1544x500.png
assets/icon-128x128.png
assets/icon-256x256.png
```

插件代码文件放到 `trunk/` 和当前版本对应的 `tags/<version>/`，不要把这些展示图片放进插件 zip 或 `trunk/assets/`。

## 来源

- 原始 icon 图：`sj/img/LOGO.png`
- 原始 banner 图：`sj/img/banner.png`

已处理为 WordPress.org 规范命名和尺寸。
