// src/utils/location.js
export function getCurrentPositionPromise(options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 15000, ...options }
    );
  });
}
