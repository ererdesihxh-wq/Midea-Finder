# ❄️ Midea PortaSplit Finder

自动检测 Midea PortaSplit 空调在德国 13 家零售商的库存状态。

## 扩展功能

- ✅ **自动检测** OBI、Amazon 等零售商的产品库存（有货/售罄）
- 🔗 **一键直达** 其余零售商的产品页面
- ⏱️ 数据每 30 分钟自动更新（GitHub Actions）
- 🆓 免费、开源、零权限、无广告

## 支持的零售商

| 自动检测库存 | 快捷入口 |
|---|---|
| OBI、Amazon | MediaMarkt、Galaxus、Otto、Bauhaus、Hornbach、Globus、toom、Hellweg、hagebau、tado°、Weinmann-Schanz |

## 上架 Chrome Web Store

### 需要上传的文件

只需打包 `extension/` 文件夹：
```
extension/
├── manifest.json
├── popup.html
├── popup.js
└── icon.png / icon16.png / icon48.png
```

### 上架步骤

1. 注册 Chrome 开发者账号（一次性费用 $5）
2. 打开 https://chrome.google.com/webstore/devconsole
3. 点 "New item"
4. 上传 `extension/` 文件夹的 zip 包
5. 填写商店信息（标题、描述、截图等）
6. 隐私政策填 `https://github.com/ererdesihxh-wq/Midea-Finder/blob/main/PRIVACY.md`
7. 发布

### 商店描述参考

**中文：**
> Midea PortaSplit Finder 是一款免费开源的 Chrome 扩展，帮助您在德国快速找到 Midea PortaSplit 移动空调的库存。支持 OBI、Amazon、MediaMarkt、Bauhaus、Hornbach 等 13 家零售商，自动检测有货/售罄状态，一键直达购买页面。数据每 30 分钟自动更新，零权限，不收集任何个人信息。

**English：**
> Midea PortaSplit Finder is a free and open-source Chrome extension that helps you quickly find Midea PortaSplit portable AC inventory across 13 German retailers including OBI, Amazon, MediaMarkt, Bauhaus, Hornbach and more. Auto-detects in-stock/sold-out status, one-click to purchase page. Data updates every 30 minutes. Zero permissions, no data collection.

### 截图建议

打开扩展 → 右键 → "检查弹出式窗口" → 截图 1280x800 区域

## 项目结构

```
├── .github/workflows/scrape.yml   # GitHub Actions 自动爬虫（每30分钟）
├── scraper/
│   ├── index.js                   # 爬虫脚本
│   └── test.js                    # 测试
├── extension/                     # ← Chrome 扩展（上架这个）
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── icon*.png
├── docs/
│   └── results.json               # 爬虫输出（自动生成）
├── PRIVACY.md                     # 隐私政策
└── README.md
```

## License

MIT
