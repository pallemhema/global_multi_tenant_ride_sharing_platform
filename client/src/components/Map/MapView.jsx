import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ensure icons load in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

function MapController({ focusPosition, zoom = 13 }) {
  const map = useMap();

  useEffect(() => {
    if (!focusPosition) return;
    const { lat, lng } = focusPosition;
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], Math.max(12, zoom), { animate: true });
  }, [focusPosition, map, zoom]);

  return null;
}

export default function MapView({
  pickup,
  dropoff,
  driverPosition,
  focusPosition,
  className = 'h-64 w-full rounded-lg overflow-hidden border border-gray-200',
  zoom = 13,
}) {
  // choose initial center
  const center = pickup ? [pickup.lat, pickup.lng] : (dropoff ? [dropoff.lat, dropoff.lng] : [6.5244, 3.3792]);

  return (
    <div className={className}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController focusPosition={focusPosition} zoom={zoom} />

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]}>
            <Popup>Pickup</Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]}>
            <Popup>Dropoff</Popup>
          </Marker>
        )}

        {driverPosition && driverPosition.lat != null && driverPosition.lng != null && (
          <CircleMarker center={[driverPosition.lat, driverPosition.lng]} radius={8} pathOptions={{ color: '#2563EB', fillColor: '#2563EB' }}>
            <Popup>Driver</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
