/**
 * 测试爬虫的库存检测逻辑（和 Python 版 test_midea_finder.py 同理）
 */

const { checkStockFromHtml } = require('./index.js')

const tests = [
  // 有货 — JSON-LD
  { name: 'JSON-LD InStock', html: `<script type="application/ld+json">{"offers":{"availability":"https://schema.org/InStock","price":"899"}}</script>`, expect: 'in_stock' },
  // 无货 — JSON-LD
  { name: 'JSON-LD OutOfStock', html: `<script type="application/ld+json">{"offers":{"availability":"https://schema.org/OutOfStock"}}</script>`, expect: 'out_of_stock' },
  // 有货 — @graph 嵌套
  { name: 'JSON-LD @graph InStock', html: `<script type="application/ld+json">{"@graph":[{"@type":"Product","offers":{"availability":"https://schema.org/InStock"}}]}</script>`, expect: 'in_stock' },
  // 有货 — 购物车按钮
  { name: 'Cart Button', html: `<button>In den Warenkorb</button>`, expect: 'in_stock' },
  // 有货 — lieferbar
  { name: 'Lieferbar', html: `<span>Sofort lieferbar</span>`, expect: 'in_stock' },
  // 无货 — ausverkauft
  { name: 'Ausverkauft', html: `<span>Leider ausverkauft</span>`, expect: 'out_of_stock' },
  // 无货 — 明确无货关键词
  { name: 'Nicht verfügbar', html: `<div>Dieser Artikel ist momentan nicht verfügbar</div>`, expect: 'out_of_stock' },
  // 矛盾情况 — 但购物车按钮优先
  { name: 'Cart beats Ausverkauft', html: `<span>ausverkauft</span><button>In den Warenkorb</button>`, expect: 'in_stock' },
  // 无货 — OutOfStock
  { name: 'Keyword OutOfStock', html: `<span>Out of Stock</span>`, expect: 'out_of_stock' },
  // 未知
  { name: 'Unknown', html: `<div>Some random page without stock info</div>`, expect: 'unknown' },
]

let passed = 0
let failed = 0

for (const t of tests) {
  const result = checkStockFromHtml(t.html)
  const ok = result.status === t.expect
  if (ok) {
    passed++
  } else {
    failed++
    console.log(`❌ ${t.name}: expected ${t.expect}, got ${result.status} (method: ${result.method})`)
  }
}

console.log(`\n${passed}/${tests.length} 通过, ${failed} 失败`)
process.exit(failed > 0 ? 1 : 0)
