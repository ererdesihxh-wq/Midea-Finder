/**
 * Midea PortaSplit 库存爬虫
 *
 * 纯 Node.js 标准库，零依赖。
 * 在 GitHub Actions 上每 30 分钟自动运行。
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

// ─── 所有零售商配置 ────────────────────────────────────────────────
// scrape: true  → 直接抓页面分析库存
// scrape: false → 快捷入口（点击打开页面）
const PRODUCTS = [
  // === 能自动检测库存的（产品页）===
  // OBI — 成功！JSON-LD 和关键词都能抓到
  {
    retailer: 'OBI',
    name: 'Midea PortaSplit 12K',
    url: 'https://www.obi.de/p/8620890/midea-mobile-split-klimaanlage-portasplit',
    scrape: true,
  },
  // Amazon — 试试 Amazon 产品页
  {
    retailer: 'Amazon',
    name: 'Midea PortaSplit 12K',
    url: 'https://www.amazon.de/-/en/Midea-Portasplit-Conditioning-Cooling-Heating/dp/B0D3PP64JS',
    scrape: true,
  },
  // tado° — 官方合作伙伴（landing page，无库存信息）
  {
    retailer: 'tado°',
    name: 'Midea PortaSplit 12K',
    url: 'https://www.tado.com/en-gb/lp/midea-portasplit',
    scrape: false,
  },
  // weinmann-schanz — 小众零售商（无库存关键词）
  {
    retailer: 'Weinmann-Schanz',
    name: 'Midea PortaSplit 12K',
    url: 'https://www.weinmann-schanz.de/us/en/produkte/produkt.html/mobiles-split-klimageraet-r-32-midea-porta-split-3-5kw-90-134-79.html',
    scrape: false,
  },

  // === 搜索页/活动页，作为快捷入口 ===
  { retailer: 'MediaMarkt', name: 'Midea PortaSplit', url: 'https://www.mediamarkt.de/de/search.html?query=Midea+PortaSplit',   scrape: false },
  { retailer: 'Galaxus',    name: 'Midea Porta Split', url: 'https://www.galaxus.de/en/s2/product/midea-porta-split-42-m-12000-btuh-air-conditioners-40851329', scrape: false },
  { retailer: 'Otto',       name: 'Midea PortaSplit', url: 'https://www.otto.de/haushalt/klimageraete/?marke=midea',            scrape: false },
  { retailer: 'Bauhaus',    name: 'Midea PortaSplit', url: 'https://www.bauhaus.info/suche?q=Midea+PortaSplit',                 scrape: false },
  { retailer: 'Hornbach',   name: 'Midea PortaSplit', url: 'https://www.hornbach.de/shop/suche/?q=Midea+PortaSplit',           scrape: false },
  { retailer: 'Globus',     name: 'Midea PortaSplit', url: 'https://www.globus-baumarkt.de/suche?q=Midea+PortaSplit',          scrape: false },
  { retailer: 'toom',       name: 'Midea PortaSplit', url: 'https://www.toom.de/suche/?q=Midea+PortaSplit',                    scrape: false },
  { retailer: 'Hellweg',    name: 'Midea PortaSplit', url: 'https://www.hellweg.de/suche.htm?search=Midea+PortaSplit',         scrape: false },
  { retailer: 'hagebau',    name: 'Midea PortaSplit', url: 'https://www.hagebau.de/suche/?q=Midea+PortaSplit',                 scrape: false },
]

// ─── 关键词检测 ────────────────────────────────────────────────────

const CART_WORDS = [/in den warenkorb/i, /add to cart/i, /in den einkaufswagen/i, /kaufen/i, /bestellen/i]
const IN_WORDS = [/sofort lieferbar/i, /auf lager/i, /vorrätig/i, /lieferbar/i, /verfügbar/i, /abholbereit/i, /jetzt kaufen/i, /InStock/i]
const OUT_WORDS = [/ausverkauft/i, /nicht lieferbar/i, /nicht verfügbar/i, /nicht auf lager/i, /derzeit nicht/i, /leider ausverkauft/i, /momentan nicht/i, /out of stock/i, /temporär nicht/i, /zurzeit nicht/i, /OutOfStock/i, /bald wieder verfügbar/i]

function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      },
      timeout,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(new URL(res.headers.location, url).toString(), timeout))
      }
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

function checkJsonLd(html) {
  const m = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)
  if (!m) return null
  try {
    const data = JSON.parse(m[1].trim())
    const items = data['@graph'] || [data]
    for (const item of items) {
      const offers = item.offers || (item.mainEntity && item.mainEntity.offers)
      if (!offers) continue
      if (Array.isArray(offers)) {
        const inStock = offers.some(o => o.availability && /InStock/i.test(o.availability))
        return { status: inStock ? 'in_stock' : 'out_of_stock', source: 'jsonld', price: offers.find(o => o.price)?.price }
      }
      if (offers.availability) {
        return { status: /InStock/i.test(offers.availability) ? 'in_stock' : 'out_of_stock', source: 'jsonld', price: offers.price }
      }
    }
  } catch {}
  return null
}

function checkKeywords(lower) {
  if (CART_WORDS.some(p => p.test(lower))) return { status: 'in_stock', source: 'cart_btn' }
  const inC = IN_WORDS.filter(p => p.test(lower)).length
  const outC = OUT_WORDS.filter(p => p.test(lower)).length
  if (inC > outC && inC >= 2) return { status: 'in_stock', source: 'keyword_high' }
  if (outC > inC && outC >= 2) return { status: 'out_of_stock', source: 'keyword_high' }
  if (inC > 0 && outC === 0) return { status: 'in_stock', source: 'keyword_low' }
  if (outC > 0 && inC === 0) return { status: 'out_of_stock', source: 'keyword_low' }
  return null
}

// ─── 主流程 ────────────────────────────────────────────────────────

async function run() {
  const results = []
  const ts = new Date().toISOString()
  console.log(`[${ts}] 开始检查 ${PRODUCTS.length} 个零售商...`)

  for (const p of PRODUCTS) {
    const r = { retailer: p.retailer, name: p.name, url: p.url, checked_at: ts }

    if (!p.scrape) {
      r.status = 'link_only'
      r.hint = '打开页面自行查看'
      results.push(r)
      console.log(`  🔗 ${p.retailer.padEnd(10)} ${p.name}`)
      continue
    }

    console.log(`  → ${p.retailer.padEnd(10)} ${p.url}`)
    try {
      const resp = await fetchUrl(p.url, 15000)
      if (resp.status !== 200) {
        r.status = 'fetch_error'
        r.error = `HTTP ${resp.status}`
        console.log(`  ✗ HTTP ${resp.status}`)
      } else {
        const j = checkJsonLd(resp.body)
        if (j) {
          r.status = j.status
          r.source = j.source
          if (j.price) r.price = j.price
          console.log(`  ${j.status === 'in_stock' ? '✅' : '❌'} ${j.status} (${j.source})${j.price ? ' · ' + j.price : ''}`)
        } else {
          const lower = resp.body.toLowerCase()
          const k = checkKeywords(lower)
          if (k) {
            r.status = k.status
            r.source = k.source
            console.log(`  ${k.status === 'in_stock' ? '✅' : '❌'} ${k.status} (${k.source})`)
          } else {
            r.status = 'unknown'
            r.source = 'inconclusive'
            console.log(`  ❓ unknown (no JSON-LD, no keywords)`)
          }
        }
      }
    } catch (e) {
      r.status = 'fetch_error'
      r.error = e.message
      console.log(`  ❌ ${e.message}`)
    }
    results.push(r)
    await new Promise(r => setTimeout(r, 1500))
  }

  const inStock = results.filter(r => r.status === 'in_stock').length
  const outOfStock = results.filter(r => r.status === 'out_of_stock').length
  const errors = results.filter(r => r.status === 'fetch_error').length
  const links = results.filter(r => r.status === 'link_only').length
  console.log(`\n📊 ✅ ${inStock} 有货 · ❌ ${outOfStock} 售罄 · ❓ ${results.filter(r => r.status === 'unknown').length} 未知 · ⚠️ ${errors} 错误 · 🔗 ${links} 快捷入口`)

  const out = { timestamp: ts, summary: { in_stock: inStock, out_of_stock: outOfStock, errors, unknown: results.filter(r => r.status === 'unknown').length }, results }
  const dir = path.join(__dirname, '..', 'docs')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(out, null, 2))
  console.log(`\n✅ 结果已保存到 docs/results.json`)
}

if (require.main === module) run().catch(e => { console.error(e); process.exit(1) })
module.exports = { checkJsonLd, checkKeywords }
