import { chromium } from 'playwright'
const base = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || './shots'
const vw = Number(process.argv[4] || 1440), vh = Number(process.argv[5] || 900)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 })
const errs = []
page.on('pageerror', e => errs.push(e.message))
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
await page.goto(base)
await page.evaluate(() => localStorage.clear())
await page.goto(base)
await page.waitForTimeout(800)
await page.screenshot({ path: `${out}/01-login.png`, fullPage: true })
await page.click('button.btn.primary')
await page.waitForTimeout(2500)
const routes = [['painel','02-painel'],['alertas','03-alertas'],['alertas/EV-1119-0042','04-detalhe'],['notificacoes','05-notificacoes'],['reportar','06-reportar'],['fontes','07-fontes'],['fontes/SNS-ALG-031','08-fonte-detalhe'],['perfil','09-perfil']]
for (const [r, n] of routes) {
  await page.goto(base + '#/' + r); await page.waitForTimeout(1800)
  await page.screenshot({ path: `${out}/${n}.png`, fullPage: true })
}
// agente -> análises
await page.selectOption('.role-switch select', 'agente').catch(()=>{})
await page.goto(base + '#/analises'); await page.waitForTimeout(1500)
await page.screenshot({ path: `${out}/10-analises.png`, fullPage: true })
console.log('errors:', JSON.stringify(errs, null, 1))
await browser.close()
