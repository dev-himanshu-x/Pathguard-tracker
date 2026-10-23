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

const icon = L.divIcon({
  className: 'pg-marker',
  html: '<span class="pg-dot"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function Controller({ pos, dest }) {
  const map = useMap()
  // Keep the map sized to its box without re-fitting (which made it jump).
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  // Show both ends of the trip once, and again only if the destination changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberately keyed on the destination only
  useEffect(() => {
    if (pos && dest)
      map.fitBounds(
        [
          [pos.lat, pos.lng],
          [dest.lat, dest.lng],
        ],
        { padding: [48, 48], animate: false },
      )
    else if (pos) map.setView([pos.lat, pos.lng], 16, { animate: false })
  }, [dest?.lat, dest?.lng])
  // Follow the traveller if they leave the visible area.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the coordinates, not the object
  useEffect(() => {
    if (pos && !map.getBounds().contains([pos.lat, pos.lng])) map.panTo([pos.lat, pos.lng])
  }, [pos?.lat, pos?.lng])
  return null
}

// Real map: your position, your trail and the destination. No simulated points.
export default function LiveMap({ pos, dest, path = [], className = 'h-72', label }) {
  const here = pos && [pos.lat, pos.lng]
  return (
    <div className="relative">
      <MapContainer
        center={here || (dest && [dest.lat, dest.lng]) || [28.6692, 77.4538]}
        zoom={15}
        className={`${className} z-0 rounded-xl`}
        scrollWheelZoom={false}
      >
        <Controller pos={pos} dest={dest} />
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {here && dest && (
          <Polyline
            positions={[here, [dest.lat, dest.lng]]}
            pathOptions={{ color: '#0F172A', weight: 3, opacity: 0.3, dashArray: '6 8' }}
          />
        )}
        {path.length > 1 && (
          <Polyline
            positions={path.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#10B981', weight: 5, lineCap: 'round' }}
          />
        )}
        {dest && (
          <CircleMarker
            center={[dest.lat, dest.lng]}
            radius={8}
            pathOptions={{ color: '#fff', weight: 2, fillOpacity: 1, fillColor: '#0F172A' }}
          />
        )}
        {here && pos.accuracy > 0 && (
          <Circle
            center={here}
            radius={Math.max(15, pos.accuracy)}
            pathOptions={{ color: '#2563EB', weight: 1, fillColor: '#2563EB', fillOpacity: 0.12 }}
          />
        )}
        {here && <Marker position={here} icon={icon} keyboard={false} />}
      </MapContainer>
      {label && (
        <span className="pointer-events-none absolute left-3 top-3 z-[400] rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur">
          {label}
        </span>
      )}
    </div>
  )
}
