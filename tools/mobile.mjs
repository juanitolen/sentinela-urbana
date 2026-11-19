import { chromium } from 'playwright'
const base = 'http://localhost:4173/'; const out = process.argv[2]
const b = await chromium.launch()
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await m.goto(base); await m.evaluate(() => localStorage.clear()); await m.goto(base)
await m.click('text=Entrar como Ana'); await m.waitForTimeout(2000)
await m.screenshot({ path: `${out}/m-painel.png` })
for (const r of ['alertas', 'alertas/EV-1119-0042', 'notificacoes', 'reportar', 'fontes', 'perfil']) {
  await m.goto(base + '#/' + r); await m.waitForTimeout(1200)
  const sw = await m.evaluate(() => document.documentElement.scrollWidth)
  console.log(r, sw)
  await m.screenshot({ path: `${out}/m-${r.replace('/', '_')}.png` })
}
await b.close()
