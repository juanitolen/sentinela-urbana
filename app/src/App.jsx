import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from './store/Store'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import AlertDetail from './pages/AlertDetail'
import Notifications from './pages/Notifications'
import Report from './pages/Report'
import Sources from './pages/Sources'
import SourceDetail from './pages/SourceDetail'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'

function Guard({ children }) {
  const { user } = useStore()
  return user ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  const { user } = useStore()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/painel" replace /> : <Login />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route path="/painel" element={<Dashboard />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/alertas/:id" element={<AlertDetail />} />
        <Route path="/notificacoes" element={<Notifications />} />
        <Route path="/reportar" element={<Report />} />
        <Route path="/fontes" element={<Sources />} />
        <Route path="/fontes/:id" element={<SourceDetail />} />
        <Route path="/analises" element={<Analytics />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  )
}
