// 数据源：GitHub Actions 自动生成的 JSON
const DATA_URL = 'https://raw.githubusercontent.com/ererdesihxh-wq/Midea-Finder/main/docs/results.json'

const CHAIN_COLORS = {
  OBI: '#52b530', Globus: '#e3000f', Bauhaus: '#e30613',
  Hornbach: '#d6002e', toom: '#004a9f', Hellweg: '#f39200', hagebau: '#004b87',
}

const results = document.getElementById('results')

async function main() {
  try {
    const resp = await fetch(DATA_URL, { signal: AbortSignal.timeout(8000) })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    render(data)
  } catch {
    // 备用：直接显示快捷链接
    renderFallback()
  }
}

function render(data) {
  let html = ''
  if (data.timestamp) {
    const t = new Date(data.timestamp)
    html += `<div class="ts">🕐 更新于 ${t.toLocaleString('de-DE')}</div>`
  }

  for (const r of data.results) {
    const color = CHAIN_COLORS[r.retailer] || '#666'
    const initial = r.retailer[0]

    let badge = '', badgeClass = ''
    if (r.status === 'in_stock') {
      badge = '✅ 有货'
      badgeClass = 'badge-ok'
      if (r.price) badge += ` · ${r.price}`
    } else if (r.status === 'out_of_stock') {
      badge = '❌ 售罄'
      badgeClass = 'badge-err'
    } else if (r.status === 'link_only') {
      badge = '🔗 打开查看'
      badgeClass = 'badge-link'
    } else {
      badge = '❓ 未知'
      badgeClass = 'badge-unknown'
    }

    html += `<div class="item" data-url="${r.url}">`
      + `<div class="icon" style="background:${color}">${initial}</div>`
      + `<div class="info"><div class="name">${r.retailer}</div><div class="hint">${r.name}</div></div>`
      + `<div class="badge ${badgeClass}">${badge}</div>`
      + `</div>`
  }

  results.innerHTML = html
}

function renderFallback() {
  const fallback = [
    { retailer: 'OBI', url: 'https://www.obi.de/p/8620890/midea-mobile-split-klimaanlage-portasplit', name: 'Midea PortaSplit 12K' },
    { retailer: 'Globus', url: 'https://www.globus-baumarkt.de/suche?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Bauhaus', url: 'https://www.bauhaus.info/suche?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Hornbach', url: 'https://www.hornbach.de/shop/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'toom', url: 'https://www.toom.de/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Hellweg', url: 'https://www.hellweg.de/suche.htm?search=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'hagebau', url: 'https://www.hagebau.de/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
  ]

  let html = '<div class="ts">⚠️ 无法获取最新数据，显示快捷入口</div>'
  for (const r of fallback) {
    const color = CHAIN_COLORS[r.retailer] || '#666'
    html += `<div class="item" data-url="${r.url}">`
      + `<div class="icon" style="background:${color}">${r.retailer[0]}</div>`
      + `<div class="info"><div class="name">${r.retailer}</div><div class="hint">${r.name}</div></div>`
      + `<div class="badge badge-link">🔗 打开查看</div>`
      + `</div>`
  }
  results.innerHTML = html
}

// 点击打开链接
results.addEventListener('click', e => {
  const item = e.target.closest('.item')
  if (item) chrome.tabs.create({ url: item.dataset.url })
})

main()
