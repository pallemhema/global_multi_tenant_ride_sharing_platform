import L from "leaflet";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Car, Bike, Truck } from "lucide-react";

/**
 * Get vehicle icon using Lucide icons (no JSX errors)
 * Supported types: sedan, suv, hatchback, auto, bike, truck
 */
export const getVehicleIcon = (vehicleType, size = 32) => {
  let IconComponent;

  switch (vehicleType?.toLowerCase()) {
    case "bike":
      IconComponent = Bike;
      break;
    case "auto":
      IconComponent = Truck; // You can replace with better auto icon later
      break;
    case "truck":
      IconComponent = Truck;
      break;
    case "sedan":
    case "suv":
    case "hatchback":
    default:
      IconComponent = Car;
  }

  // Create icon element safely (NO JSX)
  const element = React.createElement(IconComponent, {
    size: size - 8,
    color: "#2563eb",
    strokeWidth: 1.8,
  });

  const svgString = renderToStaticMarkup(element);

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        background:white;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 3px 8px rgba(0,0,0,0.25);
        border:2px solid #e5e7eb;
      ">
        ${svgString}
      </div>
    `,
    className: "vehicle-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};


/**
 * Get clean vehicle type label
 */
export const getVehicleTypeLabel = (vehicleType) => {
  const labels = {
    sedan: "Sedan",
    suv: "SUV / MUV",
    hatchback: "Hatchback",
    auto: "Auto / Tuk-Tuk",
    bike: "Motorcycle",
    truck: "Truck",
  };

  return labels[vehicleType?.toLowerCase()] || vehicleType || "Vehicle";
};