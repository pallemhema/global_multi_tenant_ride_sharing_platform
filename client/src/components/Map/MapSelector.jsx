import React, { useEffect, useState, useRef } from "react";
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
import { MapPin, Car, Bike, Truck } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import Loader from "../common/Loader";
import DriverPopup from "../Trip/DriverPopup";
import * as tripApi from "../../services/tripApi";
import { reverseGeocode } from "../../utils/reverseGeoCode";

// --- 1. Safe Icon Generator (Fixes Icon Issues) ---
const createDriverIcon = (type) => {
  const color = "#10b981"; // Emerald-500
  const size = 32;

  // Choose icon based on type
  let IconComponent = Car;
  const t = type ? type.toLowerCase() : "car";
  if (t.includes("bike") || t.includes("moto")) IconComponent = Bike;
  if (t.includes("auto") || t.includes("tuk")) IconComponent = Truck;

  // Render Icon to HTML string
  const svgMarkup = renderToStaticMarkup(
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      borderRadius: '50%',
      border: `2px solid ${color}`,
      width: `${size}px`,
      height: `${size}px`,
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
    }}>
      <IconComponent size={18} color={color} fill={color} fillOpacity={0.2} />
    </div>
  );

  return L.divIcon({
    html: svgMarkup,
    className: "", // Empty class to prevent default Leaflet styles
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -10],
  });
};

const makeLucideIcon = (color = "#7c3aed", size = 28) => {
  const svg = renderToStaticMarkup(
    <MapPin size={size} color={color} strokeWidth={1.8} fill={color} fillOpacity={0.2} />
  );
  return L.divIcon({
    html: svg,
    className: "lucide-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// --- 2. Map Controller (Fixes Zoom/Bounds Issues) ---
function MapController({ position, drivers }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    // If drivers exist, zoom out to fit everyone
    if (drivers && drivers.length > 0) {
      const bounds = L.latLngBounds([
        [parseFloat(position.lat), parseFloat(position.lng)]
      ]);

      let validDrivers = 0;
      drivers.forEach((d) => {
        const dLat = parseFloat(d.lat);
        const dLng = parseFloat(d.lng);
        if (!isNaN(dLat) && !isNaN(dLng)) {
          bounds.extend([dLat, dLng]);
          validDrivers++;
        }
      });

      if (validDrivers > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.flyTo([position.lat, position.lng], 15);
      }
    } 
    // Otherwise just center on pickup
    else {
      map.flyTo([position.lat, position.lng], 15);
    }
  }, [position, drivers, map]);

  return null;
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng); },
  });
  return null;
}

// --- 3. Main Component ---
export default function MapSelector({
  pickup,
  drop,
  setPickup,
  setDrop,
  activeField,
  isTripRequested = false,
}) {
  const [drivers, setDrivers] = useState([]);
  const [hoveredDriverId, setHoveredDriverId] = useState(null);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // --- Fetch Drivers Logic (Fixes Data Access Error) ---
  useEffect(() => {
    if (!pickup || isTripRequested) return;

    const fetchDrivers = async () => {
      try {
        const response = await tripApi.getAvailableDriversOnMap(
          pickup.lat,
          pickup.lng,
          5.0
        );

        console.log("Full API Response:", response);

        let extractedDrivers = [];

        // CASE 1: Response contains 'data' property (Axios standard)
        if (response?.data?.drivers && Array.isArray(response.data.drivers)) {
          extractedDrivers = response.data.drivers;
        } 
        // CASE 2: Response IS the data object (Interceptor handled)
        else if (response?.drivers && Array.isArray(response.drivers)) {
          extractedDrivers = response.drivers;
        }

        if (isMounted.current) {
          console.log("Setting Drivers:", extractedDrivers);
          setDrivers(extractedDrivers);
        }
      } catch (err) {
        console.error("Error fetching drivers:", err);
      }
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, [pickup, isTripRequested]);

  if (!pickup) {
    return (
      <div className="h-72 flex items-center justify-center bg-slate-100 rounded-lg">
        <Loader />
      </div>
    );
  }

  // Ensure center coordinates are numbers
  const center = [parseFloat(pickup.lat), parseFloat(pickup.lng)];

  const onMapClick = async (latlng) => {
    if (isTripRequested) return;
    try {
      const result = await reverseGeocode(latlng.lat, latlng.lng);
      const locationData = {
        lat: result.lat,
        lng: result.lng,
        address: result.fullAddress,
        city: result.city,
      };
      if (activeField === "pickup") setPickup(locationData);
      else setDrop(locationData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-72 rounded-lg overflow-hidden relative border border-gray-200 shadow-inner">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* Controller handles zoom logic */}
        <MapController position={pickup} drivers={drivers} />
        
        <ClickHandler onMapClick={onMapClick} />

        {/* Pickup Marker */}
        <Marker
          position={[parseFloat(pickup.lat), parseFloat(pickup.lng)]}
          icon={makeLucideIcon("#7c3aed", 36)}
          zIndexOffset={1000}
        >
          <Popup offset={[0, -10]}>
            <div className="text-center">
              <strong className="text-indigo-600 block">Pickup</strong>
              <div className="text-xs text-gray-600">{pickup.address}</div>
            </div>
          </Popup>
        </Marker>

        {/* Drop Marker */}
        {drop && (
          <Marker
            position={[parseFloat(drop.lat), parseFloat(drop.lng)]}
            icon={makeLucideIcon("#059669", 36)}
            zIndexOffset={1000}
          >
            <Popup offset={[0, -10]}>
              <div className="text-center">
                <strong className="text-emerald-600 block">Drop</strong>
                <div className="text-xs text-gray-600">{drop.address}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Driver Markers */}
        {!isTripRequested && drivers.map((driver) => {
          const lat = parseFloat(driver.lat);
          const lng = parseFloat(driver.lng);

          // Skip invalid coordinates
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={driver.driver_id}
              position={[lat, lng]}
              icon={createDriverIcon(driver.vehicle_type)}
              eventHandlers={{
                mouseover: (e) => {
                  setHoveredDriverId(driver.driver_id);
                  e.target.openPopup();
                },
                mouseout: (e) => {
                  setHoveredDriverId(null);
                  e.target.closePopup();
                },
              }}
            >
              <Popup
                className="driver-popup"
                offset={[0, -5]}
                autoClose={false}
                closeButton={false}
              >
                <DriverPopup driver={driver} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Driver Count Badge */}
      {activeField === "pickup" && drivers.length > 0 && !isTripRequested && (
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-indigo-700 px-3 py-1.5 rounded-lg shadow-md text-xs font-bold z-[1000] border border-indigo-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          {drivers.length} driver{drivers.length !== 1 ? "s" : ""} nearby
        </div>
      )}
    </div>
  );
}