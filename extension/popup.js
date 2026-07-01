// 数据源：GitHub Actions 自动生成的 JSON
const DATA_URL = 'https://raw.githubusercontent.com/ererdesihxh-wq/Midea-Finder/main/docs/results.json'

const CHAIN_COLORS = {
  OBI: '#52b530', Galaxus: '#ff9900', Otto: '#d3232a',
  Amazon: '#ff9900', MediaMarkt: '#e4000b',
  Bauhaus: '#e30613', Hornbach: '#d6002e', Globus: '#e3000f',
  toom: '#004a9f', Hellweg: '#f39200', hagebau: '#004b87',
}

const CHAIN_ICONS = {
  OBI: '🟢', Galaxus: '🟠', Otto: '🔴',
  Amazon: '🟠', MediaMarkt: '🔴',
  Bauhaus: '🔴', Hornbach: '🔴', Globus: '🔴',
  toom: '🔵', Hellweg: '🟠', hagebau: '🔵',
}

const results = document.getElementById('results')

async function main() {
  try {
    const resp = await fetch(DATA_URL, { signal: AbortSignal.timeout(8000) })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    render(data)
  } catch {
    renderFallback()
  }
}

function statusIcon(status) {
  switch (status) {
    case 'in_stock': return '✅'
    case 'out_of_stock': return '❌'
    case 'fetch_error': return '⚠️'
    default: return '🔗'
  }
}

function render(data) {
  let html = ''
  if (data.timestamp) {
    const t = new Date(data.timestamp)
    const now = new Date()
    const diff = Math.round((now - t) / 60000)
    html += `<div class="ts">🕐 ${t.toLocaleString('de-DE')} (${diff} 分钟前)</div>`
  }

  // 按状态排序：有货 > 错误 > 快捷入口 > 未知 > 售罄
  const order = { in_stock: 0, fetch_error: 1, link_only: 2, unknown: 3, out_of_stock: 4 }
  const sorted = [...data.results].sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5))

  for (const r of sorted) {
    const color = CHAIN_COLORS[r.retailer] || '#666'
    const icon = CHAIN_ICONS[r.retailer] || '🏪'
    const initial = r.retailer[0]

    let badge = '', badgeClass = ''
    if (r.status === 'in_stock') {
      badge = `✅ ${r.price ? r.price : '有货'}`
      badgeClass = 'badge-ok'
    } else if (r.status === 'out_of_stock') {
      badge = '❌ 售罄'
      badgeClass = 'badge-err'
    } else if (r.status === 'fetch_error') {
      badge = '⚠️ 暂时无法检测'
      badgeClass = 'badge-unknown'
    } else if (r.status === 'link_only') {
      badge = '🔗 打开查看'
      badgeClass = 'badge-link'
    } else {
      badge = '❓ 未知'
      badgeClass = 'badge-unknown'
    }

    html += `<div class="item" data-url="${r.url}">`
      + `<div class="icon" style="background:${color}">${initial}</div>`
      + `<div class="info"><div class="name">${icon} ${r.retailer}</div><div class="hint">${r.name}</div></div>`
      + `<div class="badge ${badgeClass}">${badge}</div>`
      + `</div>`
  }

  results.innerHTML = html
}

function renderFallback() {
  const all = [
    { retailer: 'OBI', url: 'https://www.obi.de/p/8620890/midea-mobile-split-klimaanlage-portasplit', name: 'Midea PortaSplit 12K' },
    { retailer: 'Galaxus', url: 'https://www.galaxus.de/en/s2/product/midea-porta-split-42-m-12000-btuh-air-conditioners-40851329', name: 'Midea Porta Split 12K' },
    { retailer: 'Otto', url: 'https://www.otto.de/p/midea-portasplit-12k-7890123/', name: 'Midea PortaSplit 12K' },
    { retailer: 'Amazon', url: 'https://www.amazon.de/s?k=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'MediaMarkt', url: 'https://www.mediamarkt.de/de/search.html?query=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Bauhaus', url: 'https://www.bauhaus.info/suche?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Hornbach', url: 'https://www.hornbach.de/shop/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Globus', url: 'https://www.globus-baumarkt.de/suche?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'toom', url: 'https://www.toom.de/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Hellweg', url: 'https://www.hellweg.de/suche.htm?search=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'hagebau', url: 'https://www.hagebau.de/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
  ]

  let html = '<div class="ts">⚠️ 暂未获取到数据，手动打开查看</div>'
  for (const r of all) {
    const color = CHAIN_COLORS[r.retailer] || '#666'
    const icon = CHAIN_ICONS[r.retailer] || '🏪'
    html += `<div class="item" data-url="${r.url}">`
      + `<div class="icon" style="background:${color}">${r.retailer[0]}</div>`
      + `<div class="info"><div class="name">${icon} ${r.retailer}</div><div class="hint">${r.name}</div></div>`
      + `<div class="badge badge-link">🔗 打开查看</div>`
      + `</div>`
  }
  results.innerHTML = html
}

results.addEventListener('click', e => {
  const item = e.target.closest('.item')
  if (item) chrome.tabs.create({ url: item.dataset.url })
})

main()
