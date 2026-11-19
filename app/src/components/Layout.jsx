import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, TriangleAlert, Bell, MessageSquarePlus, Database, ChartColumn, Settings, LogOut, RefreshCw } from 'lucide-react'
import { useStore } from '../store/Store'
import { PERSONAS } from '../data/seed'

const NAV = [
  { to: '/painel', label: 'Painel', icon: LayoutDashboard },
  { to: '/alertas', label: 'Alertas', icon: TriangleAlert },
  { to: '/notificacoes', label: 'Notificações', icon: Bell, badge: true },
  { to: '/reportar', label: 'Reportar', icon: MessageSquarePlus },
  { to: '/fontes', label: 'Fontes e confiança', icon: Database },
  { to: '/analises', label: 'Análises', icon: ChartColumn, roles: ['agente', 'operador'] },
  { to: '/perfil', label: 'Preferências e LGPD', icon: Settings },
]

export default function Layout() {
  const { user, myNotifications, logout, setRole, toasts, resetDemo, toast } = useStore()
  const nav = useNavigate()
  const unread = myNotifications.filter((n) => !n.read).length
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role))
  const mobileItems = items.filter((n) => ['/painel', '/alertas', '/reportar', '/notificacoes', '/fontes'].includes(n.to))

  return (
    <div className="shell">
      <a href="#main" className="skip">Pular para o conteúdo</a>
      <aside className="sidebar">
        <div className="brand">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="#38BDF8" strokeWidth="2" opacity=".45" /><circle cx="16" cy="16" r="6" fill="none" stroke="#38BDF8" strokeWidth="2" /><circle cx="16" cy="16" r="2.4" fill="#F59E0B" /></svg>
          <div>
            <strong>Sentinela Urbana</strong>
            <span>Inteligência de riscos urbanos</span>
          </div>
        </div>
        <nav aria-label="Navegação principal">
          {items.map(({ to, label, icon: I, badge }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <I size={18} aria-hidden="true" />
              <span>{label}</span>
              {badge && unread > 0 && <span className="nav-badge" aria-label={`${unread} não lidas`}>{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <label className="role-switch">
            <span className="muted small">Perfil de demonstração</span>
            <select value={user.role} onChange={(e) => { setRole(e.target.value); toast(`Perfil alterado para ${PERSONAS[e.target.value].roleLabel}`) }}>
              {Object.values(PERSONAS).map((p) => <option key={p.role} value={p.role}>{p.roleLabel}</option>)}
            </select>
          </label>
          <div className="me">
            <span className="avatar" aria-hidden="true">{user.initials}</span>
            <div><strong>{user.name}</strong><span className="muted small">{user.roleLabel}</span></div>
            <button className="icon-btn" onClick={() => { logout(); nav('/') }} aria-label="Sair"><LogOut size={16} /></button>
          </div>
          <button className="link-btn small" onClick={() => { resetDemo(); toast('Dados de demonstração restaurados') }}><RefreshCw size={12} aria-hidden="true" /> Restaurar demonstração</button>
        </div>
      </aside>

      <header className="mobile-top">
        <div className="brand compact"><svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="#38BDF8" strokeWidth="2" opacity=".45" /><circle cx="16" cy="16" r="6" fill="none" stroke="#38BDF8" strokeWidth="2" /><circle cx="16" cy="16" r="2.4" fill="#F59E0B" /></svg><strong>Sentinela Urbana</strong></div>
        <div className="row gap8">
          <NavLink to="/perfil" className="icon-btn" aria-label="Preferências e LGPD"><Settings size={18} /></NavLink>
          <span className="avatar sm" aria-hidden="true">{user.initials}</span>
        </div>
      </header>

      <main id="main" className="main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegação inferior">
        {mobileItems.map(({ to, label, icon: I, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `bn-item ${isActive ? 'active' : ''}`}>
            <span className="bn-ico"><I size={20} aria-hidden="true" />{badge && unread > 0 && <span className="nav-badge dot">{unread}</span>}</span>
            <span>{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>

      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast ${t.tone}`}>{t.msg}</div>)}
      </div>
    </div>
  )
}
