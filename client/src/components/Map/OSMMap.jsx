// src/components/Map/OSMMap.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HYDERABAD = { lat: 17.385044, lng: 78.486671 };

// Fix default icon paths for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => setPosition(e.target.getLatLng()),
      }}
    />
  ) : null;
}

export default function OSMMap({ initialPosition = HYDERABAD, onChange }) {
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    onChange?.(position);
  }, [position]);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
