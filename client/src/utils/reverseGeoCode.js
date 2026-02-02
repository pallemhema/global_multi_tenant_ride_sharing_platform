// src/utils/reverseGeocode.js
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (e) {
    console.error("Reverse geocode failed", e);
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
