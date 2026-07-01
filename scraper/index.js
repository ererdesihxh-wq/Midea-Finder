/**
 * Midea PortaSplit 库存爬虫
 *
 * 能抓到就抓，抓不到的提供直达链接。
 * 纯 Node.js 标准库，零依赖。
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

// ─── 配置 ──────────────────────────────────────────────────────────
// 能直接抓产品页的放 products，抓不到的放 links（直接打开）
const PRODUCTS = [
  {
    name: 'Midea PortaSplit 12K',
    url: 'https://www.obi.de/p/8620890/midea-mobile-split-klimaanlage-portasplit',
    retailer: 'OBI',
    scrape: true,
  },
  // 这些搜索页没有产品库存信息，但作为快捷入口有用
  { name: 'Midea PortaSplit', url: 'https://www.bauhaus.info/suche?q=Midea+PortaSplit', retailer: 'Bauhaus', scrape: false },
  { name: 'Midea PortaSplit', url: 'https://www.hornbach.de/shop/suche/?q=Midea+PortaSplit', retailer: 'Hornbach', scrape: false },
  { name: 'Midea PortaSplit', url: 'https://www.toom.de/suche/?q=Midea+PortaSplit', retailer: 'toom', scrape: false },
  { name: 'Midea PortaSplit', url: 'https://www.hellweg.de/suche.htm?search=Midea+PortaSplit', retailer: 'Hellweg', scrape: false },
  { name: 'Midea PortaSplit', url: 'https://www.hagebau.de/suche/?q=Midea+PortaSplit', retailer: 'hagebau', scrape: false },
  { name: 'Midea PortaSplit', url: 'https://www.globus-baumarkt.de/suche?q=Midea+PortaSplit', retailer: 'Globus', scrape: false },
]

const IN_STOCK_WORDS = [/in den warenkorb/i, /add to cart/i, /sofort lieferbar/i, /auf lager/i, /vorrätig/i, /lieferbar/i, /verfügbar/i, /abholbereit/i, /bestellen/i, /jetzt kaufen/i]
const OUT_STOCK_WORDS = [/ausverkauft/i, /nicht lieferbar/i, /nicht verfügbar/i, /nicht auf lager/i, /derzeit nicht/i, /leider ausverkauft/i, /momentan nicht/i, /out of stock/i, /temporär nicht/i, /zurzeit nicht/i, /OutOfStock/i]
const CART_WORDS = [/in den warenkorb/i, /add to cart/i, /in den einkaufswagen/i]

function fetchUrl(url, timeout = 12000) {
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
  const inC = IN_STOCK_WORDS.filter(p => p.test(lower)).length
  const outC = OUT_STOCK_WORDS.filter(p => p.test(lower)).length
  if (inC > outC && inC >= 2) return { status: 'in_stock', source: 'keyword_high' }
  if (outC > inC && outC >= 2) return { status: 'out_of_stock', source: 'keyword_high' }
  if (inC > 0 && outC === 0) return { status: 'in_stock', source: 'keyword_low' }
  if (outC > 0 && inC === 0) return { status: 'out_of_stock', source: 'keyword_low' }
  return null
}

async function run() {
  const results = []
  const ts = new Date().toISOString()
  console.log(`[${ts}] 开始检查...`)

  for (const p of PRODUCTS) {
    const r = { retailer: p.retailer, name: p.name, url: p.url, checked_at: ts }

    if (!p.scrape) {
      r.status = 'link_only'
      r.hint = '打开页面自行查看'
      results.push(r)
      console.log(`  🔗 ${p.retailer}: 快捷入口`)
      continue
    }

    console.log(`  → ${p.retailer}: ${p.url}`)
    try {
      const resp = await fetchUrl(p.url, 12000)
      if (resp.status !== 200) { r.status = 'fetch_error'; r.error = `HTTP ${resp.status}` }
      else {
        const j = checkJsonLd(resp.body)
        if (j) { r.status = j.status; r.source = j.source; if (j.price) r.price = j.price }
        else {
          const k = checkKeywords(resp.body.toLowerCase())
          if (k) { r.status = k.status; r.source = k.source }
          else { r.status = 'unknown'; r.source = 'inconclusive' }
        }
      }
    } catch (e) { r.status = 'fetch_error'; r.error = e.message }
    results.push(r)
    console.log(`  ${r.status === 'in_stock' ? '✅' : r.status === 'out_of_stock' ? '❌' : '❓'} ${r.status}${r.price ? ' · ' + r.price : ''} (${r.source || ''})`)
    await new Promise(r => setTimeout(r, 1500))
  }

  const inStock = results.filter(r => r.status === 'in_stock').length
  const outOfStock = results.filter(r => r.status === 'out_of_stock').length
  console.log(`\n📊 ✅ ${inStock} · ❌ ${outOfStock} · 🔗 ${results.filter(r => r.status === 'link_only').length} 快捷入口`)

  const out = { timestamp: ts, summary: { in_stock: inStock, out_of_stock: outOfStock, errors: results.filter(r => r.status === 'fetch_error').length }, results }
  const dir = path.join(__dirname, '..', 'docs')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(out, null, 2))
  console.log(`\n✅ docs/results.json`)
}

if (require.main === module) run().catch(e => { console.error(e); process.exit(1) })
module.exports = { checkJsonLd, checkKeywords }
