import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { reverseGeocode } from "../../utils/reverseGeoCode";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Use a Lucide SVG as a Leaflet divIcon so the marker renders reliably.
const makeLucideIcon = (color = "#7c3aed", size = 28) => {
  const svg = renderToStaticMarkup(
    <MapPin size={size} color={color} strokeWidth={1.8} />,
  );
  return L.divIcon({
    html: svg,
    className: "lucide-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

const DEFAULT_CENTER = [17.385044, 78.486671]; // Hyderabad

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapSelector({ pickup, drop, setPickup, setDrop }) {
  const [center] = useState(DEFAULT_CENTER);

  useEffect(() => {
    // ensure we have addresses for existing coordinates
    const fillAddress = async () => {
      if (pickup && !pickup.address) {
        const a = await reverseGeocode(pickup.lat, pickup.lng);
        setPickup({ ...pickup, address: a });
      }
      if (drop && !drop.address) {
        const a = await reverseGeocode(drop.lat, drop.lng);
        setDrop({ ...drop, address: a });
      }
    };
    fillAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMapClick = async (latlng) => {
    const addr = await reverseGeocode(latlng.lat, latlng.lng);
    // if pickup not set, set pickup else set drop
    if (!pickup) {
      setPickup({ lat: latlng.lat, lng: latlng.lng, address: addr });
    } else if (!drop) {
      setDrop({ lat: latlng.lat, lng: latlng.lng, address: addr });
    } else {
      // if both set, replace drop
      setDrop({ lat: latlng.lat, lng: latlng.lng, address: addr });
    }
  };

  return (
    <div className="h-72 rounded-lg overflow-hidden">
      <MapContainer center={center} zoom={13} style={{ height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onMapClick={onMapClick} />
        {pickup && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={makeLucideIcon("#7c3aed", 32)}
          >
            <Popup>
              <div>
                <strong>Pickup</strong>
                <div>{pickup.address}</div>
              </div>
            </Popup>
          </Marker>
        )}
        {drop && (
          <Marker
            position={[drop.lat, drop.lng]}
            icon={makeLucideIcon("#059669", 32)}
          >
            <Popup>
              <div>
                <strong>Drop</strong>
                <div>{drop.address}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
