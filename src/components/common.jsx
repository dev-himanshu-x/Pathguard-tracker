import L from 'leaflet'
import { useEffect } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { posAt, ROUTE } from '../data/mock'

const T = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
}
export const tone = (s) =>
  ({
    Critical: 'red',
    High: 'red',
    Medium: 'amber',
    Low: 'blue',
    'Arrived safely': 'green',
    'Alert resolved': 'blue',
    'Ended early': 'slate',
    open: 'red',
    ack: 'amber',
    resolved: 'green',
  })[s] || 'slate'
export const Badge = ({ t = 'slate', children }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${T[t]}`}
  >
    {children}
  </span>
)
export const Empty = ({ icon: I, title, text, children }) => (
  <div className="flex flex-col items-center px-6 py-10 text-center">
    <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-mint dark:bg-emerald-900/30">
      <I size={22} />
    </div>
    <p className="font-semibold">{title}</p>
    <p className="muted mt-1 max-w-xs text-sm">{text}</p>
    <div className="mt-4">{children}</div>
  </div>
)
export const DemoTag = () => (
  <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
    Demo, simulated
  </span>
)
const icon = L.divIcon({
  className: 'pg-marker',
  html: '<span class="pg-dot"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})
function Fit({ center }) {
  const m = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      m.invalidateSize()
      center
        ? m.setView(center, 16, { animate: false })
        : m.fitBounds(ROUTE, { padding: [32, 32], animate: false })
    })
    ro.observe(m.getContainer())
    return () => ro.disconnect()
  }, [m])
  useEffect(() => {
    if (center) m.setView(center, m.getZoom() < 13 ? 16 : m.getZoom())
  }, [center?.[0], center?.[1]])
  return null
}
export const MapView = ({ progress = 0, className = 'h-72', live, real }) => {
  const pos = posAt(progress),
    done = Array.from({ length: Math.floor(progress / 5) + 1 }, (_, k) =>
      posAt(Math.min(progress, k * 5)),
    ),
    center = real ? [real.lat, real.lng] : null
  return (
    <div className="relative">
      <MapContainer
        bounds={real ? undefined : ROUTE}
        center={real ? center : undefined}
        zoom={real ? 16 : undefined}
        boundsOptions={{ padding: [32, 32] }}
        className={`${className} z-0 rounded-2xl`}
        scrollWheelZoom={false}
        zoomControl={!!live}
      >
        <Fit center={center} />
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!real && (
          <Polyline
            positions={ROUTE}
            pathOptions={{ color: '#0F172A', weight: 4, opacity: 0.25, dashArray: '6 8' }}
          />
        )}
        {!real && progress > 0 && (
          <Polyline
            positions={done}
            pathOptions={{ color: '#10B981', weight: 6, lineCap: 'round' }}
          />
        )}
        {!real && (
          <CircleMarker
            center={ROUTE[0]}
            radius={6}
            pathOptions={{ color: '#0F172A', fillOpacity: 1, fillColor: '#fff' }}
          />
        )}
        {!real && (
          <CircleMarker
            center={ROUTE[ROUTE.length - 1]}
            radius={7}
            pathOptions={{ color: '#0F172A', fillOpacity: 1, fillColor: '#0F172A' }}
          />
        )}
        {real ? (
          <>
            <Circle
              center={center}
              radius={Math.max(20, real.accuracy || 30)}
              pathOptions={{ color: '#2563EB', weight: 1, fillColor: '#2563EB', fillOpacity: 0.15 }}
            />
            <Marker position={center} icon={icon} keyboard={false} />
          </>
        ) : (
          <Marker position={pos} icon={icon} keyboard={false} />
        )}
      </MapContainer>
      <span className="pointer-events-none absolute left-3 top-3 z-[400] rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/90 dark:text-slate-200">
        {real ? `Live device GPS · ±${Math.round(real.accuracy || 0)} m` : 'Simulated location'}
      </span>
    </div>
  )
}
