import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, Siren, Clock, Radio, ChevronRight, MessageSquarePlus, Layers } from 'lucide-react'
import { useStore } from '../store/Store'
import RiskMap from '../components/RiskMap'
import { ConfidenceMeter, Freshness, PageHeader, PriorityBadge, RiskBadge, SourceBadge, StateBadge, TypeChip, TypeIcon, fmtAgo } from '../components/ui'
import { EVENT_TYPES, RISK_LEVELS } from '../engine/rules'

const SHORT = { alagamento: 'Alagamento', calor: 'Calor', energia: 'Energia', agua: 'Água', transporte: 'Transporte' }

export default function Dashboard() {
  const { events, state, now, user } = useStore()
  const nav = useNavigate()
  const [sel, setSel] = useState(null)
  const [typeFilter, setTypeFilter] = useState('todos')
  const [showSources, setShowSources] = useState(true)

  const open = events.filter((e) => !['Encerrado', 'Descartado'].includes(e.state))
  const shown = (typeFilter === 'todos' ? events.filter((e) => e.state !== 'Descartado') : events.filter((e) => e.type === typeFilter && e.state !== 'Descartado'))
  const selected = events.find((e) => e.id === sel)
  const pending = open.filter((e) => e.state === 'Em validação')
  const active = open.filter((e) => e.state === 'Alerta emitido')
  const fresh = state.sources.filter((s) => s.status !== 'atrasado').length
  const late = state.sources.length - fresh

  const byRisk = RISK_LEVELS.map((l) => ({ l, n: open.filter((e) => e.risk.level === l).length }))
  const top = [...open].sort((a, b) => a.prio.priority.localeCompare(b.prio.priority) || b.prio.score - a.prio.score).slice(0, 5)

  return (
    <div className="page">
      <PageHeader title={`Olá, ${user.name.split(' ')[0]}`} subtitle={user.role === 'morador' ? `Situação agora em São Paulo e no raio de 3 km da sua casa (${user.bairro}).` : 'Painel de acompanhamento — visão operacional da cidade.'}>
        <span className="live-pill"><span className="pulse" aria-hidden="true" /> Ao vivo · atualiza a cada 5 s</span>
        <Link to="/reportar" className="btn primary"><MessageSquarePlus size={16} aria-hidden="true" /> Reportar ocorrência</Link>
      </PageHeader>

      <section className="kpis" aria-label="Indicadores">
        <div className="kpi"><span className="kpi-ico k-red"><Siren size={18} aria-hidden="true" /></span><div><span className="kpi-val mono">{active.length}</span><span className="kpi-lbl">Alertas ativos</span></div></div>
        <div className="kpi"><span className="kpi-ico k-amber"><Clock size={18} aria-hidden="true" /></span><div><span className="kpi-val mono">{pending.length}</span><span className="kpi-lbl">Aguardando validação</span></div></div>
        <div className="kpi"><span className="kpi-ico k-blue"><Activity size={18} aria-hidden="true" /></span><div><span className="kpi-val mono">{open.length}</span><span className="kpi-lbl">Eventos abertos</span></div></div>
        <div className="kpi"><span className="kpi-ico k-green"><Radio size={18} aria-hidden="true" /></span><div><span className="kpi-val mono">{fresh}/{state.sources.length}</span><span className="kpi-lbl">Fontes em dia{late ? ` · ${late} atrasada` : ''}</span></div></div>
      </section>

      <div className="dash-grid">
        <section className="card map-card">
          <div className="card-head">
            <h2>Mapa de riscos</h2>
            <div className="row gap8 wrap">
              <div className="seg" role="group" aria-label="Filtrar por tipo">
                {['todos', ...Object.keys(EVENT_TYPES)].map((t) => (
                  <button key={t} className={typeFilter === t ? 'on' : ''} onClick={() => setTypeFilter(t)} aria-pressed={typeFilter === t}>
                    {t === 'todos' ? 'Todos' : <><TypeIcon type={t} size={14} /> <span className="hide-sm">{SHORT[t]}</span></>}
                  </button>
                ))}
              </div>
              <button className={`chip-btn ${showSources ? 'on' : ''}`} onClick={() => setShowSources((v) => !v)} aria-pressed={showSources}><Layers size={14} aria-hidden="true" /> Fontes</button>
            </div>
          </div>
          <RiskMap events={shown} sources={state.sources} showSources={showSources} onSelect={setSel} selectedId={sel} height={460} home={user.role === 'morador' ? user.home : null} />
          <div className="legend">
            {RISK_LEVELS.map((l) => <span key={l}><RiskBadge level={l} /></span>)}
            <span className="muted small">Borda tracejada = em validação · Pontos pequenos = sensores/APIs</span>
          </div>
          {selected && (
            <div className="map-sel">
              <div className="row gap8 wrap"><TypeChip type={selected.type} /><RiskBadge level={selected.risk.level} /><StateBadge state={selected.state} /></div>
              <strong>{selected.title}</strong>
              <div className="row gap12 wrap">
                <SourceBadge type={selected.evidences[0].sourceType} id={selected.evidences[0].sourceId} />
                <ConfidenceMeter score={selected.confidence.score} level={selected.confidence.level} compact />
              </div>
              <button className="btn ghost sm" onClick={() => nav(`/alertas/${selected.id}`)}>Ver detalhe <ChevronRight size={14} aria-hidden="true" /></button>
            </div>
          )}
        </section>

        <aside className="dash-side">
          <section className="card">
            <div className="card-head"><h2>Prioridades agora</h2><Link to="/alertas" className="link small">Ver todos</Link></div>
            <ul className="prio-list">
              {top.map((e) => (
                <li key={e.id}>
                  <Link to={`/alertas/${e.id}`} className="prio-item">
                    <PriorityBadge p={e.prio.priority} />
                    <div className="grow">
                      <strong className="clamp1">{e.title}</strong>
                      <div className="row gap8 small muted wrap"><span>{e.neighborhood}</span>·<span>{e.state}</span>·<span>{fmtAgo(e.updatedAt, now)}</span></div>
                      <ConfidenceMeter score={e.confidence.score} level={e.confidence.level} compact />
                    </div>
                    <ChevronRight size={16} aria-hidden="true" className="muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="card-head"><h2>Eventos por nível de risco</h2></div>
            <div className="risk-bars">
              {byRisk.map(({ l, n }) => (
                <div key={l} className="rb-row">
                  <span className="rb-l">{l}</span>
                  <span className="rb-track"><span className={`rb-fill ${l}`} style={{ width: `${(n / Math.max(1, open.length)) * 100}%` }} /></span>
                  <span className="mono">{n}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h2>Atualização das fontes</h2><Link to="/fontes" className="link small">Detalhes</Link></div>
            <ul className="src-mini">
              {state.sources.slice(0, 6).concat(state.sources.filter((s) => s.status === 'atrasado')).filter((v, i, a) => a.indexOf(v) === i).map((s) => (
                <li key={s.id}>
                  <Link to={`/fontes/${s.id}`}>
                    <span className="clamp1 small">{s.name}</span>
                    <Freshness ts={s.lastUpdate} intervalSec={s.intervalSec} now={now} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
