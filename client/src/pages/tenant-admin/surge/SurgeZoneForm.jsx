import { useState } from "react";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { Polygon } from "react-leaflet";


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

export default function SurgeZoneForm({ cityId, close, reload }) {
  const [coordinates, setCoordinates] = useState([]);
  const [zoneName, setZoneName] = useState("");
  

  // 🔥 This handles map clicks
  function ClickHandler() {
    useMapEvents({
      click(e) {
        const newPoint = [e.latlng.lng, e.latlng.lat]; 
        // NOTE: backend expects [lng, lat] for shapely
        setCoordinates((prev) => [...prev, newPoint]);
      },
    });
    return null;
  }

  const handleSave = async () => {
    if (coordinates.length < 3) {
      alert("Add at least 3 points");
      return;
    }

    // Close polygon automatically
    const closedPolygon = [...coordinates, coordinates[0]];

    await tenantAdminAPI.createSurgeZone({
      city_id: cityId,
      zone_name: zoneName,
      coordinates: closedPolygon,
    });

    reload();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 w-[600px] rounded space-y-4">
        <h3 className="font-semibold text-lg">Create Surge Zone</h3>

        <input
          placeholder="Zone Name"
          className="w-full border p-2 rounded"
          value={zoneName}
          onChange={(e) => setZoneName(e.target.value)}
        />

        <MapContainer
          center={[17.385, 78.4867]}
          zoom={13}
          style={{ height: "300px" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 👇 Handles clicks */}
          <ClickHandler />
        

          {/* 👇 Show all clicked markers */}
          {coordinates.map((coord, index) => (
            <Marker
              key={index}
              position={[coord[1], coord[0]]} // Leaflet uses [lat, lng]
              icon={makeLucideIcon("#7c3aed", 28)}
            />
          ))}
            {coordinates.length > 2 && (
                <Polygon
                    positions={coordinates.map((c) => [c[1], c[0]])}
                    pathOptions={{ color: "purple" }}
                />
                )}

        </MapContainer>

        <div className="flex justify-between">
          <button
            onClick={() => setCoordinates([])}
            className="text-red-500"
          >
            Clear Points
          </button>

          <div className="flex gap-2">
            <button onClick={close}>Cancel</button>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save Zone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
