import React, { useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import Loader from "../common/Loader";

// ===============================
// Custom Marker Generator
// ===============================
const createMarkerIcon = (color, label) => {
  const svg = renderToStaticMarkup(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        borderRadius: "50%",
        border: `3px solid ${color}`,
        width: "40px",
        height: "40px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        fontSize: "12px",
        fontWeight: "bold",
      }}
    >
      {label}
    </div>
  );

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// ===============================
// Map Bounds Controller
// ===============================
function MapController({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length === 0) return;

    const valid = positions.filter(
      (p) =>
        p &&
        typeof p[0] === "number" &&
        typeof p[1] === "number" &&
        !isNaN(p[0]) &&
        !isNaN(p[1])
    );

    if (valid.length === 0) return;

    const bounds = L.latLngBounds(valid);
    map.fitBounds(bounds, { padding: [80, 80] });

  }, [positions, map]);

  return null;
}

// ===============================
// Main Component
// ===============================
export default function TripRouteMap({
  driverLocation,
  pickupLocation,
  dropLocation,
  driverToPickupRoute = [],
  pickupToDropRoute = [],
  loading = false,
  height = "h-96",
}) {
  const center = useMemo(() => {
    if (driverLocation) return driverLocation;
    if (pickupLocation) return pickupLocation;
    return [17.385044, 78.486671];
  }, [driverLocation, pickupLocation]);

  const allPositions = useMemo(() => {
    return [
      driverLocation,
      pickupLocation,
      dropLocation,
      ...driverToPickupRoute,
      ...pickupToDropRoute,
    ].filter(Boolean);
  }, [
    driverLocation,
    pickupLocation,
    dropLocation,
    driverToPickupRoute,
    pickupToDropRoute,
  ]);

  if (loading) {
    return (
      <div className={`${height} flex items-center justify-center`}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={`${height} rounded-lg overflow-hidden border shadow-sm`}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />

        <MapController positions={allPositions} />

        {/* Driver → Pickup Route (Red) */}
        {driverToPickupRoute.length > 0 && (
          <Polyline
            positions={driverToPickupRoute}
            pathOptions={{ color: "#DC143C", weight: 5, opacity: 0.9 }}
          />
        )}

        {/* Pickup → Drop Route (Blue) */}
        {pickupToDropRoute.length > 0 && (
          <Polyline
            positions={pickupToDropRoute}
            pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.9 }}
          />
        )}

        {driverLocation && (
          <Marker
            position={driverLocation}
            icon={createMarkerIcon("#0004E0", "DR")}
          />
        )}

        {pickupLocation && (
          <Marker
            position={pickupLocation}
            icon={createMarkerIcon("#7c3aed", "P")}
          />
        )}

        {dropLocation && (
          <Marker
            position={dropLocation}
            icon={createMarkerIcon("#10b981", "D")}
          />
        )}
      </MapContainer>
    </div>
  );
}