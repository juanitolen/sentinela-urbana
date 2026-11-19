import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Info, Lock } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useStore } from '../store/Store'
import RiskMap from '../components/RiskMap'
import { ConfidenceMeter, Empty, Freshness, PageHeader, RiskBadge, SourceBadge, StateBadge, fmtNum } from '../components/ui'
import { SOURCE_TYPES, computeConfidence } from '../engine/rules'

const LINEAGE = ['Fonte', 'API Gateway', 'Ingestão', 'Barramento de eventos', 'Validação', 'Confiança', 'Motor de risco', 'Gestor de alertas']

export default function SourceDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, now, events } = useStore()
  const s = state.sources.find((x) => x.id === id)
  if (!s) return <div className="page"><Empty icon={Info} title="Fonte não encontrada"><Link to="/fontes">Voltar</Link></Empty></div>

  const ageMin = (now - s.lastUpdate) / 60000
  const conf = computeConfidence({ sourceType: s.type, ageMin, calibrationDays: s.calibrationDays, sensorStatus: s.status, reputation: s.type === 'comunidade' ? 0.5 : 0 })
  const related = events.filter((e) => e.evidences.some((x) => x.sourceId === s.id))
  const step = Math.max(s.intervalSec, 60)
  const chart = s.history.map((v, i) => ({ t: `-${Math.round(((s.history.length - 1 - i) * step) / 60)} min`, v }))
  const personal = s.type === 'comunidade'

  return (
    <div className="page">
      <button className="link-btn" onClick={() => nav(-1)}><ArrowLeft size={16} aria-hidden="true" /> Voltar</button>
      <PageHeader title={s.name} subtitle={`${s.provider} · ${s.neighborhood}`}>
        <SourceBadge type={s.type} id={s.id} />
      </PageHeader>

      <div className="detail-grid">
        <div className="col">
          <section className="card">
            <div className="card-head"><h2>Origem do dado</h2></div>
            <dl className="meta">
              <dt>Tipo de origem</dt><dd>{SOURCE_TYPES[s.type].label}</dd>
              <dt>Responsável</dt><dd>{s.provider}</dd>
              <dt>Protocolo</dt><dd className="mono small">{s.protocol}</dd>
              <dt>Frequência esperada</dt><dd>{s.intervalSec ? `a cada ${s.intervalSec} s` : 'sob demanda (relatos)'}</dd>
              <dt>Última atualização</dt><dd><Freshness ts={s.lastUpdate} intervalSec={s.intervalSec} now={now} /></dd>
              <dt>Situação</dt><dd className={`st-${s.status}`}>{s.status}</dd>
              <dt>Disponibilidade (30 dias)</dt><dd className="mono">{s.uptime}%</dd>
              {s.type === 'sensor' && <><dt>Última calibração</dt><dd className={s.calibrationDays > 90 ? 'neg' : ''}>há {s.calibrationDays} dias{s.calibrationDays > 90 ? ' — vencida' : ''}</dd></>}
              <dt>Dados pessoais</dt><dd>{personal ? <span><Lock size={12} aria-hidden="true" /> Sim — pseudonimizados (ID do relator, localização arredondada a 100 m)</span> : 'Não contém dados pessoais'}</dd>
            </dl>
          </section>

          <section className="card">
            <div className="card-head"><h2>Nível de confiança atual da fonte</h2></div>
            <ConfidenceMeter score={conf.score} level={conf.level} />
            <table className="factors">
              <tbody>
                {conf.factors.map((f, i) => <tr key={i}><td>{f.label}</td><td className={`mono right ${f.kind ? '' : f.value >= 0 ? 'pos' : 'neg'}`}>{f.kind ? f.value : `${f.value > 0 ? '+' : ''}${f.value}`}</td></tr>)}
              </tbody>
            </table>
            <p className="tiny muted">Corroboração e foto são somadas por evento, na tela de detalhe do alerta.</p>
          </section>

          <section className="card">
            <div className="card-head"><h2>Linhagem do dado</h2></div>
            <ol className="lineage">
              {LINEAGE.map((l, i) => <li key={l}><span>{l}</span>{i < LINEAGE.length - 1 && <ArrowRight size={12} aria-hidden="true" />}</li>)}
            </ol>
          </section>
        </div>

        <div className="col">
          <section className="card">
            <div className="card-head"><h2>Leituras recentes</h2><span className="mono">{fmtNum(s.reading)} {s.unit}</span></div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BDF8" stopOpacity={0.4} /><stop offset="100%" stopColor="#38BDF8" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="#1F2A3D" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: '#8796AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8796AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111A2B', border: '1px solid #26324A', borderRadius: 8, color: '#E6EDF7' }} formatter={(v) => [`${fmtNum(v)} ${s.unit}`, 'Leitura']} />
                  <Area type="monotone" dataKey="v" stroke="#38BDF8" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card">
            <RiskMap events={related} sources={[s]} center={s.coords} zoom={13} height={200} />
          </section>

          <section className="card">
            <div className="card-head"><h2>Eventos alimentados por esta fonte ({related.length})</h2></div>
            <ul className="plain rel-list">
              {related.map((e) => (
                <li key={e.id}><Link to={`/alertas/${e.id}`} className="rel-item"><span className="clamp1">{e.title}</span><span className="row gap8"><RiskBadge level={e.risk.level} /><StateBadge state={e.state} /></span></Link></li>
              ))}
              {related.length === 0 && <li className="muted small">Nenhum evento no momento.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
