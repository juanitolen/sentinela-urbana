import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []; p.on('pageerror', e => errs.push(e.message))
await p.goto('https://juanitolen.github.io/sentinela-urbana/'); await p.click('text=Entrar como Ana'); await p.waitForTimeout(3000)
console.log('kpis:', (await p.locator('.kpi').count()), 'markers:', await p.locator('.leaflet-interactive').count(), 'tiles:', await p.locator('.leaflet-tile-loaded').count(), 'errors:', errs)
await b.close()
