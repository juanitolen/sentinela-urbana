import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, X, Siren, Eye, CheckCircle2, Users, Send, Camera, Info, Cpu, ShieldCheck } from 'lucide-react'
import { useStore } from '../store/Store'
import RiskMap from '../components/RiskMap'
import { ConfidenceMeter, Empty, PriorityBadge, RiskBadge, SourceBadge, StateBadge, TypeChip, fmtAgo, fmtNum, fmtTime, STATE_ICON } from '../components/ui'
import { EVENT_TYPES, RISK_WEIGHT, channelsFor } from '../engine/rules'

const FLOW = ['Reportado', 'Em validação', 'Confirmado', 'Alerta emitido', 'Em monitoramento', 'Encerrado']

export default function AlertDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { events, now, user, transition, agentConfirm, corroborate, addUpdate, toast, state } = useStore()
  const e = events.find((x) => x.id === id)
  const [reason, setReason] = useState('')
  const [upd, setUpd] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  if (!e) return <div className="page"><Empty icon={Info} title="Evento não encontrado">Volte para a <Link to="/alertas">lista de alertas</Link>.</Empty></div>

  const reached = new Set(e.history.map((h) => h.state))
  const by = user.role === 'agente' ? 'Carlos Mendes (Defesa Civil)' : user.role === 'operador' ? 'Juliana Prado (Operadora)' : 'Ana Souza'
  const closed = ['Encerrado', 'Descartado'].includes(e.state)
  const isService = ['energia', 'agua', 'transporte'].includes(e.type)

  return (
    <div className="page">
      <button className="link-btn" onClick={() => nav(-1)}><ArrowLeft size={16} aria-hidden="true" /> Voltar</button>

      <header className="detail-head card">
        <div className="row gap8 wrap">
          <TypeChip type={e.type} /><RiskBadge level={e.risk.level} big /><PriorityBadge p={e.prio.priority} /><StateBadge state={e.state} />
          <span className="mono small muted">{e.id}</span>
        </div>
        <h1>{e.title}</h1>
        <p className="muted">{e.address} · {e.neighborhood} · raio de {fmtNum(e.radiusM)} m · {fmtNum(e.affected)} pessoas na área · aberto {fmtAgo(e.createdAt, now)}</p>
      </header>

      {/* Stepper do ciclo de vida (Diagrama de Estados) */}
      <section className="card">
        <div className="card-head"><h2>Ciclo de vida do evento</h2><span className="muted small">Conforme Diagrama de Estados</span></div>
        <ol className="stepper">
          {FLOW.map((s) => {
            const I = STATE_ICON[s]
            const cur = e.state === s
            return (
              <li key={s} className={`${reached.has(s) ? 'done' : ''} ${cur ? 'cur' : ''}`} aria-current={cur ? 'step' : undefined}>
                <span className="st-dot"><I size={14} aria-hidden="true" /></span>
                <span className="st-lbl">{s}</span>
              </li>
            )
          })}
        </ol>
        {e.state === 'Descartado' && <p className="note warn"><X size={14} aria-hidden="true" /> Evento descartado: {e.history.at(-1).note}</p>}
      </section>

      <div className="detail-grid">
        <div className="col">
          {/* Origem e confiança */}
          <section className="card prov-card">
            <div className="card-head"><h2><ShieldCheck size={18} aria-hidden="true" /> Origem e nível de confiança</h2><Link to="/fontes" className="link small">Como calculamos</Link></div>
            <div className="conf-big">
              <ConfidenceMeter score={e.confidence.score} level={e.confidence.level} />
            </div>
            <table className="factors">
              <caption className="sr-only">Composição do nível de confiança</caption>
              <tbody>
                {e.confidence.factors.map((f, i) => (
                  <tr key={i}><td>{f.label}</td><td className={`mono right ${f.kind ? '' : f.value >= 0 ? 'pos' : 'neg'}`}>{f.kind === 'base' || f.kind === 'set' ? f.value : `${f.value > 0 ? '+' : ''}${f.value}`}</td></tr>
                ))}
                <tr className="total"><td>Confiança final (0–100)</td><td className="mono right">{e.confidence.score}</td></tr>
              </tbody>
            </table>

            <h3 className="h3">Evidências ({e.evidences.length})</h3>
            <ul className="evidences">
              {e.evidences.map((ev, i) => {
                const src = state.sources.find((s) => s.id === ev.sourceId)
                return (
                  <li key={i}>
                    <div className="row gap8 wrap between">
                      <SourceBadge type={ev.sourceType} id={ev.sourceId} />
                      <span className="tiny muted">{fmtAgo(ev.at, now)} · {fmtTime(ev.at)}</span>
                    </div>
                    <div className="ev-val"><strong>{ev.value}</strong>{ev.hasPhoto && <span className="tag"><Camera size={12} aria-hidden="true" /> foto</span>}{i === 0 && <span className="tag">primária</span>}</div>
                    {ev.note && <p className="small">{ev.note}</p>}
                    <p className="tiny muted">{src?.provider}{ev.reporter ? ` · ${ev.reporter}` : ''}{src ? <> · <Link to={`/fontes/${src.id}`} className="link">ver fonte</Link></> : null}</p>
                  </li>
                )
              })}
            </ul>
          </section>

          {e.pipeline && (
            <section className="card">
              <div className="card-head"><h2><Cpu size={18} aria-hidden="true" /> Rastro de processamento</h2><span className="muted small">Fluxo do Diagrama de Sequência</span></div>
              <ol className="pipeline">
                {e.pipeline.map((p, i) => (
                  <li key={i} className={p.ok ? '' : 'fail'}>
                    <span className="pl-t mono">+{p.at - e.pipeline[0].at} ms</span>
                    <div><strong>{p.name}</strong> <span className="muted small">· {p.actor}</span><p className="small">{p.detail}</p></div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="col">
          <section className="card">
            <div className="card-head"><h2>Classificação de risco e prioridade</h2></div>
            <div className="calc">
              <div><span className="muted small">Medição</span><strong className="mono">{fmtNum(e.value)} {EVENT_TYPES[e.type].unit}</strong></div>
              <div><span className="muted small">Severidade</span><strong className="mono">{e.severity}/4</strong></div>
              <div><span className="muted small">Exposição</span><strong className="mono">{e.exposure}/3</strong></div>
              <div><span className="muted small">Matriz</span><strong className="mono">{e.risk.matrix} → {e.risk.level}</strong></div>
            </div>
            <p className="small formula mono">prioridade = 0,7 × {RISK_WEIGHT[e.risk.level]} + 0,3 × {e.confidence.score} = <strong>{e.prio.score}</strong> → {e.prio.priority}</p>
            <p className="small muted">Canais previstos: {channelsFor(e.prio.priority).join(', ') || 'nenhum (apenas registro)'} · SLA de validação humana: {e.prio.slaMin} min{e.notified ? ` · ${fmtNum(e.notified)} pessoas notificadas` : ''}</p>
          </section>

          <section className="card">
            <RiskMap events={[e]} sources={state.sources.filter((s) => e.evidences.some((x) => x.sourceId === s.id))} center={e.coords} zoom={14} height={220} selectedId={e.id} />
          </section>

          {/* Ações por perfil */}
          {!closed && (
            <section className="card actions-card">
              <div className="card-head"><h2>Ações</h2><span className="muted small">Perfil: {user.roleLabel}</span></div>
              {user.role === 'agente' && (
                <div className="actions">
                  {e.state === 'Em validação' && (
                    <>
                      <button className="btn primary" onClick={() => { agentConfirm(e.id, true); toast('Evento confirmado e alerta emitido', 'ok') }}><Check size={16} aria-hidden="true" /> Confirmar e emitir alerta</button>
                      <button className="btn ghost" onClick={() => { agentConfirm(e.id, false); toast('Evento confirmado — em monitoramento') }}><Eye size={16} aria-hidden="true" /> Confirmar sem alerta</button>
                      <div className="discard">
                        <label className="small" htmlFor="reason">Motivo do descarte</label>
                        <select id="reason" value={reason} onChange={(x) => setReason(x.target.value)}>
                          <option value="">Selecione…</option><option>Não confirmado em vistoria/câmera</option><option>Registro duplicado</option><option>Leitura de sensor com defeito</option><option>Fora da área de cobertura</option>
                        </select>
                        <button className="btn danger" disabled={!reason} onClick={() => { transition(e.id, 'Descartado', `Agente: ${reason}`, by); toast('Evento descartado') }}><X size={16} aria-hidden="true" /> Descartar</button>
                      </div>
                    </>
                  )}
                  {e.state === 'Confirmado' && <button className="btn primary" onClick={() => transition(e.id, 'Alerta emitido', 'Emissão manual', by)}><Siren size={16} aria-hidden="true" /> Emitir alerta</button>}
                  {e.state === 'Alerta emitido' && <button className="btn ghost" onClick={() => { transition(e.id, 'Em monitoramento', 'Situação sob controle; acompanhamento contínuo', by); toast('Evento em monitoramento') }}><Eye size={16} aria-hidden="true" /> Mover para monitoramento</button>}
                  {e.state === 'Em monitoramento' && (
                    <>
                      <button className="btn ghost" onClick={() => { transition(e.id, 'Alerta emitido', 'Reemissão manual por agravamento', by); toast('Alerta reemitido', 'ok') }}><Siren size={16} aria-hidden="true" /> Reemitir alerta</button>
                      <button className="btn primary" onClick={() => { transition(e.id, 'Encerrado', 'Condição normalizada', by); toast('Evento encerrado', 'ok') }}><CheckCircle2 size={16} aria-hidden="true" /> Encerrar evento</button>
                    </>
                  )}
                </div>
              )}

              {user.role === 'morador' && (
                <div className="actions">
                  <button className="btn primary" disabled={confirmed} onClick={() => { const r = corroborate(e.id); setConfirmed(true); toast(r?.state === 'Alerta emitido' ? 'Obrigado! Sua confirmação elevou a confiança e o alerta foi emitido.' : 'Obrigado! Sua confirmação foi registrada.', 'ok') }}>
                    <Users size={16} aria-hidden="true" /> {confirmed ? 'Confirmação enviada' : 'Também estou vendo isso'}
                  </button>
                  <p className="tiny muted">Sua confirmação conta como corroboração (+15 de confiança). Seu nome não é exibido.</p>
                </div>
              )}

              {user.role === 'operador' && (
                <div className="actions">
                  {isService ? (
                    <>
                      <label className="small" htmlFor="upd">Publicar atualização para a população</label>
                      <textarea id="upd" rows={2} value={upd} onChange={(x) => setUpd(x.target.value)} placeholder="Ex.: Equipe no local. Previsão de restabelecimento às 19h30." />
                      <div className="row gap8 wrap">
                        <button className="btn primary" disabled={!upd.trim()} onClick={() => { addUpdate(e.id, upd.trim(), by); setUpd(''); toast('Atualização publicada', 'ok') }}><Send size={16} aria-hidden="true" /> Publicar</button>
                        {e.state === 'Alerta emitido' && <button className="btn ghost" onClick={() => transition(e.id, 'Em monitoramento', 'Serviço em restabelecimento', by)}><Eye size={16} aria-hidden="true" /> Em restabelecimento</button>}
                        {e.state === 'Em monitoramento' && <button className="btn ghost" onClick={() => { transition(e.id, 'Encerrado', 'Serviço restabelecido', by); toast('Serviço restabelecido', 'ok') }}><CheckCircle2 size={16} aria-hidden="true" /> Serviço restabelecido</button>}
                      </div>
                    </>
                  ) : <p className="small muted">Operadores atualizam eventos de energia, água e transporte. Este evento é acompanhado pela Defesa Civil.</p>}
                </div>
              )}
            </section>
          )}

          {e.updates?.length > 0 && (
            <section className="card">
              <div className="card-head"><h2>Atualizações oficiais</h2></div>
              <ul className="updates">{e.updates.map((u, i) => <li key={i}><strong className="small">{u.by}</strong> <span className="tiny muted">{fmtAgo(u.at, now)}</span><p className="small">{u.text}</p></li>)}</ul>
            </section>
          )}

          <section className="card">
            <div className="card-head"><h2>Histórico de transições</h2></div>
            <ol className="timeline">
              {[...e.history].reverse().map((h, i) => (
                <li key={i}><StateBadge state={h.state} /><div><p className="small">{h.note}</p><p className="tiny muted">{h.by} · {fmtTime(h.at)} ({fmtAgo(h.at, now)})</p></div></li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
