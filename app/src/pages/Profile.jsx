import { useState } from 'react'
import { Download, Trash2, ShieldCheck, Bell, History } from 'lucide-react'
import { useStore } from '../store/Store'
import { PageHeader, TypeIcon, fmtAgo } from '../components/ui'
import { EVENT_TYPES } from '../engine/rules'

function Toggle({ checked, onChange, label, desc, id }) {
  return (
    <div className="toggle-row">
      <div><label htmlFor={id} className="strong">{label}</label>{desc && <p className="tiny muted">{desc}</p>}</div>
      <button id={id} role="switch" aria-checked={checked} className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><span /></button>
    </div>
  )
}

export default function Profile() {
  const { state, setPrefs, setConsents, user, now, deleteMyData, toast, logAudit } = useStore()
  const { prefs, consents } = state
  const [confirmDel, setConfirmDel] = useState(false)

  function exportData() {
    const data = {
      titular: { nome: user.name, perfil: user.roleLabel, bairro: user.bairro },
      preferencias: prefs, consentimentos: consents, ocorrencias_registradas: state.myReports,
      gerado_em: new Date().toISOString(), base_legal: 'LGPD Art. 18, II e V (acesso e portabilidade)',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'meus-dados-sentinela.json'; a.click()
    logAudit('Exportação de dados pessoais (portabilidade)')
    toast('Arquivo com seus dados gerado', 'ok')
  }

  return (
    <div className="page">
      <PageHeader title="Preferências e privacidade" subtitle="Escolha o que você quer receber e controle seus dados pessoais." />
      <div className="grid2">
        <section className="card">
          <div className="card-head"><h2><Bell size={18} aria-hidden="true" /> Notificações</h2></div>
          <h3 className="h3">Tipos de risco</h3>
          {Object.entries(EVENT_TYPES).map(([k, v]) => (
            <Toggle key={k} id={`t-${k}`} label={<span className="row gap8"><TypeIcon type={k} /> {v.label}</span>} checked={prefs.types[k]} onChange={(val) => setPrefs({ types: { ...prefs.types, [k]: val } })} />
          ))}
          <h3 className="h3">Prioridade mínima</h3>
          <div className="seg wide" role="radiogroup" aria-label="Prioridade mínima">
            {[['P1', 'Só críticos'], ['P2', 'P1–P2'], ['P3', 'P1–P3'], ['P4', 'Tudo']].map(([p, l]) => (
              <button key={p} role="radio" aria-checked={prefs.minPriority === p} className={prefs.minPriority === p ? 'on' : ''} onClick={() => setPrefs({ minPriority: p })}>{l}</button>
            ))}
          </div>
          <p className="tiny muted">P1 sempre chega por push e SMS, mesmo fora destas preferências (alerta de vida).</p>
          <h3 className="h3">Canais</h3>
          <Toggle id="c-push" label="Notificação push" checked={prefs.channels.push} onChange={(v) => setPrefs({ channels: { ...prefs.channels, push: v } })} />
          <Toggle id="c-sms" label="SMS" desc="Usado em alertas P1 e para quem não tem internet" checked={prefs.channels.sms} onChange={(v) => setPrefs({ channels: { ...prefs.channels, sms: v } })} />
          <Toggle id="c-mail" label="E-mail (resumo diário)" checked={prefs.channels.email} onChange={(v) => setPrefs({ channels: { ...prefs.channels, email: v } })} />
          <label className="field"><span>Raio de interesse: <strong className="mono">{prefs.radiusKm} km</strong></span>
            <input type="range" min={1} max={10} value={prefs.radiusKm} onChange={(e) => setPrefs({ radiusKm: Number(e.target.value) })} />
          </label>
        </section>

        <section className="card">
          <div className="card-head"><h2><ShieldCheck size={18} aria-hidden="true" /> Privacidade (LGPD)</h2></div>
          <Toggle id="k-loc" label="Localização aproximada" desc="Precisão de 100 m. Usada para alertas da sua região. Base legal: consentimento." checked={consents.localizacao} onChange={(v) => setConsents({ localizacao: v })} />
          <Toggle id="k-not" label="Receber alertas" desc="Base legal: proteção da vida e da incolumidade física (Art. 7º, VII)." checked={consents.notificacoes} onChange={(v) => setConsents({ notificacoes: v })} />
          <Toggle id="k-ana" label="Uso anonimizado para estatísticas" desc="Dados agregados, sem identificação, para planejamento urbano." checked={consents.analiseAnonima} onChange={(v) => setConsents({ analiseAnonima: v })} />
          <Toggle id="k-par" label="Compartilhar com parceiros" desc="Concessionárias recebem apenas a contagem de afetados, nunca seus dados." checked={consents.compartilhamentoParceiros} onChange={(v) => setConsents({ compartilhamentoParceiros: v })} />

          <h3 className="h3">Seus direitos</h3>
          <div className="row gap8 wrap">
            <button className="btn ghost" onClick={exportData}><Download size={16} aria-hidden="true" /> Exportar meus dados</button>
            {!confirmDel ? (
              <button className="btn danger-ghost" onClick={() => setConfirmDel(true)}><Trash2 size={16} aria-hidden="true" /> Excluir meus dados</button>
            ) : (
              <div className="confirm-del" role="alertdialog" aria-label="Confirmar exclusão">
                <p className="small">Isso apaga suas preferências e o vínculo com suas ocorrências (os relatos continuam, anonimizados). Confirmar?</p>
                <div className="row gap8"><button className="btn danger" onClick={() => { deleteMyData(); setConfirmDel(false); toast('Dados pessoais eliminados', 'ok') }}>Sim, excluir</button><button className="btn ghost" onClick={() => setConfirmDel(false)}>Cancelar</button></div>
              </div>
            )}
          </div>
          <p className="tiny muted">Encarregado de dados (DPO): dpo@sentinela.exemplo · Retenção: relatos 12 meses; logs de acesso 6 meses.</p>
        </section>

        <section className="card span2">
          <div className="card-head"><h2><History size={18} aria-hidden="true" /> Registro de acesso e tratamento</h2><span className="muted small">Trilha de auditoria (LGPD Art. 37)</span></div>
          <ul className="audit">
            {state.audit.slice(0, 8).map((a, i) => <li key={i}><span className="tiny muted mono">{fmtAgo(a.at, now)}</span><span className="small"><strong>{a.who}</strong> — {a.what}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
