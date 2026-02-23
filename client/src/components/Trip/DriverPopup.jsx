import React from "react";
import { Star } from "lucide-react";
import { getVehicleTypeLabel } from "../../utils/vehicleIcons";

export default function DriverPopup({ driver }) {
  if (!driver) return null;

  const stars = Math.floor(driver.rating);
  const hasHalfStar = driver.rating % 1 >= 0.5;

  return (
    <div
      className="p-3 min-w-max"
      style={{
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header with driver name */}
      <div className="mb-2">
        <h3 className="font-bold text-sm text-gray-900">
          {driver.driver_name}
        </h3>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={`${
                i < stars
                  ? "fill-yellow-400 text-yellow-400"
                  : i < stars + (hasHalfStar ? 1 : 0)
                    ? "fill-yellow-200 text-yellow-400"
                    : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-gray-700">
          {driver.rating.toFixed(1)}
        </span>
      </div>

      {/* Tenant name */}
      <div className="mb-2 text-xs text-gray-600">
        <span className="font-semibold">Tenant:</span> {driver.tenant_name}
      </div>

      {/* Vehicle type */}
      <div className="mb-2 text-xs text-gray-600">
        <span className="font-semibold">Vehicle:</span>{" "}
        {getVehicleTypeLabel(driver.vehicle_type)}
      </div>

      {/* License plate */}
      {driver.license_plate && (
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
          {driver.license_plate}
        </div>
      )}

      {/* Distance */}
      {driver.distance_km !== undefined && (
        <div className="mt-2 text-xs text-indigo-600 font-semibold">
          {driver.distance_km.toFixed(1)} km away
        </div>
      )}
    </div>
  );
}
