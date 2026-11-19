import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Check, ChevronLeft, ChevronRight, LocateFixed, ShieldCheck, CircleCheck, ImagePlus, X } from 'lucide-react'
import { useStore } from '../store/Store'
import RiskMap from '../components/RiskMap'
import { ConfidenceMeter, PageHeader, StateBadge, TypeIcon } from '../components/ui'
import { EVENT_TYPES, computeConfidence } from '../engine/rules'

const LEVELS = {
  alagamento: [['Até o tornozelo', 10], ['Até a canela', 25], ['Até o joelho', 45], ['Acima do joelho', 60]],
  calor: [['Quente', 32], ['Muito quente', 35], ['Calor extremo', 38]],
  energia: [['Só minha casa', 5], ['Minha rua', 300], ['Vários quarteirões', 3000], ['Bairro inteiro', 15000]],
  agua: [['Só minha casa', 5], ['Minha rua', 300], ['Vários quarteirões', 3000], ['Bairro inteiro', 15000]],
  transporte: [['Atraso até 20 min', 20], ['Atraso até 1 h', 45], ['Linha parada', 90]],
}
const STEPS = ['Tipo', 'Local', 'Detalhes', 'Revisão']

export default function Report() {
  const { ingest, user, addMyReport, toast } = useStore()
  const [step, setStep] = useState(0)
  const [type, setType] = useState(null)
  const [pick, setPick] = useState(null)
  const [address, setAddress] = useState('')
  const [level, setLevel] = useState(null)
  const [desc, setDesc] = useState('')
  const [photo, setPhoto] = useState(false)
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState({})

  const preview = useMemo(() => computeConfidence({ sourceType: 'comunidade', reputation: 0.7, hasPhoto: photo }), [photo])

  function next() {
    const err = {}
    if (step === 0 && !type) err.type = 'Escolha o tipo de ocorrência.'
    if (step === 1 && !pick) err.pick = 'Toque no mapa ou use sua localização.'
    if (step === 2 && level == null) err.level = 'Indique a intensidade.'
    if (step === 2 && desc.length > 280) err.desc = 'Máximo de 280 caracteres.'
    setErrors(err)
    if (Object.keys(err).length === 0) setStep((s) => s + 1)
  }

  function submit() {
    const [label, value] = LEVELS[type][level]
    const r = ingest({
      sourceId: 'COM-APP', type, value, coords: pick, neighborhood: user.bairro, address: address || 'Local marcado no mapa',
      title: `${EVENT_TYPES[type].label} relatado por morador — ${label.toLowerCase()}`, note: desc || label,
      hasPhoto: photo, reporter: 'Ana Souza (pseudonimizado #A51D, reputação 0,7)', reputation: 0.7,
      valueLabel: `${label}${photo ? ' + foto' : ''}`, exposure: 2, radiusM: 400, affected: type === 'energia' || type === 'agua' ? value : 1800,
    })
    addMyReport(r.id)
    setResult(r)
    toast('Ocorrência registrada', 'ok')
  }

  function reset() { setStep(0); setType(null); setPick(null); setAddress(''); setLevel(null); setDesc(''); setPhoto(false); setResult(null) }

  if (result) {
    return (
      <div className="page narrow">
        <section className="card success">
          <CircleCheck size={40} className="ok-ico" aria-hidden="true" />
          <h1>Ocorrência registrada</h1>
          <p className="muted">Protocolo <strong className="mono">{result.id}</strong>{result.merged ? ' (agregado a um evento já existente na região)' : ''}</p>
          <div className="row gap12 wrap center-x">
            <StateBadge state={result.state} />
            {result.derived && <ConfidenceMeter score={result.derived.confidence.score} level={result.derived.confidence.level} />}
          </div>
          <p className="small">
            {result.merged && result.state === 'Alerta emitido'
              ? 'Seu relato confirmou um evento já monitorado. Com a corroboração, o alerta foi emitido para os moradores da região.'
              : result.merged
                ? 'Seu relato foi somado a um evento já existente na região e aumentou a confiança dele.'
                : result.state === 'Alerta emitido'
                  ? 'O alerta foi emitido para os moradores da região.'
              : result.state === 'Em validação'
                ? 'Relatos isolados da comunidade não disparam alertas sozinhos. Um agente da Defesa Civil vai validar — ou o evento é confirmado automaticamente se um sensor ou outro morador corroborar.'
                : 'Seu relato foi processado.'}
          </p>
          <div className="row gap8 wrap center-x">
            <Link className="btn primary" to={`/alertas/${result.id}`}>Acompanhar ocorrência</Link>
            <button className="btn ghost" onClick={reset}>Registrar outra</button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <PageHeader title="Registrar ocorrência" subtitle="Ajude a comunidade: seu relato é cruzado com sensores e bases públicas." />

      <ol className="wizard" aria-label="Etapas">
        {STEPS.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'cur' : ''} aria-current={i === step ? 'step' : undefined}><span>{i < step ? <Check size={12} aria-hidden="true" /> : i + 1}</span>{s}</li>)}
      </ol>

      <section className="card">
        {step === 0 && (
          <fieldset>
            <legend className="h3">O que está acontecendo?</legend>
            <div className="type-grid">
              {Object.entries(EVENT_TYPES).map(([k, v]) => (
                <button key={k} type="button" className={`type-card t-${k} ${type === k ? 'sel' : ''}`} onClick={() => { setType(k); setLevel(null) }} aria-pressed={type === k}>
                  <TypeIcon type={k} size={26} /><span>{v.label}</span>
                </button>
              ))}
            </div>
            {errors.type && <p className="err" role="alert">{errors.type}</p>}
          </fieldset>
        )}

        {step === 1 && (
          <div>
            <h2 className="h3">Onde?</h2>
            <p className="small muted">Toque no mapa para marcar o local. A posição é arredondada para 100 m antes de ser armazenada (LGPD).</p>
            <button type="button" className="btn ghost sm" onClick={() => { setPick(user.home); setAddress('Perto da minha localização atual') }}><LocateFixed size={14} aria-hidden="true" /> Usar minha localização</button>
            <div style={{ marginTop: 12 }}>
              <RiskMap events={[]} sources={[]} showSources={false} pick={pick} onPick={(p) => setPick([Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000])} center={user.home} zoom={14} height={300} />
            </div>
            <label className="field"><span>Referência (opcional)</span><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex.: R. Taquari, em frente ao nº 600" /></label>
            {pick && <p className="tiny muted mono">Lat {pick[0].toFixed(3)} · Lon {pick[1].toFixed(3)}</p>}
            {errors.pick && <p className="err" role="alert">{errors.pick}</p>}
          </div>
        )}

        {step === 2 && (
          <div>
            <fieldset>
              <legend className="h3">Qual a intensidade?</legend>
              <div className="level-grid">
                {LEVELS[type].map(([l], i) => (
                  <label key={l} className={`level ${level === i ? 'sel' : ''}`}><input type="radio" name="lvl" checked={level === i} onChange={() => setLevel(i)} /> {l}</label>
                ))}
              </div>
              {errors.level && <p className="err" role="alert">{errors.level}</p>}
            </fieldset>
            <label className="field"><span>Descrição (opcional)</span>
              <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} placeholder="O que você está vendo?" aria-describedby="desc-help" />
              <span id="desc-help" className="tiny muted">{desc.length}/280 · não inclua nomes, placas ou telefones</span>
            </label>
            {errors.desc && <p className="err" role="alert">{errors.desc}</p>}
            <div className="photo-row">
              {photo ? (
                <div className="photo-thumb"><Camera size={18} aria-hidden="true" /> foto_ocorrencia.jpg <button type="button" className="icon-btn" onClick={() => setPhoto(false)} aria-label="Remover foto"><X size={14} /></button></div>
              ) : (
                <button type="button" className="btn ghost sm" onClick={() => setPhoto(true)}><ImagePlus size={14} aria-hidden="true" /> Anexar foto (+10 de confiança)</button>
              )}
              <p className="tiny muted">Rostos e placas são borrados automaticamente; metadados EXIF são removidos.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="h3">Revise antes de enviar</h2>
            <dl className="review">
              <dt>Tipo</dt><dd>{EVENT_TYPES[type].label}</dd>
              <dt>Local</dt><dd>{address || 'Local marcado no mapa'} <span className="mono tiny muted">({pick[0].toFixed(3)}, {pick[1].toFixed(3)})</span></dd>
              <dt>Intensidade</dt><dd>{LEVELS[type][level][0]}</dd>
              <dt>Descrição</dt><dd>{desc || '—'}</dd>
              <dt>Foto</dt><dd>{photo ? 'Sim' : 'Não'}</dd>
            </dl>
            <div className="conf-preview">
              <span className="small">Confiança inicial estimada do seu relato</span>
              <ConfidenceMeter score={preview.score} level={preview.level} />
              <p className="tiny muted">{preview.factors.map((f) => `${f.label}: ${f.kind === 'base' ? f.value : '+' + f.value}`).join(' · ')}. Sobe quando sensores ou outros moradores confirmam.</p>
            </div>
            <div className="consent-box">
              <div className="row gap8"><ShieldCheck size={16} aria-hidden="true" /><strong className="small">Como usamos este relato</strong></div>
              <p className="tiny">Seu nome não aparece para outros usuários. Guardamos um identificador pseudônimo, a localização arredondada e o horário por 12 meses, para fins de prevenção de riscos (LGPD Art. 7º, III e IX). Você pode pedir a exclusão em Preferências e LGPD.</p>
            </div>
          </div>
        )}

        <div className="wizard-nav">
          {step > 0 ? <button className="btn ghost" onClick={() => setStep((s) => s - 1)}><ChevronLeft size={16} aria-hidden="true" /> Voltar</button> : <span />}
          {step < 3 ? <button className="btn primary" onClick={next}>Continuar <ChevronRight size={16} aria-hidden="true" /></button> : <button className="btn primary" onClick={submit}><Check size={16} aria-hidden="true" /> Enviar ocorrência</button>}
        </div>
      </section>
    </div>
  )
}
