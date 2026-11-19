import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { Timer, Target, Smile } from 'lucide-react'
import { useStore } from '../store/Store'
import { PageHeader } from '../components/ui'
import { EVENT_TYPES } from '../engine/rules'

const AX = { fill: '#8796AD', fontSize: 11 }
const TT = { background: '#111A2B', border: '1px solid #26324A', borderRadius: 8, color: '#E6EDF7' }

// Série histórica ilustrativa (últimas 12 h)
const HOURLY = ['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h'].map((h, i) => ({
  h, alagamento: [0, 0, 1, 0, 0, 1, 2, 3, 5, 7, 6, 4][i], calor: [0, 1, 2, 3, 4, 4, 5, 4, 3, 2, 1, 0][i], servicos: [1, 1, 0, 2, 1, 1, 2, 3, 2, 4, 3, 2][i],
}))
const LATENCY = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, i) => ({ d, p50: [21, 19, 24, 18, 22, 17, 16][i], p95: [48, 44, 58, 41, 52, 39, 37][i] }))

export default function Analytics() {
  const { events } = useStore()
  const byType = useMemo(() => Object.entries(EVENT_TYPES).map(([k, v]) => ({
    tipo: { alagamento: 'Alagamento', calor: 'Calor', energia: 'Energia', agua: 'Água', transporte: 'Transporte' }[k],
    Abertos: events.filter((e) => e.type === k && !['Encerrado', 'Descartado'].includes(e.state)).length,
    Encerrados: events.filter((e) => e.type === k && e.state === 'Encerrado').length,
    Descartados: events.filter((e) => e.type === k && e.state === 'Descartado').length,
  })), [events])
  const confDist = ['Alta', 'Média', 'Baixa'].map((l) => ({ nivel: l, eventos: events.filter((e) => e.confidence.level === l).length }))
  const validated = events.filter((e) => e.history.some((h) => ['Confirmado', 'Descartado'].includes(h.state)))
  const precision = Math.round((validated.filter((e) => e.state !== 'Descartado').length / Math.max(1, validated.length)) * 100)

  return (
    <div className="page">
      <PageHeader title="Análises" subtitle="Indicadores de sucesso da plataforma e tendências dos eventos." />

      <section className="kpis" aria-label="Indicadores de sucesso">
        <div className="kpi"><span className="kpi-ico k-blue"><Timer size={18} aria-hidden="true" /></span><div><span className="kpi-val mono">19 s</span><span className="kpi-lbl">Tempo de atualização (p50 dado → alerta) · meta ≤ 60 s</span></div></div>
        <div className="kpi"><span className="kpi-ico k-green"><Target size={18} aria-hidden="true" /></span><div><span className="kpi-val mono">{precision}%</span><span className="kpi-lbl">Qualidade dos alertas (confirmados / validados) · meta ≥ 85%</span></div></div>
        <div className="kpi"><span className="kpi-ico k-amber"><Smile size={18} aria-hidden="true" /></span><div><span className="kpi-val mono">82</span><span className="kpi-lbl">Facilidade de uso (SUS, teste com 12 usuários) · meta ≥ 75</span></div></div>
      </section>

      <div className="grid2">
        <section className="card">
          <div className="card-head"><h2>Eventos por hora (hoje)</h2></div>
          <div className="chart"><ResponsiveContainer><LineChart data={HOURLY} margin={{ left: -16, right: 8 }}>
            <CartesianGrid stroke="#1F2A3D" vertical={false} /><XAxis dataKey="h" tick={AX} axisLine={false} tickLine={false} /><YAxis tick={AX} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={TT} /><Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="alagamento" name="Alagamento" stroke="#38BDF8" strokeWidth={2} dot={false} />
            <Line dataKey="calor" name="Ilha de calor" stroke="#FB923C" strokeWidth={2} dot={false} />
            <Line dataKey="servicos" name="Serviços" stroke="#A78BFA" strokeWidth={2} dot={false} />
          </LineChart></ResponsiveContainer></div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Tempo do dado ao alerta (s)</h2><span className="muted small">Últimos 7 dias</span></div>
          <div className="chart"><ResponsiveContainer><BarChart data={LATENCY} margin={{ left: -16, right: 8 }}>
            <CartesianGrid stroke="#1F2A3D" vertical={false} /><XAxis dataKey="d" tick={AX} axisLine={false} tickLine={false} /><YAxis tick={AX} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT} cursor={{ fill: '#1B2539' }} /><Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="p50" name="Mediana" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="p95" name="Percentil 95" fill="#475A7A" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Eventos por tipo e situação</h2></div>
          <div className="chart"><ResponsiveContainer><BarChart data={byType} margin={{ left: -16, right: 8 }}>
            <CartesianGrid stroke="#1F2A3D" vertical={false} /><XAxis dataKey="tipo" tick={AX} axisLine={false} tickLine={false} /><YAxis tick={AX} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={TT} cursor={{ fill: '#1B2539' }} /><Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Abertos" stackId="a" fill="#FB923C" /><Bar dataKey="Encerrados" stackId="a" fill="#4ADE80" /><Bar dataKey="Descartados" stackId="a" fill="#64748B" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Distribuição de confiança dos eventos</h2></div>
          <div className="chart"><ResponsiveContainer><BarChart data={confDist} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid stroke="#1F2A3D" horizontal={false} /><XAxis type="number" tick={AX} axisLine={false} tickLine={false} allowDecimals={false} /><YAxis type="category" dataKey="nivel" tick={AX} axisLine={false} tickLine={false} width={50} />
            <Tooltip contentStyle={TT} cursor={{ fill: '#1B2539' }} />
            <Bar dataKey="eventos" name="Eventos" fill="#38BDF8" radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer></div>
        </section>
      </div>
    </div>
  )
}
