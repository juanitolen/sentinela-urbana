import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Smartphone, MessageSquare, LayoutDashboard, Settings, Siren, Clock, Info, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store/Store'
import { Empty, PageHeader, PriorityBadge, fmtAgo } from '../components/ui'

const CH = { push: { i: Smartphone, l: 'Push' }, sms: { i: MessageSquare, l: 'SMS' }, painel: { i: LayoutDashboard, l: 'Painel' } }
const KIND = { alerta: { i: Siren, l: 'Alerta' }, tarefa: { i: Clock, l: 'Tarefa' }, sistema: { i: Info, l: 'Sistema' }, encerramento: { i: CheckCircle2, l: 'Encerramento' } }

export default function Notifications() {
  const { myNotifications, markRead, markAllRead, now, user, state } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState('todas')
  const unread = myNotifications.filter((n) => !n.read).length
  const list = myNotifications.filter((n) => tab === 'todas' || (tab === 'nao-lidas' ? !n.read : n.kind === tab))
  const tabs = [['todas', 'Todas'], ['nao-lidas', `Não lidas (${unread})`], ['alerta', 'Alertas'], ...(user.role !== 'morador' ? [['tarefa', 'Tarefas']] : []), ['sistema', 'Sistema']]

  return (
    <div className="page">
      <PageHeader title="Central de notificações" subtitle={`Alertas recebidos de acordo com suas preferências (prioridade mínima ${state.prefs.minPriority}).`}>
        <button className="btn ghost" onClick={markAllRead} disabled={!unread}><CheckCheck size={16} aria-hidden="true" /> Marcar todas como lidas</button>
        <Link to="/perfil" className="btn ghost"><Settings size={16} aria-hidden="true" /> Preferências</Link>
      </PageHeader>

      <div className="tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {list.length === 0 ? (
        <Empty icon={Bell} title="Nada por aqui">Quando houver alertas na sua região eles aparecem nesta central.</Empty>
      ) : (
        <ul className="notif-list">
          {list.map((n) => {
            const K = KIND[n.kind] ?? KIND.alerta
            const ev = state.events.find((e) => e.id === n.eventId)
            return (
              <li key={n.id} className={`notif ${n.read ? '' : 'unread'} k-${n.kind}`}>
                <span className="notif-ico"><K.i size={18} aria-hidden="true" /></span>
                <div className="grow">
                  <div className="row gap8 wrap">
                    <PriorityBadge p={n.priority} />
                    <strong>{n.title}</strong>
                    {!n.read && <span className="new-dot" aria-label="não lida" />}
                  </div>
                  <p className="small">{n.body}</p>
                  <div className="row gap12 wrap tiny muted">
                    <span>{fmtAgo(n.at, now)}</span>
                    <span className="row gap4">{n.channels.map((c) => { const C = CH[c]; return <span key={c} className="ch"><C.i size={12} aria-hidden="true" /> {C.l}</span> })}</span>
                    {ev && <span>{ev.neighborhood} · <span className="mono">{ev.id}</span></span>}
                  </div>
                </div>
                <div className="notif-act">
                  {ev && <button className="btn sm ghost" onClick={() => { markRead(n.id); nav(`/alertas/${ev.id}`) }}>{n.kind === 'tarefa' ? 'Validar' : 'Ver evento'}</button>}
                  {!n.read && <button className="link-btn tiny" onClick={() => markRead(n.id)}>Marcar como lida</button>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
