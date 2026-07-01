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
├── _locales/
│   └── zh_CN/messages.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── manifest.json
└── README.md
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

**中文（带热词优化）：**
> **Midea PortaSplit Finder** 助您快速查找德国各大零售商的 **Midea PortaSplit（美的移动分体空调）** 库存状态。覆盖 OBI、Amazon、MediaMarkt、Bauhaus、Hornbach 等 **13 家零售商**，支持 **12.000 BTU** 及 **8.000 BTU** 型号。自动检测有货/售罄，一键直达购买页面。数据每 30 分钟自动更新，零权限，不收集任何个人信息。免费开源。

**English（with trending keywords）：**
> **Midea PortaSplit Finder** helps you quickly check Midea PortaSplit portable air conditioner stock across **13 German retailers** including OBI, Amazon, MediaMarkt, Bauhaus, Hornbach, and more. Supports **12.000 BTU** and **8.000 BTU** models. Auto-detects in-stock/sold-out status, one-click to purchase page. Data updates every 30 minutes. Zero permissions, no data collection. Free and open-source.

**Deutsch（für den Chrome Web Store, mit Trend-Keywords）：**
> **Midea PortaSplit Finder** – Finden Sie die **Midea Klimaanlage PortaSplit** auf Lager bei 13 deutschen Händlern. Die **Klimaanlage PortaSplit** (12.000 BTU / 8.000 BTU) ist aktuell stark nachgefragt. Die Extension prüft automatisch die Verfügbarkeit bei OBI, Amazon, MediaMarkt, Bauhaus, Hornbach und mehr. Ein Klick führt direkt zur Produktseite. Datenaktualisierung alle 30 Minuten. Keine Berechtigungen erforderlich. Kostenlos und Open Source.

**短描述（Chrome 商店副标题用）：**
> Midea PortaSplit 德国库存监控 · 13家零售商自动检测 · 免费开源

### 截图建议

打开扩展 → 右键 → "检查弹出式窗口" → 截图 1280x800 区域

## 项目结构

```
├── .github/workflows/scrape.yml   # GitHub Actions 自动爬虫（每30分钟）
├── scraper/
│   ├── index.js                   # 爬虫脚本
│   └── test.js                    # 测试
├── extension/                     # ← Chrome 扩展（上架这个）
│   ├── _locales/zh_CN/messages.json
│   ├── icons/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── manifest.json
│   └── README.md
├── docs/
│   └── results.json               # 爬虫输出（自动生成）
├── PRIVACY.md                     # 隐私政策
└── README.md
```

## License

MIT
