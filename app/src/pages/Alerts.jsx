import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronRight, TriangleAlert } from 'lucide-react'
import { useStore } from '../store/Store'
import { ConfidenceMeter, Empty, PageHeader, PriorityBadge, RiskBadge, SourceBadge, StateBadge, TypeChip, fmtAgo, fmtNum } from '../components/ui'
import { EVENT_TYPES, RISK_LEVELS, STATES } from '../engine/rules'

export default function Alerts() {
  const { events, now, user } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('todos')
  const [risk, setRisk] = useState('todos')
  const [st, setSt] = useState(user.role === 'agente' ? 'abertos' : 'abertos')
  const [conf, setConf] = useState('todas')
  const [sort, setSort] = useState('prioridade')

  const list = useMemo(() => {
    let l = events
    if (st === 'abertos') l = l.filter((e) => !['Encerrado', 'Descartado'].includes(e.state))
    else if (st !== 'todos') l = l.filter((e) => e.state === st)
    if (type !== 'todos') l = l.filter((e) => e.type === type)
    if (risk !== 'todos') l = l.filter((e) => e.risk.level === risk)
    if (conf !== 'todas') l = l.filter((e) => e.confidence.level === conf)
    if (q) l = l.filter((e) => `${e.title} ${e.neighborhood} ${e.id}`.toLowerCase().includes(q.toLowerCase()))
    return [...l].sort((a, b) => (sort === 'prioridade' ? a.prio.priority.localeCompare(b.prio.priority) || b.prio.score - a.prio.score : b.updatedAt - a.updatedAt))
  }, [events, st, type, risk, conf, q, sort])

  return (
    <div className="page">
      <PageHeader title="Alertas e eventos" subtitle="Ordenados por prioridade (risco × confiança). Cada item indica a origem do dado e o nível de confiança." />

      <div className="filters card">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por bairro, título ou código" aria-label="Buscar" />
        </label>
        <label><span>Situação</span>
          <select value={st} onChange={(e) => setSt(e.target.value)}>
            <option value="abertos">Abertos</option><option value="todos">Todos</option>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label><span>Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="todos">Todos</option>
            {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label><span>Risco</span>
          <select value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="todos">Todos</option>{RISK_LEVELS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label><span>Confiança</span>
          <select value={conf} onChange={(e) => setConf(e.target.value)}>
            <option value="todas">Todas</option><option>Alta</option><option>Média</option><option>Baixa</option>
          </select>
        </label>
        <label><span>Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="prioridade">Prioridade</option><option value="recente">Mais recentes</option>
          </select>
        </label>
      </div>

      <p className="muted small" aria-live="polite">{list.length} resultado(s)</p>

      {list.length === 0 ? (
        <Empty icon={TriangleAlert} title="Nenhum evento com esses filtros">Ajuste os filtros acima para ver mais resultados.</Empty>
      ) : (
        <ul className="alert-list">
          {list.map((e) => (
            <li key={e.id}>
              <Link to={`/alertas/${e.id}`} className={`alert-row lvl-${e.risk.level}`}>
                <div className="ar-prio"><PriorityBadge p={e.prio.priority} /><span className="mono tiny muted">{e.prio.score}</span></div>
                <div className="ar-main">
                  <div className="row gap8 wrap"><TypeChip type={e.type} /><RiskBadge level={e.risk.level} /><StateBadge state={e.state} /></div>
                  <strong className="ar-title">{e.title}</strong>
                  <div className="small muted row gap8 wrap"><span className="mono">{e.id}</span>·<span>{e.neighborhood}</span>·<span>{fmtNum(e.affected)} pessoas na área</span>·<span>atualizado {fmtAgo(e.updatedAt, now)}</span></div>
                </div>
                <div className="ar-prov">
                  <SourceBadge type={e.evidences[0].sourceType} />
                  <span className="tiny muted">{e.evidences.length} evidência(s) · {new Set(e.evidences.map((x) => x.sourceId)).size} fonte(s)</span>
                  <ConfidenceMeter score={e.confidence.score} level={e.confidence.level} compact />
                </div>
                <ChevronRight size={18} className="muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
