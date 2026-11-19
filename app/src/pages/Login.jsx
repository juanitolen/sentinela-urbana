import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { House, HardHat, Building2, ShieldCheck, ChevronRight, Lock } from 'lucide-react'
import { useStore } from '../store/Store'
import { PERSONAS } from '../data/seed'

const ICONS = { morador: House, agente: HardHat, operador: Building2 }
const DESC = {
  morador: 'Recebe alertas da sua região, acompanha o mapa e registra ocorrências do bairro.',
  agente: 'Valida registros, confirma ou descarta eventos e decide a emissão de alertas.',
  operador: 'Acompanha interrupções do seu serviço e publica atualizações de restabelecimento.',
}

export default function Login() {
  const { setRole, setConsents } = useStore()
  const nav = useNavigate()
  const [role, setR] = useState('morador')
  const [ok, setOk] = useState(true)
  const [loc, setLoc] = useState(true)

  function enter(e) {
    e.preventDefault()
    if (!ok) return
    setConsents({ localizacao: loc, notificacoes: true })
    setRole(role)
    nav('/painel')
  }

  return (
    <div className="login">
      <section className="login-hero">
        <div className="brand big">
          <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="#38BDF8" strokeWidth="2" opacity=".45" /><circle cx="16" cy="16" r="6" fill="none" stroke="#38BDF8" strokeWidth="2" /><circle cx="16" cy="16" r="2.4" fill="#F59E0B" /></svg>
          <div><strong>Sentinela Urbana</strong><span>Urban Risk Intelligence Platform</span></div>
        </div>
        <h1>Alagamentos, calor extremo e falta de serviços, no mapa e no seu celular.</h1>
        <p className="lead">Sensores, bases públicas e relatos da comunidade são cruzados para gerar alertas priorizados. Cada dado mostra de onde veio e quanto confiar nele.</p>
        <ul className="hero-stats">
          <li><strong className="mono">11</strong><span>fontes integradas</span></li>
          <li><strong className="mono">&lt; 60 s</strong><span>do dado ao alerta</span></li>
          <li><strong className="mono">99,5%</strong><span>disponibilidade-alvo</span></li>
        </ul>
      </section>

      <form className="login-card" onSubmit={enter}>
        <h2>Entrar</h2>
        <p className="muted small">Protótipo: escolha um perfil de demonstração.</p>
        <fieldset className="persona-list">
          <legend className="sr-only">Perfil</legend>
          {Object.values(PERSONAS).map((p) => {
            const I = ICONS[p.role]
            return (
              <label key={p.role} className={`persona ${role === p.role ? 'sel' : ''}`}>
                <input type="radio" name="role" value={p.role} checked={role === p.role} onChange={() => setR(p.role)} />
                <span className="persona-ico"><I size={20} aria-hidden="true" /></span>
                <span>
                  <strong>{p.name}</strong> <span className="muted small">· {p.roleLabel}</span>
                  <span className="small muted block">{DESC[p.role]}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <div className="consent-box">
          <div className="row gap8"><ShieldCheck size={16} aria-hidden="true" /><strong className="small">Privacidade (LGPD)</strong></div>
          <label className="check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> <span>Li e aceito a <u>Política de Privacidade</u>. Meus dados são usados só para alertas de risco (Art. 7º, LGPD).</span></label>
          <label className="check"><input type="checkbox" checked={loc} onChange={(e) => setLoc(e.target.checked)} /> <span>Usar minha localização aproximada (precisão de 100 m) para alertas da minha região. <span className="muted">Opcional</span></span></label>
        </div>

        <button className="btn primary block" disabled={!ok}>
          Entrar como {PERSONAS[role].name.split(' ')[0]} <ChevronRight size={16} aria-hidden="true" />
        </button>
        <p className="tiny muted center"><Lock size={11} aria-hidden="true" /> Conexão criptografada · autenticação gov.br prevista na versão final</p>
      </form>
    </div>
  )
}
