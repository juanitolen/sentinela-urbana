import { Bus, Droplet, Thermometer, Waves, Zap, Radio, Globe, Users, HardHat, CheckCircle2, Clock, CircleX, Eye, Siren, ShieldCheck, FileText } from 'lucide-react'
import { EVENT_TYPES, SOURCE_TYPES } from '../engine/rules'

export const TYPE_ICON = { alagamento: Waves, calor: Thermometer, energia: Zap, agua: Droplet, transporte: Bus }
export const SOURCE_ICON = { sensor: Radio, publica: Globe, comunidade: Users, agente: HardHat }
export const STATE_ICON = {
  Reportado: FileText, 'Em validação': Clock, Confirmado: ShieldCheck, 'Alerta emitido': Siren,
  'Em monitoramento': Eye, Encerrado: CheckCircle2, Descartado: CircleX,
}
export const RISK_CLASS = { Baixo: 'r-low', Moderado: 'r-mod', Alto: 'r-high', Crítico: 'r-crit' }
export const CONF_CLASS = { Alta: 'c-high', Média: 'c-mid', Baixa: 'c-low' }

export function fmtAgo(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 60) return `há ${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  return `há ${h} h${m % 60 ? ` ${m % 60} min` : ''}`
}
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
export const fmtNum = (n) => Number(n).toLocaleString('pt-BR')

export function TypeIcon({ type, size = 16 }) {
  const I = TYPE_ICON[type] ?? Waves
  return <I size={size} aria-hidden="true" />
}

export function TypeChip({ type }) {
  return (
    <span className={`type-chip t-${type}`}>
      <TypeIcon type={type} size={14} /> {EVENT_TYPES[type]?.label}
    </span>
  )
}

export function RiskBadge({ level, big }) {
  return (
    <span className={`badge risk ${RISK_CLASS[level]} ${big ? 'big' : ''}`} title={`Nível de risco: ${level}`}>
      <span className="dot" aria-hidden="true" /> Risco {level}
    </span>
  )
}

export function PriorityBadge({ p }) {
  return <span className={`badge prio prio-${p}`} title={`Prioridade ${p}`}>{p}</span>
}

export function StateBadge({ state }) {
  const I = STATE_ICON[state] ?? FileText
  const cls = state.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
  return <span className={`badge state s-${cls}`}><I size={13} aria-hidden="true" /> {state}</span>
}

export function SourceBadge({ type, id }) {
  const I = SOURCE_ICON[type] ?? Globe
  return (
    <span className={`badge source src-${type}`} title={`Origem: ${SOURCE_TYPES[type]?.label}`}>
      <I size={13} aria-hidden="true" /> {SOURCE_TYPES[type]?.label}{id ? <span className="mono muted"> · {id}</span> : null}
    </span>
  )
}

/** Medidor de confiança: barra + número + rótulo textual (não depende só de cor). */
export function ConfidenceMeter({ score, level, compact }) {
  return (
    <div className={`conf ${CONF_CLASS[level]} ${compact ? 'compact' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={`Confiança ${score} de 100, ${level}`}>
      {!compact && <span className="conf-label">Confiança</span>}
      <span className="conf-bar"><span style={{ width: `${score}%` }} /></span>
      <span className="conf-val mono">{score}</span>
      <span className="conf-lvl">{level}</span>
    </div>
  )
}

export function Freshness({ ts, intervalSec, now }) {
  const ageS = (now - ts) / 1000
  const expected = Math.max(intervalSec, 60)
  const status = ageS <= expected * 1.5 ? 'ok' : ageS <= expected * 3 ? 'warn' : 'late'
  const label = { ok: 'Atualizado', warn: 'Atrasando', late: 'Desatualizado' }[status]
  return (
    <span className={`fresh f-${status}`} title={`Esperado a cada ${intervalSec}s`}>
      <span className="pulse" aria-hidden="true" /> {label} · {fmtAgo(ts, now)}
    </span>
  )
}

export function Empty({ icon: I, title, children }) {
  return (
    <div className="empty">
      {I && <I size={28} aria-hidden="true" />}
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  )
}
