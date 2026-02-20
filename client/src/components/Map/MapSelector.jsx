import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { reverseGeocode } from "../../utils/reverseGeoCode";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import Loader from "../common/Loader";

const makeLucideIcon = (color = "#7c3aed", size = 28) => {
  const svg = renderToStaticMarkup(
    <MapPin size={size} color={color} strokeWidth={1.8} />
  );
  return L.divIcon({
    html: svg,
    className: "lucide-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;
    map.flyTo([position.lat, position.lng], 15);
  }, [position, map]);

  return null;
}

export default function MapSelector({
  pickup,
  drop,
  setPickup,
  setDrop,
  activeField,
}) {
  if (!pickup) {
    return (
      <div className="h-72 flex items-center justify-center bg-slate-100 rounded-lg">
        <Loader/>
      </div>
    );
  }

  const center = [pickup.lat, pickup.lng];

  const onMapClick = async (latlng) => {
    const result = await reverseGeocode(latlng.lat, latlng.lng);

    if (activeField === "pickup") {
      setPickup({
        lat: result.lat,
        lng: result.lng,
        address: result.fullAddress,
        city: result.city,
      });
    } else {
      setDrop({
        lat: result.lat,
        lng: result.lng,
        address: result.fullAddress,
        city: result.city,
      });
    }
  };

  return (
    <div className="h-72 rounded-lg overflow-hidden">
      <MapContainer center={center} zoom={15} style={{ height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapController position={pickup} />
        <ClickHandler onMapClick={onMapClick} />

        {pickup && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={makeLucideIcon("#7c3aed", 32)}
          >
            <Popup>
              <strong>Pickup</strong>
              <div>{pickup.address}</div>
            </Popup>
          </Marker>
        )}

        {drop && (
          <Marker
            position={[drop.lat, drop.lng]}
            icon={makeLucideIcon("#059669", 32)}
          >
            <Popup>
              <strong>Drop</strong>
              <div>{drop.address}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
