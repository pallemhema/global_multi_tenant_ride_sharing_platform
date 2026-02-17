import { useState, useEffect } from "react";
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

export default function SurgeZoneForm({ cityId, close, reload, zoneId }) {
  const [coordinates, setCoordinates] = useState([]);
  const [zoneName, setZoneName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadZone = async () => {
      if (!zoneId) return;
      setLoading(true);
      try {
        const res = await tenantAdminAPI.getZone(zoneId);
        const data = res.data;
        setZoneName(data.zone_name || "");
        if (data.coordinates) setCoordinates(data.coordinates);
      } catch (err) {
        console.error("Failed to load zone", err);
      } finally {
        setLoading(false);
      }
    };
    loadZone();
  }, [zoneId]);
  

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

    if (zoneId) {
      await tenantAdminAPI.updateSurgeZone(zoneId, {
        city_id: cityId,
        zone_name: zoneName,
        coordinates: closedPolygon,
      });
    } else {
      await tenantAdminAPI.createSurgeZone({
        city_id: cityId,
        zone_name: zoneName,
        coordinates: closedPolygon,
      });
    }

    reload();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 w-[600px] rounded space-y-4">
        <h3 className="font-semibold text-lg">{zoneId ? 'Edit Surge Zone' : 'Create Surge Zone'}</h3>

        {loading && <div className="text-sm text-slate-500">Loading zone...</div>}

        <div className="space-y-1">
  <label className="text-sm font-medium text-gray-700">
    Surge Zone Name <span className="text-red-500">*</span>
  </label>

  <input
    type="text"
    placeholder="Example: Hitech City Peak Zone"
    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={zoneName}
    onChange={(e) => setZoneName(e.target.value)}
  />

  {!zoneName && (
    <p className="text-xs text-red-500">
      Zone name is required
    </p>
  )}
</div>

        <p className="text-sm text-gray-500">
        Click on the map to draw your surge zone. Minimum 3 points required.
        </p>


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
              {zoneId ? 'Save Changes' : 'Save Zone'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
