import { calculateHaversineDistance } from './haversine.util';

describe('calculateHaversineDistance', () => {
  it('should calculate distance between two close points in Warsaw', () => {
    // Marszałkowska 10 to Nowy Świat (approx 500m)
    const lat1 = 52.2297;
    const lng1 = 21.0122;
    const lat2 = 52.2327;
    const lng2 = 21.0167;

    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);

    // Should be approximately 500-550 meters
    expect(distance).toBeGreaterThan(400);
    expect(distance).toBeLessThan(600);
  });

  it('should return 0 for identical coordinates', () => {
    const lat = 52.2297;
    const lng = 21.0122;

    const distance = calculateHaversineDistance(lat, lng, lat, lng);

    expect(distance).toBe(0);
  });

  it('should calculate distance between Warsaw and Krakow', () => {
    // Warsaw
    const lat1 = 52.2297;
    const lng1 = 21.0122;
    // Krakow
    const lat2 = 50.0647;
    const lng2 = 19.945;

    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);

    // Should be approximately 252-255 km
    expect(distance).toBeGreaterThan(250000);
    expect(distance).toBeLessThan(260000);
  });

  it('should calculate small distances accurately (within 50m)', () => {
    const lat1 = 52.2297;
    const lng1 = 21.0122;
    // Move approximately 30m north
    const lat2 = 52.22997;
    const lng2 = 21.0122;

    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);

    // Should be approximately 30 meters
    expect(distance).toBeGreaterThan(25);
    expect(distance).toBeLessThan(35);
  });

  it('should handle negative coordinates (Southern/Western hemisphere)', () => {
    // Sydney Opera House
    const lat1 = -33.8568;
    const lng1 = 151.2153;
    // Sydney Harbour Bridge (approx 1km away)
    const lat2 = -33.852;
    const lng2 = 151.2108;

    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);

    // Should be approximately 600-700 meters
    expect(distance).toBeGreaterThan(500);
    expect(distance).toBeLessThan(800);
  });
});
