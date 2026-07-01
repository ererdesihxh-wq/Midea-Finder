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

/* ─── 后备数据 ─── */
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

/* ─── 多语言 ─── */
function translate(key) {
    try { return chrome.i18n.getMessage(key) || key } catch(e) { return key }
}

function debugI18n() {
    var els = document.querySelectorAll('[data-i18n]')
    for (var i = 0; i < els.length; i++) {
        var el = els[i]
        var msg = translate(el.dataset.i18n)
        if (el.tagName.toLowerCase() === 'optgroup') {
            el.label = msg
        } else if (el.hasAttribute('placeholder')) {
            el.placeholder = msg
        } else {
            el.textContent = msg
        }
    }
}

/* ─── 主流程 ─── */
var results = document.getElementById('results')
var guideOverlay = document.getElementById('guideOverlay')

/* 使用简介 */
document.getElementById('btnGuide').onclick = function() {
    guideOverlay.classList.remove('hidden')
}
document.getElementById('btnCloseGuide').onclick = function() {
    guideOverlay.classList.add('hidden')
}
guideOverlay.onclick = function(e) {
    if (e.target === guideOverlay) guideOverlay.classList.add('hidden')
}

/* 点击卡片 */
results.onclick = function(e) {
    var card = e.target.closest('.item')
    if (card) chrome.tabs.create({ url: card.dataset.url })
}

/* 渲染 */
function renderCards(list, isFallback) {
    var html = ''
    if (!isFallback) {
        try {
            var t = new Date(list.timestamp)
            var diff = Math.round((new Date() - t) / 60000)
            html += '<div class="ts">🕐 ' + t.toLocaleString('de-DE') + ' (' + diff + ' ' + translate('minutes_ago') + ')</div>'
        } catch(e) {}
        list = list.results || []
    }

    /* 有货排最前 */
    var inStock = []
    var others = []
    for (var i = 0; i < list.length; i++) {
        if (list[i].status === 'in_stock') inStock.push(list[i])
        else others.push(list[i])
    }
    var sorted = inStock.concat(others)

    for (var i = 0; i < sorted.length; i++) {
        var r = sorted[i]
        var color = CHAIN_COLORS[r.retailer] || '#666'
        var initial = r.retailer[0]

        var badge = ''
        var cls = ''
        if (r.status === 'in_stock') {
            badge = '✅ ' + (r.price || translate('in_stock'))
            cls = 'badge-ok'
        } else if (r.status === 'out_of_stock') {
            badge = '❌ ' + translate('out_of_stock')
            cls = 'badge-err'
        } else if (r.status === 'fetch_error') {
            badge = '⚠️ ' + translate('fetch_error')
            cls = 'badge-unknown'
        } else if (r.status === 'link_only' || isFallback) {
            badge = '🔗 ' + translate('open_link')
            cls = 'badge-link'
        } else {
            badge = '❓ ' + translate('unknown')
            cls = 'badge-unknown'
        }

        html += '<div class="item" data-url="' + r.url + '">'
            + '<div class="item-icon" style="background:' + color + '">' + initial + '</div>'
            + '<div class="item-info">'
            + '<div class="item-name">' + r.retailer + '</div>'
            + '<div class="item-hint">' + r.name + '</div></div>'
            + '<div class="item-badge ' + cls + '">' + badge + '</div></div>'
    }

    results.innerHTML = html || '<div class="ts">' + translate('fetch_error') + '</div>'
}

/* 启动 */
function boot() {
    debugI18n()
    renderCards(FALLBACK_STORES, true)

    var xhr = new XMLHttpRequest()
    var timer = setTimeout(function() { try { xhr.abort() } catch(e) {} }, 5000)

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            clearTimeout(timer)
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText)
                    if (data && data.results) renderCards(data, false)
                } catch(e) {}
            }
        }
    }
    xhr.open('GET', DATA_URL, true)
    xhr.send()
}

boot()
