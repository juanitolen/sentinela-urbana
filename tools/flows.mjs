import { chromium } from 'playwright'
const base = 'http://localhost:4173/'
const out = process.argv[2]
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []; page.on('pageerror', e => errs.push(e.message))
await page.goto(base); await page.evaluate(() => localStorage.clear()); await page.goto(base)
await page.click('text=Entrar como Ana')
// Fluxo 1: morador corrobora EV-0043
await page.goto(base + '#/alertas/EV-1119-0043'); await page.waitForTimeout(800)
await page.click('text=Também estou vendo isso'); await page.waitForTimeout(800)
console.log('EV-0043 state:', await page.locator('.stepper li.cur .st-lbl').textContent())
await page.screenshot({ path: `${out}/f1-corroborar.png`, fullPage: true })
// Fluxo 2: registrar ocorrência
await page.goto(base + '#/reportar'); await page.waitForTimeout(500)
await page.click('.type-card.t-alagamento'); await page.click('text=Continuar')
await page.click('text=Usar minha localização'); await page.waitForTimeout(500); await page.click('text=Continuar')
await page.click('text=Até o joelho'); await page.fill('textarea', 'Água cobrindo a rua inteira perto da escola'); await page.click('text=Anexar foto'); await page.click('text=Continuar')
await page.screenshot({ path: `${out}/f2-revisao.png`, fullPage: true })
await page.click('text=Enviar ocorrência'); await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/f2-sucesso.png`, fullPage: true })
console.log('report result:', await page.locator('.success').innerText())
// Fluxo 3: agente valida EV-0044
await page.selectOption('.role-switch select', 'agente'); await page.waitForTimeout(300)
await page.goto(base + '#/notificacoes'); await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/f3-notif-agente.png`, fullPage: true })
await page.goto(base + '#/alertas/EV-1119-0044'); await page.waitForTimeout(600)
await page.click('text=Confirmar e emitir alerta'); await page.waitForTimeout(800)
console.log('EV-0044 state:', await page.locator('.stepper li.cur .st-lbl').textContent())
await page.screenshot({ path: `${out}/f3-validado.png`, fullPage: true })
// Fluxo 4: simulador
await page.goto(base + '#/fontes'); await page.waitForTimeout(500)
await page.click('text=Enviar leitura'); await page.waitForTimeout(4000)
await page.locator('.sim-card').screenshot({ path: `${out}/f4-simulador.png` })
console.log('sim:', (await page.locator('.sim-card .pipeline').innerText()).slice(0, 900))
// Mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
await m.goto(base + '#/painel'); await m.waitForTimeout(2000)
await m.screenshot({ path: `${out}/m-painel.png` })
await m.goto(base + '#/alertas/EV-1119-0042'); await m.waitForTimeout(1500)
await m.screenshot({ path: `${out}/m-detalhe.png` })
const sw = await m.evaluate(() => document.documentElement.scrollWidth); console.log('mobile scrollWidth', sw)
console.log('errors', errs)
await b.close()
