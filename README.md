# ❄️ Midea PortaSplit 库存监控

自动检查德国建材超市的 Midea PortaSplit 库存，Chrome 扩展一键查看。

## 三步设置

### 1. ✅ 推送代码到 GitHub

已经帮你弄好了。

### 2. 开启 GitHub Actions

去你的仓库 → [https://github.com/ererdesihxh-wq/Midea-Finder](https://github.com/ererdesihxh-wq/Midea-Finder) → 点上面的 **Actions** 标签 → **"我了解我的工作流，继续启用"** 或类似的绿色按钮。

之后每 30 分钟自动爬一次 OBI 的产品页，结果保存在 `docs/results.json`。

### 3. 加载 Chrome 扩展

1. Chrome 打开 `chrome://extensions`
2. 右上角开启"开发者模式"
3. 点"加载已解压的扩展程序"
4. 选本项目的 `extension/` 文件夹

---

## 本地测试

```bash
node scraper/index.js   # 手动爬一次
node scraper/test.js    # 跑测试
```

## 文件结构

```
├── .github/workflows/scrape.yml   # GitHub Actions 自动爬虫
├── scraper/
│   ├── index.js                   # 爬虫本体（抓 OBI 产品页）
│   └── test.js                    # 测试
├── docs/
│   └── results.json               # 爬虫输出（自动生成）
├── extension/
│   ├── manifest.json              # Chrome 插件配置
│   ├── popup.html                 # 弹窗界面
│   ├── popup.js                   # 弹窗逻辑
│   └── icon*.png                  # 图标
└── README.md
```

## 免责声明

数据来自各零售商公开产品页，仅供个人参考。
