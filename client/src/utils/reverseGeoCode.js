// src/utils/reverseGeoCode.js

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    const data = await res.json();

    const address = data?.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      null;

    const formattedAddress =
      data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    return {
      fullAddress: formattedAddress,
      city,
      state: address.state || null,
      suburb: address.suburb || null,
      pincode: address.postcode || null,
      country: address.country || null,
      lat: parseFloat(data?.lat) || lat,
      lng: parseFloat(data?.lon) || lng,
    };
  } catch (e) {
    console.error("Reverse geocode failed", e);

    return {
      fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city: null,
      state: null,
      suburb: null,
      pincode: null,
      country: null,
      lat,
      lng,
    };
  }
}
