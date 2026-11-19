import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Play, Cpu, Info } from 'lucide-react'
import { useStore } from '../store/Store'
import { Freshness, PageHeader, SourceBadge, fmtNum } from '../components/ui'
import { SOURCE_TYPES } from '../engine/rules'

const SIM = {
  'SNS-ALG-014': { type: 'alagamento', label: 'Nível (cm)', def: 55, title: 'Alagamento na Av. do Estado (Rio Tamanduateí)', neighborhood: 'Mooca', exposure: 3, radiusM: 900, affected: 12000 },
  'SNS-ALG-022': { type: 'alagamento', label: 'Nível (cm)', def: 34, title: 'Alagamento na Av. Aricanduva', neighborhood: 'Aricanduva', exposure: 3, radiusM: 700, affected: 9000 },
  'SNS-TMP-011': { type: 'calor', label: 'Temperatura (°C)', def: 38.5, title: 'Calor extremo no Brás', neighborhood: 'Brás', exposure: 2, radiusM: 900, affected: 15000, extra: { humidity: 18 } },
  'API-ENE-003': { type: 'energia', label: 'Domicílios sem energia', def: 52000, title: 'Falta de energia em Pinheiros', neighborhood: 'Pinheiros', exposure: 2, radiusM: 1800, affected: 52000 },
  'API-TRP-005': { type: 'transporte', label: 'Atraso médio (min)', def: 130, title: 'Linha de ônibus interrompida na Lapa', neighborhood: 'Lapa', exposure: 2, radiusM: 1200, affected: 8000 },
}

export default function Sources() {
  const { state, now, ingest, toast } = useStore()
  const [filter, setFilter] = useState('todas')
  const [simId, setSimId] = useState('SNS-ALG-022')
  const [val, setVal] = useState(SIM['SNS-ALG-022'].def)
  const [run, setRun] = useState(null)
  const [shown, setShown] = useState(0)

  const list = state.sources.filter((s) => filter === 'todas' || s.type === filter)

  function simulate() {
    const cfg = SIM[simId]
    const src = state.sources.find((s) => s.id === simId)
    const r = ingest({ sourceId: simId, type: cfg.type, value: Number(val), coords: src.coords, neighborhood: cfg.neighborhood, title: cfg.title, exposure: cfg.exposure, radiusM: cfg.radiusM, affected: cfg.affected, extra: cfg.extra, note: 'Leitura recebida pelo simulador de ingestão' })
    setRun(r); setShown(0)
    r.steps.forEach((_, i) => setTimeout(() => setShown(i + 1), 350 * (i + 1)))
    toast(r.discarded ? 'Leitura descartada na validação' : `Processado: ${r.id} → ${r.state}`, r.discarded ? 'warn' : 'ok')
  }

  return (
    <div className="page">
      <PageHeader title="Fontes de dados e confiança" subtitle="De onde vem cada dado, com que frequência chega e quanto confiar nele." />

      <section className="card rules-card">
        <div className="card-head"><h2><Info size={18} aria-hidden="true" /> Como o nível de confiança é calculado</h2></div>
        <div className="rules-grid">
          <div>
            <h3 className="h3">Base por origem</h3>
            <ul className="plain">
              {Object.entries(SOURCE_TYPES).map(([k, v]) => <li key={k} className="row between"><SourceBadge type={k} /><span className="mono">{v.base}</span></li>)}
            </ul>
          </div>
          <div>
            <h3 className="h3">Ajustes</h3>
            <ul className="plain small">
              <li className="row between"><span>Corroboração (por fonte independente, até 2)</span><span className="mono pos">+15</span></li>
              <li className="row between"><span>Foto anexada (comunidade)</span><span className="mono pos">+10</span></li>
              <li className="row between"><span>Reputação do relator (0–1)</span><span className="mono pos">+0 a +15</span></li>
              <li className="row between"><span>Dado com mais de 15 min / 60 min</span><span className="mono neg">−10 / −25</span></li>
              <li className="row between"><span>Calibração vencida (&gt; 90 dias)</span><span className="mono neg">−15</span></li>
              <li className="row between"><span>Sensor degradado</span><span className="mono neg">−30</span></li>
              <li className="row between"><span>Validação por agente</span><span className="mono">= 100</span></li>
            </ul>
          </div>
          <div>
            <h3 className="h3">Faixas</h3>
            <ul className="plain small">
              <li className="row between"><span className="badge conf-chip c-high">Alta</span><span className="mono">75–100</span></li>
              <li className="row between"><span className="badge conf-chip c-mid">Média</span><span className="mono">50–74</span></li>
              <li className="row between"><span className="badge conf-chip c-low">Baixa</span><span className="mono">0–49</span></li>
            </ul>
            <p className="tiny muted">Abaixo de 50 nenhum alerta público é emitido sem validação humana.</p>
          </div>
        </div>
      </section>

      <div className="tabs" role="tablist">
        {[['todas', 'Todas'], ['sensor', 'Sensores IoT'], ['publica', 'Bases públicas'], ['comunidade', 'Comunidade']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <div className="table-wrap card">
        <table className="data-table">
          <thead><tr><th>Fonte</th><th>Origem</th><th>Leitura</th><th>Atualização</th><th className="hide-md">Frequência</th><th className="hide-md">Disponib.</th><th>Confiança base</th><th aria-label="Abrir" /></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td><Link to={`/fontes/${s.id}`} className="strong-link">{s.name}</Link><div className="tiny muted mono">{s.id} · {s.neighborhood}</div></td>
                <td><SourceBadge type={s.type} /><div className="tiny muted">{s.provider}</div></td>
                <td className="mono">{fmtNum(s.reading)} <span className="muted">{s.unit}</span></td>
                <td><Freshness ts={s.lastUpdate} intervalSec={s.intervalSec} now={now} />{s.status !== 'online' && <div className={`tiny st-${s.status}`}>{s.status === 'degradado' ? 'Sensor degradado' : 'Fonte atrasada'}</div>}</td>
                <td className="hide-md mono small">{s.intervalSec ? `${s.intervalSec} s` : 'sob demanda'}</td>
                <td className="hide-md mono small">{s.uptime}%</td>
                <td className="mono">{SOURCE_TYPES[s.type].base}{s.calibrationDays > 90 ? <span className="neg"> −15</span> : ''}{s.status === 'degradado' ? <span className="neg"> −30</span> : ''}</td>
                <td><Link to={`/fontes/${s.id}`} aria-label={`Abrir ${s.name}`}><ChevronRight size={16} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card sim-card">
        <div className="card-head"><h2><Cpu size={18} aria-hidden="true" /> Simulador de ingestão</h2><span className="muted small">Envia uma leitura e mostra o processamento passo a passo</span></div>
        <div className="sim-form">
          <label className="field"><span>Fonte</span>
            <select value={simId} onChange={(e) => { setSimId(e.target.value); setVal(SIM[e.target.value].def) }}>
              {Object.keys(SIM).map((id) => <option key={id} value={id}>{state.sources.find((s) => s.id === id)?.name}</option>)}
            </select>
          </label>
          <label className="field"><span>{SIM[simId].label}</span><input type="number" value={val} onChange={(e) => setVal(e.target.value)} step="any" /></label>
          <button className="btn primary" onClick={simulate}><Play size={16} aria-hidden="true" /> Enviar leitura</button>
        </div>
        {run && (
          <ol className="pipeline live">
            {run.steps.slice(0, shown).map((p, i) => (
              <li key={i} className={p.ok ? '' : 'fail'}>
                <span className="pl-t mono">+{p.at - run.steps[0].at} ms</span>
                <div><strong>{p.name}</strong> <span className="muted small">· {p.actor}</span><p className="small">{p.detail}</p></div>
              </li>
            ))}
            {shown >= run.steps.length && <li className="pl-end"><Link to={`/alertas/${run.id}`} className="btn ghost sm">Abrir {run.id} <ChevronRight size={14} aria-hidden="true" /></Link></li>}
          </ol>
        )}
      </section>
    </div>
  )
}
