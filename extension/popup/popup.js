/* ─── 数据源 ─── */
var DATA_URL = 'https://raw.githubusercontent.com/ererdesihxh-wq/Midea-Finder/main/docs/results.json'

/* ─── 零售商配置 ─── */
var CHAIN_COLORS = {
    OBI: '#52b530', Amazon: '#ff9900', 'tado°': '#1a2b4a',
    'Weinmann-Schanz': '#003366',
    MediaMarkt: '#e4000b', Galaxus: '#ff9900', Otto: '#d3232a',
    Bauhaus: '#e30613', Hornbach: '#d6002e', Globus: '#e3000f',
    toom: '#004a9f', Hellweg: '#f39200', hagebau: '#004b87'
}

/* ─── 后备数据（数据源不可用时显示） ─── */
var FALLBACK_STORES = [
    { retailer: 'OBI',  url: 'https://www.obi.de/p/8620890/midea-mobile-split-klimaanlage-portasplit', name: 'Midea PortaSplit 12K' },
    { retailer: 'Amazon',  url: 'https://www.amazon.de/-/en/Midea-Portasplit-Conditioning-Cooling-Heating/dp/B0D3PP64JS', name: 'Midea PortaSplit 12K' },
    { retailer: 'tado°',  url: 'https://www.tado.com/en-gb/lp/midea-portasplit', name: 'Midea PortaSplit 12K' },
    { retailer: 'Weinmann-Schanz',  url: 'https://www.weinmann-schanz.de/us/en/produkte/produkt.html/mobiles-split-klimageraet-r-32-midea-porta-split-3-5kw-90-134-79.html', name: 'Midea PortaSplit 12K' },
    { retailer: 'MediaMarkt',  url: 'https://www.mediamarkt.de/de/search.html?query=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Galaxus',  url: 'https://www.galaxus.de/en/s2/product/midea-porta-split-42-m-12000-btuh-air-conditioners-40851329', name: 'Midea Porta Split 12K' },
    { retailer: 'Otto',  url: 'https://www.otto.de/haushalt/klimageraete/?marke=midea', name: 'Midea PortaSplit' },
    { retailer: 'Bauhaus',  url: 'https://www.bauhaus.info/suche?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Hornbach',  url: 'https://www.hornbach.de/shop/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Globus',  url: 'https://www.globus-baumarkt.de/suche?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'toom',  url: 'https://www.toom.de/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'Hellweg',  url: 'https://www.hellweg.de/suche.htm?search=Midea+PortaSplit', name: 'Midea PortaSplit' },
    { retailer: 'hagebau',  url: 'https://www.hagebau.de/suche/?q=Midea+PortaSplit', name: 'Midea PortaSplit' }
]

/* ─── 多语言初始化 ─── */
function debugI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function(element) {
        var key = element.dataset.i18n
        var message = chrome.i18n.getMessage(key)
        if (!message) return
        if (element.tagName.toLowerCase() === 'optgroup') {
            element.label = message
        } else if (element.hasAttribute('placeholder')) {
            element.placeholder = message
        } else {
            element.textContent = message
        }
    })
}

document.addEventListener('DOMContentLoaded', debugI18n)

/* ─── 主流程 ─── */
var results = document.getElementById('results')
var guideOverlay = document.getElementById('guideOverlay')

/* 使用简介弹窗 */
document.getElementById('btnGuide').addEventListener('click', function() {
    guideOverlay.classList.remove('hidden')
})
document.getElementById('btnCloseGuide').addEventListener('click', function() {
    guideOverlay.classList.add('hidden')
})
guideOverlay.addEventListener('click', function(e) {
    if (e.target === guideOverlay) {
        guideOverlay.classList.add('hidden')
    }
})

/* 点击门店卡片打开链接 */
results.addEventListener('click', function(e) {
    var card = e.target.closest('.item')
    if (card) {
        chrome.tabs.create({ url: card.dataset.url })
    }
})

/* 加载数据 */
function main() {
    fetch(DATA_URL, { signal: AbortSignal.timeout(8000) })
        .then(function(resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status)
            return resp.json()
        })
        .then(function(data) {
            renderResults(data)
        })
        .catch(function() {
            renderFallback()
        })
}

/* 渲染结果 */
function renderResults(data) {
    var html = ''

    /* 时间戳 */
    if (data.timestamp) {
        var t = new Date(data.timestamp)
        var now = new Date()
        var diff = Math.round((now - t) / 60000)
        html += '<div class="ts">🕐 ' + t.toLocaleString('de-DE') + ' (' + diff + ' ' + chrome.i18n.getMessage('minutes_ago') + ')</div>'
    }

    /* 有货排最前，其余按原顺序 */
    var results = data.results || []
    var inStock = []
    var others = []
    for (var i = 0; i < results.length; i++) {
        if (results[i].status === 'in_stock') {
            inStock.push(results[i])
        } else {
            others.push(results[i])
        }
    }
    var sorted = inStock.concat(others)

    for (var i = 0; i < sorted.length; i++) {
        var r = sorted[i]
        var color = CHAIN_COLORS[r.retailer] || '#666'
        var initial = r.retailer[0]

        var badge = ''
        var badgeClass = ''

        if (r.status === 'in_stock') {
            badge = '✅ ' + (r.price || chrome.i18n.getMessage('in_stock'))
            badgeClass = 'badge-ok'
        } else if (r.status === 'out_of_stock') {
            badge = '❌ ' + chrome.i18n.getMessage('out_of_stock')
            badgeClass = 'badge-err'
        } else if (r.status === 'fetch_error') {
            badge = '⚠️ ' + chrome.i18n.getMessage('fetch_error')
            badgeClass = 'badge-unknown'
        } else if (r.status === 'link_only') {
            badge = '🔗 ' + chrome.i18n.getMessage('open_link')
            badgeClass = 'badge-link'
        } else {
            badge = '❓ ' + chrome.i18n.getMessage('unknown')
            badgeClass = 'badge-unknown'
        }

        html += '<div class="item" data-url="' + r.url + '">'
            + '<div class="item-icon" style="background:' + color + '">' + initial + '</div>'
            + '<div class="item-info">'
            + '<div class="item-name">' + r.retailer + '</div>'
            + '<div class="item-hint">' + r.name + '</div>'
            + '</div>'
            + '<div class="item-badge ' + badgeClass + '">' + badge + '</div>'
            + '</div>'
    }

    results.innerHTML = html
}

/* 后备方案（数据源不可用时） */
function renderFallback() {
    var html = '<div class="ts">⚠️ ' + chrome.i18n.getMessage('open_link') + '</div>'

    for (var i = 0; i < FALLBACK_STORES.length; i++) {
        var r = FALLBACK_STORES[i]
        var color = CHAIN_COLORS[r.retailer] || '#666'
        var initial = r.retailer[0]

        html += '<div class="item" data-url="' + r.url + '">'
            + '<div class="item-icon" style="background:' + color + '">' + initial + '</div>'
            + '<div class="item-info">'
            + '<div class="item-name">' + r.retailer + '</div>'
            + '<div class="item-hint">' + r.name + '</div>'
            + '</div>'
            + '<div class="item-badge badge-link">🔗 ' + chrome.i18n.getMessage('open_link') + '</div>'
            + '</div>'
    }

    results.innerHTML = html
}

/* 启动 */
main()
