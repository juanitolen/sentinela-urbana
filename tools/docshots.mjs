import { chromium } from 'playwright'
const base = 'http://localhost:4173/'; const out = process.argv[2]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1.5 })
await p.goto(base); await p.evaluate(() => localStorage.clear()); await p.goto(base); await p.waitForTimeout(800)
await p.screenshot({ path: `${out}/T01-login.png` })
await p.click('text=Entrar como Ana'); await p.waitForTimeout(2500)
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(300)
await p.screenshot({ path: `${out}/T02-painel.png` })
const shots = [['alertas','T03-alertas'],['alertas/EV-1119-0042','T04-detalhe-alerta'],['notificacoes','T05-notificacoes'],['fontes','T07-fontes-confianca'],['fontes/SNS-ALG-031','T08-detalhe-fonte'],['perfil','T09-preferencias-lgpd']]
for (const [r,n] of shots) { await p.goto(base+'#/'+r); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${n}.png` }) }
// T04b scroll do detalhe
await p.goto(base+'#/alertas/EV-1119-0042'); await p.waitForTimeout(1200); await p.evaluate(()=>window.scrollTo(0, 600)); await p.waitForTimeout(400)
await p.screenshot({ path: `${out}/T04b-detalhe-evidencias.png` })
// T06 wizard
await p.goto(base+'#/reportar'); await p.waitForTimeout(500)
await p.click('.type-card.t-alagamento'); await p.click('text=Continuar'); await p.click('text=Usar minha localização'); await p.waitForTimeout(800)
await p.screenshot({ path: `${out}/T06a-reportar-local.png` })
await p.click('text=Continuar'); await p.click('text=Até o joelho'); await p.fill('textarea','Água cobrindo a rua perto da escola'); await p.click('text=Anexar foto'); await p.click('text=Continuar')
await p.screenshot({ path: `${out}/T06b-reportar-revisao.png` })
await p.click('text=Enviar ocorrência'); await p.waitForTimeout(600)
await p.screenshot({ path: `${out}/T06c-reportar-confirmacao.png` })
// T07b simulador
await p.goto(base+'#/fontes'); await p.waitForTimeout(500); await p.click('text=Enviar leitura'); await p.waitForTimeout(4200)
await p.locator('.sim-card').scrollIntoViewIfNeeded(); await p.locator('.sim-card').screenshot({ path: `${out}/T07b-simulador.png` })
// agente
await p.selectOption('.role-switch select', 'agente'); await p.waitForTimeout(300)
await p.goto(base+'#/notificacoes'); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/T05b-notificacoes-agente.png` })
await p.goto(base+'#/alertas/EV-1119-0044'); await p.waitForTimeout(1200); await p.evaluate(()=>window.scrollTo(0, 500)); await p.waitForTimeout(300)
await p.screenshot({ path: `${out}/T04c-validacao-agente.png` })
await p.goto(base+'#/analises'); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/T10-analises.png` })
// mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })
await m.goto(base); await m.evaluate(() => localStorage.clear()); await m.goto(base); await m.click('text=Entrar como Ana'); await m.waitForTimeout(1500)
await m.goto(base+'#/alertas/EV-1119-0042'); await m.waitForTimeout(1200); await m.screenshot({ path: `${out}/M01-mobile-detalhe.png` })
await m.goto(base+'#/notificacoes'); await m.waitForTimeout(800); await m.screenshot({ path: `${out}/M02-mobile-notificacoes.png` })
await b.close()
