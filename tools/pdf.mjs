import { chromium } from 'playwright'
import { pathToFileURL } from 'url'
import { execFileSync } from 'child_process'
import path from 'path'
import fs from 'fs'
const src = path.resolve(process.argv[2]); const out = path.resolve(process.argv[3])
const tmp = path.join(path.dirname(out), '.tmp-pdf'); fs.mkdirSync(tmp, { recursive: true })
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 2 })
p.on('pageerror', e => console.log('ERR', e.message))
await p.goto(pathToFileURL(src).href, { waitUntil: 'networkidle' })
await p.waitForSelector('body[data-ready="1"]', { timeout: 30000 })
await p.evaluate(() => document.fonts.ready)
const common = { format: 'A4', printBackground: true, preferCSSPageSize: true }
// capa sem número; demais páginas numeradas no canto superior direito (ABNT), contando a capa
await p.pdf({ ...common, path: path.join(tmp, 'capa.pdf'), pageRanges: '1' })
await p.pdf({ ...common, path: path.join(tmp, 'corpo.pdf'), pageRanges: '2-', displayHeaderFooter: true,
  headerTemplate: '<div style="width:100%;font-size:10px;font-family:serif;text-align:right;padding:0 20mm 0 0;margin-top:12mm"><span class="pageNumber"></span></div>',
  footerTemplate: '<span></span>' })
execFileSync('pdfunite', [path.join(tmp, 'capa.pdf'), path.join(tmp, 'corpo.pdf'), out])
fs.rmSync(tmp, { recursive: true })
// diagramas avulsos
const dir = path.join(path.dirname(out), 'diagramas'); fs.mkdirSync(dir, { recursive: true })
await p.emulateMedia({ media: 'screen' })
const names = ['diagrama-sequencia', 'diagrama-estados']
const diags = await p.locator('.diagram').all()
for (let i = 0; i < diags.length; i++) {
  await diags[i].screenshot({ path: path.join(dir, names[i] + '.png') })
  fs.writeFileSync(path.join(dir, names[i] + '.svg'), await diags[i].locator('svg').evaluate(s => s.outerHTML))
}
await p.locator('.arch-wrap').screenshot({ path: path.join(dir, 'arquitetura-camadas.png') })
await b.close(); console.log('ok')
