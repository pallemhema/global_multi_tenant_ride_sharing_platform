export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function trimRouteFromDriver(driverLocation, route) {
  if (!driverLocation || route.length === 0) return route;

  let closestIndex = 0;
  let minDistance = Infinity;

  route.forEach((point, index) => {
    const dist = getDistanceKm(
      driverLocation[0],
      driverLocation[1],
      point[0],
      point[1]
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = index;
    }
  });

  return route.slice(closestIndex);
}