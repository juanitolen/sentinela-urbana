import { chromium } from 'playwright'
import fs from 'fs'
const base = 'http://localhost:4173/'
const R = JSON.parse(fs.readFileSync('../video/tmp/durations.json', 'utf8'))
const D = Object.fromEntries(R.map(s => [s.id, s]))
const W = 1440, H = 810, PAD = 0.9
const b = await chromium.launch()
// prepara estado limpo
const ctx = await b.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: '../video/raw', size: { width: W, height: H } } })
const page = await ctx.newPage()
const T0 = Date.now()
await page.goto(base); await page.evaluate(() => localStorage.clear()); await page.goto(base); await page.waitForTimeout(1500)
const sleep = ms => page.waitForTimeout(ms)

async function overlay() {
  await page.evaluate(() => {
    if (document.getElementById('cap')) return
    const st = document.createElement('style')
    st.textContent = `#cap{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);max-width:1100px;width:calc(100% - 120px);background:rgba(4,10,20,.88);color:#F1F5F9;font:500 19px/1.4 'Fira Sans',sans-serif;padding:12px 20px;border-radius:12px;z-index:99999;text-align:center;border:1px solid rgba(56,189,248,.35);pointer-events:none;transition:opacity .3s}
    #cur{position:fixed;width:22px;height:22px;border-radius:50%;background:rgba(56,189,248,.35);border:2px solid #38BDF8;z-index:100000;pointer-events:none;transform:translate(-50%,-50%);transition:width .12s,height .12s;left:-50px;top:-50px}
    #cur.down{width:14px;height:14px;background:#38BDF8}
    #card{position:fixed;inset:0;z-index:99998;display:grid;place-items:center;background:radial-gradient(900px 500px at 20% 20%,rgba(56,189,248,.18),transparent 60%),#0B1220;color:#E6EDF7;font-family:'Fira Sans',sans-serif;transition:opacity .6s}
    #card .in{max-width:980px;padding:40px}#card h1{font-size:54px;margin:0 0 10px;letter-spacing:-.02em}#card p{font-size:24px;color:#B6C2D4;margin:6px 0}#card .k{display:flex;gap:18px;margin-top:34px;flex-wrap:wrap}#card .k div{border:1px solid #26324A;background:#111A2B;border-radius:14px;padding:16px 20px;font-size:20px}#card .k b{display:block;font-size:30px;color:#38BDF8;font-family:'Fira Code',monospace}`
    document.head.appendChild(st)
    const c = document.createElement('div'); c.id = 'cap'; c.style.opacity = 0; document.body.appendChild(c)
    const cu = document.createElement('div'); cu.id = 'cur'; document.body.appendChild(cu)
    addEventListener('mousemove', e => { cu.style.left = e.clientX + 'px'; cu.style.top = e.clientY + 'px' }, true)
    addEventListener('mousedown', () => cu.classList.add('down'), true)
    addEventListener('mouseup', () => cu.classList.remove('down'), true)
  })
}
const caption = t => page.evaluate(t => { const c = document.getElementById('cap'); c.textContent = t; c.style.opacity = t ? 1 : 0 }, t)
let mx = W / 2, my = H / 2
async function moveTo(x, y, steps = 18) { await page.mouse.move(x, y, { steps }); mx = x; my = y }
async function click(loc, opts = {}) {
  const l = typeof loc === 'string' ? page.locator(loc).first() : loc
  await l.scrollIntoViewIfNeeded()
  const bb = await l.boundingBox()
  await moveTo(bb.x + bb.width / 2, bb.y + bb.height / 2, opts.steps ?? 20)
  await sleep(150); await page.mouse.down(); await sleep(70); await page.mouse.up()
  await sleep(opts.after ?? 400)
}
async function scrollBy(dy, ms = 900) { const n = 12; for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy / n); await sleep(ms / n) } }
const marks = []
async function scene(id, fn) {
  const start = Date.now()
  marks.push({ id, t: (start - T0) / 1000 })
  await overlay(); await caption(D[id].text)
  await fn()
  const left = (D[id].dur + PAD) * 1000 - (Date.now() - start)
  if (left > 0) await sleep(left)
}

// ---------- CENAS ----------
await overlay()
await page.evaluate(() => { const d = document.createElement('div'); d.id = 'card'; d.innerHTML = `<div class="in"><h1>Sentinela Urbana</h1><p>Urban Risk Intelligence Platform · GS 2026.2 · Engenharia de Software</p><div class="k"><div><b>Alagamentos</b>chuva forte, rios e córregos</div><div><b>Ilhas de calor</b>temperatura e umidade</div><div><b>Serviços</b>energia, água, transporte</div></div><p style="margin-top:30px">Dados espalhados · alertas tardios · informação sem origem nem confiança</p></div>`; document.body.appendChild(d) })
await sleep(300)
await scene('s0', async () => { await sleep(D.s0.dur * 1000 - 600); await page.evaluate(() => { document.getElementById('card').style.opacity = 0 }) })
await page.evaluate(() => document.getElementById('card')?.remove())

await scene('s1', async () => {
  await sleep(3500)
  await moveTo(1100, 270); await sleep(1500)
  await moveTo(1000, 580); await sleep(2500)
  await click('text=Entrar como Ana', { after: 1500 })
})
await scene('s2', async () => {
  await moveTo(700, 400); await sleep(1200); await moveTo(820, 420, 30); await sleep(1500)
  await moveTo(1250, 300, 25); await sleep(1800)
  await click('.sidebar >> text=Alertas', { after: 1200 })
  await scrollBy(400, 1500); await sleep(800); await scrollBy(-400, 900)
})
await scene('s3', async () => {
  await click('.alert-row >> nth=0', { after: 1500 })
  await moveTo(560, 470); await sleep(1500)
  await scrollBy(520, 1500); await sleep(2600)
  await moveTo(600, 560); await sleep(1500)
  await scrollBy(-520, 1000)
})
await scene('s4', async () => {
  await page.goto(base + '#/alertas/EV-1119-0043'); await sleep(1800)
  await moveTo(450, 470); await sleep(1500)
  await click('text=Também estou vendo isso', { after: 2500 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await sleep(1800)
  await click('.sidebar >> text=Notificações', { after: 1200 })
})
await scene('s5', async () => {
  await click('.sidebar >> text=Reportar', { after: 600 })
  await click('.type-card.t-alagamento', { after: 300 }); await click('text=Continuar', { after: 500 })
  await click('text=Usar minha localização', { after: 1000 }); await click('text=Continuar', { after: 400 })
  await click('text=Até o joelho', { after: 300 })
  await page.locator('textarea').fill('Água cobrindo a rua perto da escola'); await sleep(300)
  await click('text=Anexar foto', { after: 300 }); await click('text=Continuar', { after: 1000 })
  await scrollBy(250, 600); await sleep(900)
  await click('text=Enviar ocorrência', { after: 1200 })
})
await scene('s6', async () => {
  await page.locator('.role-switch select').selectOption('agente'); await sleep(600)
  await click('.sidebar >> text=Notificações', { after: 500 })
  await click('[role=tab] >> text=Tarefas', { after: 700 })
  await click(page.locator('li.notif').filter({ hasText: 'SNS-ALG-031' }).locator('button', { hasText: 'Validar' }), { after: 1300 })
  await scrollBy(450, 800)
  await click('text=Confirmar e emitir alerta', { after: 1200 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
})
await scene('s7', async () => {
  await click('.sidebar >> text=Fontes e confiança', { after: 1200 })
  await moveTo(500, 230); await sleep(1500)
  await scrollBy(500, 1200); await sleep(800)
  await page.locator('.sim-card').scrollIntoViewIfNeeded(); await sleep(400)
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' })); await sleep(700)
  await click('text=Enviar leitura', { after: 200 })
  for (let i = 0; i < 6; i++) { await page.evaluate(() => window.scrollBy({ top: 140, behavior: 'smooth' })); await sleep(600) }
})
await scene('s8', async () => {
  await click('.sidebar >> text=Preferências e LGPD', { after: 1200 })
  await click('#k-ana', { after: 800 }); await moveTo(1000, 520); await sleep(1500)
  await sleep(2500)
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'card'; d.style.opacity = 0; d.innerHTML = `<div class="in"><h1>Sentinela Urbana</h1><p>Alertas rápidos, confiáveis e transparentes para a cidade.</p><div class="k"><div><b>10 telas</b>protótipo funcional</div><div><b>&lt; 1 s</b>do dado ao alerta</div><div><b>LGPD</b>by design</div></div></div>`; document.body.appendChild(d); requestAnimationFrame(() => d.style.opacity = 1); document.getElementById('cap').style.opacity = 0 })
})
await sleep(1500)
const total = (Date.now() - T0) / 1000
fs.writeFileSync('../video/tmp/marks.json', JSON.stringify({ marks, total }))
const vp = await page.video().path()
await ctx.close(); await b.close()
console.log(vp, total, JSON.stringify(marks))
