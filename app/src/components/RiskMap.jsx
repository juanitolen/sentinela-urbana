import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, useMap, useMapEvents, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { EVENT_TYPES } from '../engine/rules'

const RISK_COLOR = { Baixo: '#4ADE80', Moderado: '#FACC15', Alto: '#FB923C', Crítico: '#F87171' }
const SRC_COLOR = { sensor: '#38BDF8', publica: '#A78BFA', comunidade: '#F472B6' }

const pinIcon = L.divIcon({ className: 'pin-icon', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 22] })

function FlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.6 }) }, [center?.[0], center?.[1]]) // eslint-disable-line
  return null
}
function Picker({ onPick }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) })
  return null
}

export default function RiskMap({ events = [], sources = [], showSources = true, onSelect, selectedId, center = [-23.556, -46.63], zoom = 11, height = 420, pick, onPick, home }) {
  return (
    <div className="map-wrap" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }} attributionControl>
        <TileLayer
          attribution='Tiles &copy; Esri — Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" maxZoom={16} />
        {home && <Circle center={home} radius={3000} pathOptions={{ color: '#38BDF8', weight: 1, dashArray: '4 6', fillOpacity: 0.03 }} />}
        {events.map((e) => (
          <Circle key={`r-${e.id}`} center={e.coords} radius={e.radiusM} pathOptions={{ color: RISK_COLOR[e.risk.level], weight: 1, fillOpacity: e.state === 'Encerrado' ? 0.04 : 0.14 }} />
        ))}
        {events.map((e) => (
          <CircleMarker
            key={e.id}
            center={e.coords}
            radius={selectedId === e.id ? 11 : 8}
            pathOptions={{ color: '#0B1220', weight: 2, fillColor: RISK_COLOR[e.risk.level], fillOpacity: 1, dashArray: e.state === 'Em validação' ? '3 3' : undefined }}
            eventHandlers={{ click: () => onSelect?.(e.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{EVENT_TYPES[e.type].label}</strong> · {e.neighborhood}<br />
              Risco {e.risk.level} · Confiança {e.confidence.score} ({e.confidence.level})<br />
              {e.state}
            </Tooltip>
          </CircleMarker>
        ))}
        {showSources && sources.filter((s) => s.type !== 'comunidade').map((s) => (
          <CircleMarker key={s.id} center={s.coords} radius={4} pathOptions={{ color: SRC_COLOR[s.type], weight: 2, fillColor: '#0B1220', fillOpacity: 1 }}>
            <Tooltip direction="top">{s.name}<br /><span className="mono">{s.id}</span> · {s.status}</Tooltip>
          </CircleMarker>
        ))}
        {pick && <Picker onPick={onPick} />}
        {pick && <Marker position={pick} icon={pinIcon} />}
        <FlyTo center={pick || (selectedId && events.find((e) => e.id === selectedId)?.coords)} />
      </MapContainer>
    </div>
  )
}

export { RISK_COLOR, SRC_COLOR }
