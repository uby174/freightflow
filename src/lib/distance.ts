import { WAREHOUSE } from "./config";

export interface DistanceResult {
  km: number;
  source: "osrm" | "haversine";
  resolvedLabel?: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(
  query: string
): Promise<{ lat: number; lng: number; label: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr,de,be,lu,ch&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CamFret/0.1 (booking distance calc)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!data.length) return null;
    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: data[0].display_name,
    };
  } catch {
    return null;
  }
}

async function osrmKm(lat: number, lng: number): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${WAREHOUSE.lng},${WAREHOUSE.lat};${lng},${lat}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: Array<{ distance: number }>;
    };
    const meters = data.routes?.[0]?.distance;
    return meters ? meters / 1000 : null;
  } catch {
    return null;
  }
}

/** Road distance from the Strasbourg warehouse to a customer address. */
export async function distanceFromWarehouse(
  address: string
): Promise<DistanceResult | null> {
  const geo = await geocode(address);
  if (!geo) return null;

  const road = await osrmKm(geo.lat, geo.lng);
  if (road !== null) {
    return { km: Math.round(road * 10) / 10, source: "osrm", resolvedLabel: geo.label };
  }
  // Straight-line × 1.3 road factor when the routing service is unreachable
  const straight = haversineKm(WAREHOUSE.lat, WAREHOUSE.lng, geo.lat, geo.lng);
  return {
    km: Math.round(straight * 1.3 * 10) / 10,
    source: "haversine",
    resolvedLabel: geo.label,
  };
}
