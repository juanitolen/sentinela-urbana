import { chromium } from 'playwright'
import { pathToFileURL } from 'url'
import path from 'path'
import fs from 'fs'
const src = path.resolve(process.argv[2]); const out = path.resolve(process.argv[3])
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 2 })
p.on('pageerror', e => console.log('ERR', e.message))
await p.goto(pathToFileURL(src).href, { waitUntil: 'networkidle' })
await p.waitForSelector('body[data-ready="1"]', { timeout: 30000 })
await p.evaluate(() => document.fonts.ready)
await p.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: '<div style="font-size:8px;width:100%;padding:0 14mm;color:#64748B;display:flex;justify-content:space-between;font-family:sans-serif"><span>Sentinela Urbana — GS 2026.2 Engenharia de Software</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>' })
// exporta diagramas
const dir = path.join(path.dirname(out), 'diagramas'); fs.mkdirSync(dir, { recursive: true })
const names = ['diagrama-sequencia', 'diagrama-estados']; await p.emulateMedia({ media: 'screen' })
const diags = await p.locator('.diagram').all()
for (let i = 0; i < diags.length; i++) {
  await diags[i].screenshot({ path: path.join(dir, names[i] + '.png'), scale: 'device' })
  const svg = await diags[i].locator('svg').evaluate(s => s.outerHTML)
  fs.writeFileSync(path.join(dir, names[i] + '.svg'), svg)
}
await p.locator('.arch-wrap').screenshot({ path: path.join(dir, 'arquitetura-camadas.png') })
await b.close()
console.log('ok')
