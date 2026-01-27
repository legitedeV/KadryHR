/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lng1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lng2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const EARTH_RADIUS_METERS = 6371000; // Earth's radius in meters

  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_METERS * c;

  return Math.round(distance); // Return distance in meters, rounded to integer
}
