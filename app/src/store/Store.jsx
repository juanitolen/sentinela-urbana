import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PERSONAS, seedEventInputs, seedNotifications, seedSources } from '../data/seed'
import {
  EVENT_TYPES, SOURCE_TYPES, canTransition, channelsFor, computeConfidence, computePriority,
  computeRisk, computeSeverity, distanceM,
} from '../engine/rules'

const KEY = 'sentinela:v2'
const MIN = 60000
const Ctx = createContext(null)

const PRIORITY_RANK = { P1: 1, P2: 2, P3: 3, P4: 4 }

function defaultPrefs() {
  return {
    types: { alagamento: true, calor: true, energia: true, agua: true, transporte: false },
    minPriority: 'P3',
    channels: { push: true, sms: true, email: false },
    radiusKm: 3,
    quietHours: false,
  }
}
function defaultConsents() {
  return { localizacao: true, notificacoes: true, analiseAnonima: true, compartilhamentoParceiros: false }
}

function buildInitial() {
  const now = Date.now()
  const sources = seedSources(now)
  const events = seedEventInputs(now).map((e) => ({
    ...e,
    createdAt: now - e.createdMin * MIN,
    updatedAt: now - Math.min(...e.history.map((h) => h[1])) * MIN,
    evidences: e.evidences.map((ev) => ({ ...ev, at: now - ev.ageMin * MIN })),
    history: e.history.map(([state, m, note]) => ({ state, at: now - m * MIN, by: note.startsWith('Agente') ? 'Carlos Mendes (Defesa Civil)' : 'Sistema', note })),
    updates: [],
    pipeline: null,
  }))
  return {
    roleKey: null,
    prefs: defaultPrefs(),
    consents: defaultConsents(),
    sources,
    events,
    notifications: seedNotifications(now),
    audit: [
      { at: now - 30 * MIN, who: 'Sistema', what: 'Dados pessoais pseudonimizados no registro EV-1119-0042 (relator #8F2A)' },
      { at: now - 20 * MIN, who: 'Carlos Mendes', what: 'Acesso ao detalhe do evento EV-1119-0042 (finalidade: resposta a emergência)' },
    ],
    myReports: [],
    seq: 45,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* storage indisponível */ }
  return buildInitial()
}

function reputationOf(ev) {
  if (typeof ev.reputation === 'number') return ev.reputation
  const m = /reputação ([0-9],[0-9])/.exec(ev.reporter || '')
  return m ? parseFloat(m[1].replace(',', '.')) : 0.3
}

/** Recalcula confiança, risco e prioridade de um evento a partir das evidências (motor de regras). */
export function deriveEvent(e, sources, now) {
  const primary = e.evidences[0]
  const src = sources.find((s) => s.id === primary.sourceId)
  const distinct = new Set(e.evidences.map((x) => x.sourceId))
  const corroborations = Math.max(0, distinct.size - 1) + (e.extraCorroborations || 0)
  const confidence = computeConfidence({
    sourceType: primary.sourceType,
    ageMin: (now - primary.at) / MIN,
    corroborations,
    reputation: reputationOf(primary),
    hasPhoto: !!primary.hasPhoto,
    calibrationDays: src?.calibrationDays ?? 0,
    sensorStatus: src?.status,
    validatedByAgent: !!e.validatedByAgent,
  })
  const severity = computeSeverity(e.type, e.value, e.extra)
  const risk = computeRisk(severity, e.exposure)
  const prio = computePriority(risk.level, confidence.score)
  // RN07 — relato comunitário isolado (sem corroboração) nunca dispara alerta sem validação humana
  if (primary.sourceType === 'comunidade' && corroborations === 0 && !e.validatedByAgent) prio.autoConfirm = false
  return { ...e, confidence, severity, risk, prio, corroborations }
}

const VALID_RANGE = {
  alagamento: [0, 300], calor: [-5, 55], energia: [0, 5e6], agua: [0, 5e6], transporte: [0, 600],
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [now, setNow] = useState(Date.now())
  const [toasts, setToasts] = useState([])
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  // "Tempo real": a cada 5 s as fontes online publicam novas leituras
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now()
      setNow(n)
      setState((s) => ({
        ...s,
        sources: s.sources.map((src) => {
          if (src.status === 'atrasado') return src
          if (n - src.lastUpdate < Math.max(src.intervalSec * 1000 * 0.5, 5000) && src.intervalSec > 30) return src
          const jitter = src.unit === '°C' ? (Math.random() - 0.45) * 0.2 : 0
          const reading = src.unit === '°C' ? Math.round((src.reading + jitter) * 10) / 10 : src.reading
          return { ...src, lastUpdate: n, reading }
        }),
      }))
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const toast = useCallback((msg, tone = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const user = state.roleKey ? PERSONAS[state.roleKey] : null

  const events = useMemo(
    () => state.events.map((e) => deriveEvent(e, state.sources, now)).sort((a, b) => b.updatedAt - a.updatedAt),
    [state.events, state.sources, now],
  )

  const myNotifications = useMemo(() => {
    if (!user) return []
    return state.notifications
      .filter((n) => n.audience.includes(user.role))
      .filter((n) => {
        if (user.role !== 'morador' || n.kind !== 'alerta') return true
        const ev = state.events.find((e) => e.id === n.eventId)
        if (ev && !state.prefs.types[ev.type]) return false
        return PRIORITY_RANK[n.priority] <= PRIORITY_RANK[state.prefs.minPriority]
      })
      .sort((a, b) => b.at - a.at)
  }, [state.notifications, state.events, state.prefs, user])

  /* ------------------------------------------------------------------ */
  /* Pipeline de processamento (espelha o Diagrama de Sequência)          */
  /* ------------------------------------------------------------------ */
  const ingest = useCallback((input) => {
    const s = stateRef.current
    const t0 = Date.now()
    const steps = []
    const step = (name, actor, detail, dt, ok = true) => steps.push({ name, actor, detail, at: t0 + dt, ok })
    const src = s.sources.find((x) => x.id === input.sourceId)
    const sourceType = src?.type ?? input.sourceType

    step('Dado recebido', 'API Gateway', `${SOURCE_TYPES[sourceType].label} ${input.sourceId} autenticado · ${src?.protocol ?? 'HTTPS'}`, 0)
    step('Publicado no barramento', 'Serviço de Ingestão', 'Normalizado para o esquema canônico e publicado no tópico eventos.brutos', 35)

    const [lo, hi] = VALID_RANGE[input.type]
    const valid = typeof input.value === 'number' && input.value >= lo && input.value <= hi && !!input.coords
    let seq = s.seq + 1
    const id = `EV-1119-${String(seq).padStart(4, '0')}`

    if (!valid) {
      step('Validação técnica', 'Serviço de Validação', `Valor ${input.value} fora da faixa física [${lo}, ${hi}] — descartado`, 70, false)
      const ev = {
        id, type: input.type, title: input.title || `${EVENT_TYPES[input.type].label} — leitura inválida`, neighborhood: input.neighborhood, address: input.address || '',
        coords: input.coords || [-23.55, -46.63], value: input.value, extra: input.extra, exposure: input.exposure || 2, radiusM: 500, affected: 0,
        createdAt: t0, updatedAt: t0, notified: 0, updates: [],
        evidences: [{ sourceId: input.sourceId, sourceType, value: `${input.value}`, at: t0, note: 'Leitura fora da faixa física' }],
        history: [{ state: 'Reportado', at: t0, by: 'Sistema', note: 'Dado recebido' }, { state: 'Descartado', at: t0 + 70, by: 'Sistema', note: 'Falha na validação técnica' }],
        state: 'Descartado', pipeline: steps,
      }
      setState((p) => ({ ...p, seq, events: [ev, ...p.events] }))
      return { id, steps, merged: false, discarded: true }
    }
    step('Validação técnica', 'Serviço de Validação', `Esquema, faixa física [${lo}, ${hi}] e saúde da fonte (${src?.status ?? 'ok'}) verificados`, 70)

    const evidence = {
      sourceId: input.sourceId, sourceType,
      value: input.valueLabel || `${input.value} ${EVENT_TYPES[input.type].unit}`,
      at: t0, note: input.note || '', hasPhoto: !!input.hasPhoto,
      reporter: input.reporter, reputation: input.reputation,
    }

    // Correlação/deduplicação: mesmo tipo, raio de 500 m, evento aberto
    const open = s.events.find((e) => e.type === input.type && !['Encerrado', 'Descartado'].includes(e.state) && distanceM(e.coords, input.coords) <= 500)
    let base
    let merged = false
    if (open) {
      merged = true
      base = { ...open, value: Math.max(open.value, input.value), evidences: [...open.evidences, evidence], updatedAt: t0 }
      if (input.sourceId === open.evidences[0].sourceId || open.evidences.some((x) => x.sourceId === input.sourceId)) {
        base.extraCorroborations = (open.extraCorroborations || 0) + (sourceType === 'comunidade' ? 1 : 0)
      }
      step('Correlação', 'Processador de Eventos', `Agregado ao ${open.id} (mesmo tipo, ${Math.round(distanceM(open.coords, input.coords))} m) — corroboração`, 110)
      seq = s.seq
    } else {
      base = {
        id, type: input.type, title: input.title, neighborhood: input.neighborhood, address: input.address || '',
        coords: input.coords, value: input.value, extra: input.extra, exposure: input.exposure ?? 2,
        radiusM: input.radiusM ?? 600, affected: input.affected ?? 2500, createdAt: t0, updatedAt: t0, notified: 0, updates: [],
        evidences: [evidence], history: [{ state: 'Reportado', at: t0, by: sourceType === 'comunidade' ? 'Morador (pseudonimizado)' : 'Sistema', note: `Recebido de ${input.sourceId}` }],
        state: 'Reportado',
      }
      step('Correlação', 'Processador de Eventos', 'Nenhum evento aberto em 500 m — novo evento criado', 110)
    }

    const d = deriveEvent(base, s.sources, t0)
    step('Nível de confiança', 'Serviço de Confiança', `${d.confidence.score}/100 · ${d.confidence.level} (${d.confidence.factors.map((f) => `${f.label} ${f.kind === 'base' ? f.value : (f.value > 0 ? '+' : '') + f.value}`).join('; ')})`, 150)
    step('Classificação de risco', 'Motor de Risco', `Severidade ${d.severity} × exposição ${d.exposure} = ${d.risk.matrix} → ${d.risk.level}`, 190)
    step('Priorização', 'Gestor de Alertas', `0,7×peso(${d.risk.level}) + 0,3×confiança = ${d.prio.score} → ${d.prio.priority}`, 220)

    const hist = [...base.history]
    const notifs = []
    let newState = base.state
    const prevPriority = open ? deriveEvent(open, s.sources, t0).prio.priority : null

    const push = (st, note, dt, by = 'Sistema') => { hist.push({ state: st, at: t0 + dt, by, note }); newState = st }

    if (newState === 'Reportado') push('Em validação', 'Validação técnica OK', 230)

    if (newState === 'Em validação') {
      if (d.prio.autoConfirm) {
        push('Confirmado', `Confiança ${d.confidence.level} (${d.confidence.score} ≥ 50) — confirmação automática`, 240)
        if (d.prio.emits) {
          const ch = channelsFor(d.prio.priority)
          const recipients = Math.round(base.affected * 0.4)
          step('Filtro LGPD / consentimento', 'Serviço de Privacidade', `${recipients.toLocaleString('pt-BR')} destinatários com consentimento de localização ativo no raio de ${base.radiusM} m (dados pseudonimizados)`, 300)
          push('Alerta emitido', `${ch.join(' + ')} para ${recipients.toLocaleString('pt-BR')} pessoas`, 320)
          base.notified = recipients
          notifs.push({
            id: `N-${t0}`, eventId: base.id, priority: d.prio.priority, kind: 'alerta',
            title: `${EVENT_TYPES[base.type].label}: ${base.neighborhood}`,
            body: `${base.title}. Risco ${d.risk.level}, confiança ${d.confidence.level}.`,
            channels: ch, at: t0 + 900, read: false, audience: ['morador', 'agente', 'operador'],
          })
          step('Notificação enviada', 'Serviço de Notificação', `Canais: ${ch.join(', ')} · entrega confirmada em 0,9 s`, 900)
        } else {
          push('Em monitoramento', 'Prioridade P4 — sem notificação pública', 260)
          step('Sem notificação', 'Gestor de Alertas', 'P4: evento registrado e monitorado', 260)
        }
      } else {
        step('Validação humana', 'Gestor de Alertas', `${d.confidence.score < 50 ? `Confiança ${d.confidence.score} < 50` : 'Relato comunitário sem corroboração'} — tarefa enviada à Defesa Civil (SLA ${d.prio.slaMin} min). Nenhum alerta público até validação.`, 260)
        notifs.push({
          id: `N-${t0}`, eventId: base.id, priority: d.prio.priority, kind: 'tarefa',
          title: 'Validação pendente',
          body: `${base.title} (${base.neighborhood}) — confiança ${d.confidence.score} · ${d.confidence.level}. SLA: ${d.prio.slaMin} min.`,
          channels: ['painel'], at: t0 + 300, read: false, audience: ['agente'],
        })
      }
    } else if (newState === 'Em monitoramento' && prevPriority && PRIORITY_RANK[d.prio.priority] < PRIORITY_RANK[prevPriority]) {
      const ch = channelsFor(d.prio.priority)
      push('Alerta emitido', `Escalonamento ${prevPriority} → ${d.prio.priority}: alerta reemitido`, 300)
      notifs.push({ id: `N-${t0}`, eventId: base.id, priority: d.prio.priority, kind: 'alerta', title: `Risco aumentou: ${base.neighborhood}`, body: `${base.title}. Nova prioridade ${d.prio.priority}.`, channels: ch, at: t0 + 900, read: false, audience: ['morador', 'agente', 'operador'] })
      step('Notificação enviada', 'Serviço de Notificação', `Reemissão por escalonamento · ${ch.join(', ')}`, 900)
    } else {
      step('Atualização', 'Gestor de Alertas', `Evento em "${newState}" atualizado com nova evidência`, 260)
    }

    const final = { ...base, state: newState, history: hist, pipeline: steps }
    setState((p) => ({
      ...p,
      seq,
      events: merged ? p.events.map((e) => (e.id === final.id ? final : e)) : [final, ...p.events],
      notifications: [...notifs, ...p.notifications],
      sources: p.sources.map((x) => (x.id === input.sourceId ? { ...x, lastUpdate: t0, reading: sourceType === 'comunidade' ? x.reading + 1 : input.value, history: sourceType === 'comunidade' ? x.history : [...x.history.slice(1), input.value] } : x)),
      audit: sourceType === 'comunidade' ? [{ at: t0, who: 'Sistema', what: `Registro comunitário pseudonimizado (${final.id}); geolocalização arredondada para 100 m` }, ...p.audit] : p.audit,
    }))
    return { id: final.id, steps, merged, discarded: false, derived: d, state: newState }
  }, [])

  const transition = useCallback((eventId, to, note, by) => {
    setState((p) => ({
      ...p,
      events: p.events.map((e) => {
        if (e.id !== eventId || !canTransition(e.state, to)) return e
        const n = Date.now()
        const next = { ...e, state: to, updatedAt: n, history: [...e.history, { state: to, at: n, by, note }] }
        if (to === 'Confirmado' && by.includes('Defesa Civil')) next.validatedByAgent = true
        return next
      }),
    }))
  }, [])

  /** Ações do agente — confirma (confiança 100) e, se aplicável, emite alerta. */
  const agentConfirm = useCallback((eventId, emit = true) => {
    const by = 'Carlos Mendes (Defesa Civil)'
    const n = Date.now()
    const s = stateRef.current
    const e = s.events.find((x) => x.id === eventId)
    if (!e) return
    const d = deriveEvent({ ...e, validatedByAgent: true }, s.sources, n)
    const hist = [...e.history, { state: 'Confirmado', at: n, by, note: 'Validado em campo/câmera — confiança 100' }]
    let st = 'Confirmado'
    const notifs = []
    let notified = e.notified
    if (emit && d.prio.emits) {
      const ch = channelsFor(d.prio.priority)
      notified = Math.round(e.affected * 0.4)
      hist.push({ state: 'Alerta emitido', at: n + 500, by, note: `${ch.join(' + ')} para ${notified.toLocaleString('pt-BR')} pessoas` })
      st = 'Alerta emitido'
      notifs.push({ id: `N-${n}`, eventId, priority: d.prio.priority, kind: 'alerta', title: `${EVENT_TYPES[e.type].label} confirmado: ${e.neighborhood}`, body: `${e.title}. Confirmado pela Defesa Civil. Risco ${d.risk.level}.`, channels: ch, at: n + 500, read: false, audience: ['morador', 'agente', 'operador'] })
    } else {
      hist.push({ state: 'Em monitoramento', at: n + 500, by, note: 'Sem necessidade de alerta público' })
      st = 'Em monitoramento'
    }
    setState((p) => ({
      ...p,
      events: p.events.map((x) => (x.id === eventId ? { ...x, validatedByAgent: true, state: st, updatedAt: n, history: hist, notified } : x)),
      notifications: [...notifs, ...p.notifications.map((x) => (x.eventId === eventId && x.kind === 'tarefa' ? { ...x, read: true } : x))],
      audit: [{ at: n, who: 'Carlos Mendes', what: `Validação do evento ${eventId}` }, ...p.audit],
    }))
  }, [])

  const corroborate = useCallback((eventId) => {
    const s = stateRef.current
    const e = s.events.find((x) => x.id === eventId)
    if (!e) return null
    return ingest({ sourceId: 'COM-APP', type: e.type, value: e.value, coords: e.coords, neighborhood: e.neighborhood, title: e.title, note: 'Morador confirmou: "Também estou vendo isso"', reporter: 'Ana Souza (pseudonimizado #A51D)', reputation: 0.7, valueLabel: 'Confirmação de morador' })
  }, [ingest])

  const addUpdate = useCallback((eventId, text, by) => {
    setState((p) => ({ ...p, events: p.events.map((e) => (e.id === eventId ? { ...e, updatedAt: Date.now(), updates: [{ at: Date.now(), by, text }, ...(e.updates || [])] } : e)) }))
  }, [])

  const api = {
    state, now, user, events, myNotifications, toasts, toast,
    setRole: (roleKey) => setState((p) => ({ ...p, roleKey })),
    logout: () => setState((p) => ({ ...p, roleKey: null })),
    ingest, transition, agentConfirm, corroborate, addUpdate,
    markRead: (id) => setState((p) => ({ ...p, notifications: p.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    markAllRead: () => setState((p) => ({ ...p, notifications: p.notifications.map((n) => (user && n.audience.includes(user.role) ? { ...n, read: true } : n)) })),
    setPrefs: (prefs) => setState((p) => ({ ...p, prefs: { ...p.prefs, ...prefs } })),
    setConsents: (c) => setState((p) => ({ ...p, consents: { ...p.consents, ...c }, audit: [{ at: Date.now(), who: user?.name ?? 'Usuário', what: `Consentimento alterado: ${Object.entries(c).map(([k, v]) => `${k}=${v ? 'sim' : 'não'}`).join(', ')}` }, ...p.audit] })),
    addMyReport: (id) => setState((p) => ({ ...p, myReports: [id, ...p.myReports] })),
    logAudit: (what) => setState((p) => ({ ...p, audit: [{ at: Date.now(), who: user?.name ?? 'Usuário', what }, ...p.audit] })),
    resetDemo: () => { const s = buildInitial(); setState({ ...s, roleKey: stateRef.current.roleKey }) },
    deleteMyData: () => setState((p) => ({ ...p, myReports: [], prefs: defaultPrefs(), consents: { localizacao: false, notificacoes: false, analiseAnonima: false, compartilhamentoParceiros: false }, audit: [{ at: Date.now(), who: user?.name ?? 'Usuário', what: 'Solicitação de eliminação de dados pessoais (Art. 18, VI LGPD) — concluída' }, ...p.audit] })),
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
