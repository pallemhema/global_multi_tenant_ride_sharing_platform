// import React, { useEffect, useState, useRef } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   useMapEvents,
//   useMap,
// } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { MapPin, Car, Bike, Truck } from "lucide-react";
// import { renderToStaticMarkup } from "react-dom/server";
// import Loader from "../common/Loader";
// import DriverPopup from "../Trip/DriverPopup";
// import * as tripApi from "../../services/tripApi";
// import { reverseGeocode } from "../../utils/reverseGeoCode";

// /* =====================================================
//    🔥 TESTING MODE (TURN OFF IN PRODUCTION)
// ===================================================== */
// const TESTING_SPREAD_MODE = true;

// /* =====================================================
//    Icon Generator
// ===================================================== */
// const createDriverIcon = (type) => {
//   const color = "#10b981";
//   const size = 32;

//   let IconComponent = Car;
//   const t = type ? type.toLowerCase() : "car";
//   if (t.includes("bike") || t.includes("moto")) IconComponent = Bike;
//   if (t.includes("auto") || t.includes("tuk")) IconComponent = Truck;

//   const svgMarkup = renderToStaticMarkup(
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundColor: "#ffffff",
//         borderRadius: "50%",
//         border: `2px solid ${color}`,
//         width: `${size}px`,
//         height: `${size}px`,
//         boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
//       }}
//     >
//       <IconComponent size={18} color={color} fill={color} fillOpacity={0.2} />
//     </div>
//   );

//   return L.divIcon({
//     html: svgMarkup,
//     className: "",
//     iconSize: [size, size],
//     iconAnchor: [size / 2, size / 2],
//     popupAnchor: [0, -10],
//   });
// };

// const makeLucideIcon = (color = "#7c3aed", size = 28) => {
//   const svg = renderToStaticMarkup(
//     <MapPin
//       size={size}
//       color={color}
//       strokeWidth={1.8}
//       fill={color}
//       fillOpacity={0.2}
//     />
//   );
//   return L.divIcon({
//     html: svg,
//     className: "lucide-marker",
//     iconSize: [size, size],
//     iconAnchor: [size / 2, size],
//     popupAnchor: [0, -size],
//   });
// };

// /* =====================================================
//    Map Controller
// ===================================================== */
// function MapController({ position, drivers }) {
//   const map = useMap();

//   useEffect(() => {
//     if (!position) return;

//     if (drivers && drivers.length > 0) {
//       const bounds = L.latLngBounds([
//         [parseFloat(position.lat), parseFloat(position.lng)],
//       ]);

//       drivers.forEach((d) => {
//         const dLat = parseFloat(d.lat);
//         const dLng = parseFloat(d.lng);
//         if (!isNaN(dLat) && !isNaN(dLng)) {
//           bounds.extend([dLat, dLng]);
//         }
//       });

//       map.fitBounds(bounds, { padding: [50, 50] });
//     } else {
//       map.flyTo([position.lat, position.lng], 15);
//     }
//   }, [position, drivers, map]);

//   return null;
// }

// function ClickHandler({ onMapClick }) {
//   useMapEvents({
//     click(e) {
//       onMapClick(e.latlng);
//     },
//   });
//   return null;
// }

// /* =====================================================
//    MAIN COMPONENT
// ===================================================== */
// export default function MapSelector({
//   pickup,
//   drop,
//   setPickup,
//   setDrop,
//   activeField,
//   isTripRequested = false,
// }) {
//   const [drivers, setDrivers] = useState([]);

  

//   /* =============================
//      Fetch Drivers
//   ============================== */
//   useEffect(() => {
//     if (!pickup || isTripRequested) return;

//     const fetchDrivers = async () => {
//       try {
//         const response = await tripApi.getAvailableDriversOnMap(
//           pickup.lat,
//           pickup.lng,
//           5.0
//         );
//         console.log("Raw response from API:", response);

//         let extractedDrivers = [];

//         if (response?.drivers) {
//           extractedDrivers = response.drivers;
//             setDrivers(extractedDrivers);
//         } 

       
//       } catch (err) {
//         console.error("Error fetching drivers:", err);
//       }
//     };

//     fetchDrivers();
//     const interval = setInterval(fetchDrivers, 5000);
//     return () => clearInterval(interval);
//   }, [pickup, isTripRequested]);

//   console.log("Drivers to render:", drivers);

//   if (!pickup) {
//     return (
//       <div className="h-72 flex items-center justify-center bg-slate-100 rounded-lg">
//         <Loader />
//       </div>
//     );
//   }

//   const center = [parseFloat(pickup.lat), parseFloat(pickup.lng)];

//   const onMapClick = async (latlng) => {
//     if (isTripRequested) return;

//     try {
//       const result = await reverseGeocode(latlng.lat, latlng.lng);

//       const locationData = {
//         lat: result.lat,
//         lng: result.lng,
//         address: result.fullAddress,
//         city: result.city,
//       };

//       if (activeField === "pickup") setPickup(locationData);
//       else setDrop(locationData);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <div className="h-72 rounded-lg overflow-hidden relative border border-gray-200 shadow-inner">
//       <MapContainer
//         center={center}
//         zoom={15}
//         style={{ height: "100%", width: "100%" }}
//         zoomControl={false}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution="&copy; OpenStreetMap"
//         />

//         <MapController position={pickup} drivers={drivers} />
//         <ClickHandler onMapClick={onMapClick} />

//         {/* Pickup Marker */}
//         <Marker
//           position={[parseFloat(pickup.lat), parseFloat(pickup.lng)]}
//           icon={makeLucideIcon("#7c3aed", 36)}
//           zIndexOffset={1000}
//         >
//           <Popup>
//             <strong>Pickup</strong>
//             <div>{pickup.address}</div>
//           </Popup>
//         </Marker>

//         {/* Drop Marker */}
//         {drop && (
//           <Marker
//             position={[parseFloat(drop.lat), parseFloat(drop.lng)]}
//             icon={makeLucideIcon("#059669", 36)}
//             zIndexOffset={1000}
//           >
//             <Popup>
//               <strong>Drop</strong>
//               <div>{drop.address}</div>
//             </Popup>
//           </Marker>
//         )}

//         {/* Driver Markers */}
//         {drivers.map((driver, idx) => {
//           const baseLat = parseFloat(driver.lat);
//           const baseLng = parseFloat(driver.lng);

//           if (isNaN(baseLat) || isNaN(baseLng)) return null;

//           let position = [baseLat, baseLng];
//                     console.log("Rendering driver at:", position);


//           if (TESTING_SPREAD_MODE) {
//             const angle = (idx / drivers.length) * 2 * Math.PI;
//             const radius = 0.0015; // ~150 meters

//             const offsetLat = baseLat + radius * Math.cos(angle);
//             const offsetLng = baseLng + radius * Math.sin(angle);

//             position = [offsetLat, offsetLng];
//           }

//           return (
//             <Marker
//               key={driver.driver_id}
//               position={position}
//               icon={createDriverIcon(driver.vehicle_type)}              
//               zIndexOffset={2000}
//             >
//               <Popup>
//                 <DriverPopup driver={driver} />
//               </Popup>
//             </Marker>
//           );
//         })}

 
//       </MapContainer>

//       {/* Driver Count Badge */}
//       {activeField === "pickup" &&
//         drivers.length > 0 &&
//         !isTripRequested && (
//           <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-indigo-700 px-3 py-1.5 rounded-lg shadow-md text-xs font-bold z-[1000] border border-indigo-100">
//             {drivers.length} driver
//             {drivers.length !== 1 ? "s" : ""} nearby
//           </div>
//         )}
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
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

/* =====================================================
   🔥 TESTING MODE
===================================================== */
const TESTING_SPREAD_MODE = true;

/* =====================================================
   ICON GENERATORS
===================================================== */
const createDriverIcon = (type) => {
  const color = "#10b981";
  const size = 32;

  let IconComponent = Car;
  const t = type ? type.toLowerCase() : "car";
  if (t.includes("bike") || t.includes("moto")) IconComponent = Bike;
  if (t.includes("auto") || t.includes("tuk")) IconComponent = Truck;

  const svgMarkup = renderToStaticMarkup(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: "50%",
        border: `2px solid ${color}`,
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
      }}
    >
      <IconComponent size={18} color={color} fill={color} fillOpacity={0.2} />
    </div>
  );

  return L.divIcon({
    html: svgMarkup,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const makeLucideIcon = (color = "#7c3aed", size = 32) => {
  const svg = renderToStaticMarkup(
    <MapPin size={size} color={color} fill={color} fillOpacity={0.2} />
  );

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

/* =====================================================
   MAP CONTROLLER
===================================================== */
function MapController({ pickup, drivers, routeCoords }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
      return;
    }

    if (pickup && drivers.length > 0) {
      const bounds = L.latLngBounds([
        [parseFloat(pickup.lat), parseFloat(pickup.lng)],
      ]);

      drivers.forEach((d) => {
        bounds.extend([parseFloat(d.lat), parseFloat(d.lng)]);
      });

      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup) {
      map.flyTo([pickup.lat, pickup.lng], 15);
    }
  }, [pickup, drivers, routeCoords, map]);

  return null;
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

/* =====================================================
   MAIN COMPONENT
===================================================== */
export default function MapSelector({
  pickup,
  drop,
  setPickup,
  setDrop,
  activeField,
  isTripRequested = false,
}) {
  const [drivers, setDrivers] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);

  /* =============================
     FETCH DRIVERS
  ============================== */
  useEffect(() => {
    if (!pickup || isTripRequested) return;

    const fetchDrivers = async () => {
      try {
        const response = await tripApi.getAvailableDriversOnMap(
          pickup.lat,
          pickup.lng,
          5.0
        );

        let extractedDrivers = [];

        if (response?.data?.data?.drivers)
          extractedDrivers = response.data.data.drivers;
        else if (response?.data?.drivers)
          extractedDrivers = response.data.drivers;
        else if (response?.drivers)
          extractedDrivers = response.drivers;

        setDrivers(extractedDrivers);
      } catch (err) {
        console.error("Error fetching drivers:", err);
      }
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, [pickup, isTripRequested]);

  /* =============================
     FETCH ROUTE (OSRM FREE)
  ============================== */
  useEffect(() => {
    if (!pickup || !drop) {
      setRouteCoords([]);
      return;
    }

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const data = await res.json();

        const coords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

        setRouteCoords(coords);
      } catch (err) {
        console.error("Route fetch error:", err);
      }
    };

    fetchRoute();
  }, [pickup, drop]);

  if (!pickup) {
    return (
      <div className="h-72 flex items-center justify-center bg-slate-100 rounded-lg">
        <Loader />
      </div>
    );
  }

  const center = [parseFloat(pickup.lat), parseFloat(pickup.lng)];

  const onMapClick = async (latlng) => {
    if (isTripRequested) return;

    const result = await reverseGeocode(latlng.lat, latlng.lng);

    const locationData = {
      lat: result.lat,
      lng: result.lng,
      address: result.fullAddress,
      city: result.city,
    };

    if (activeField === "pickup") setPickup(locationData);
    else setDrop(locationData);
  };

  return (
    <div className="h-72 rounded-lg overflow-hidden relative border shadow-inner">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />

        <MapController
          pickup={pickup}
          drivers={drivers}
          routeCoords={routeCoords}
        />

        <ClickHandler onMapClick={onMapClick} />

        {/* ROUTE LINE */}
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.9,
            }}
          />
        )}

        {/* PICKUP */}
        <Marker
          position={[pickup.lat, pickup.lng]}
          icon={makeLucideIcon("#7c3aed")}
        />

        {/* DROP */}
        {drop && (
          <Marker
            position={[drop.lat, drop.lng]}
            icon={makeLucideIcon("#059669")}
          />
        )}

        {/* DRIVERS */}
        {drivers.map((driver, idx) => {
          const baseLat = parseFloat(driver.lat);
          const baseLng = parseFloat(driver.lng);

          if (isNaN(baseLat) || isNaN(baseLng)) return null;

          let position = [baseLat, baseLng];

          if (TESTING_SPREAD_MODE) {
            const angle = (idx / drivers.length) * 2 * Math.PI;
            const radius = 0.0015;
            position = [
              baseLat + radius * Math.cos(angle),
              baseLng + radius * Math.sin(angle),
            ];
          }

          return (
            <Marker
              key={driver.driver_id}
              position={position}
              icon={createDriverIcon(driver.vehicle_type)}
            >
              <Popup>
                <DriverPopup driver={driver} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {activeField === "pickup" &&
        drivers.length > 0 &&
        !isTripRequested && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-indigo-700 px-3 py-1.5 rounded-lg shadow-md text-xs font-bold z-[1000] border border-indigo-100">
            {drivers.length} driver
            {drivers.length !== 1 ? "s" : ""} nearby
          </div>
        )}
    </div>
  );
}