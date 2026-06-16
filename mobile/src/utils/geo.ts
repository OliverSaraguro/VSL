import { Coordinates } from '../types';

// Distancia en metros entre dos coordenadas (fórmula de Haversine).
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Distancia aproximada (en metros) de un punto al segmento a-b, usando una proyección
// equirectangular local (suficientemente precisa para distancias cortas dentro de una ciudad).
export function distanceToSegmentMeters(point: Coordinates, a: Coordinates, b: Coordinates): number {
  const latRef = (a.latitude * Math.PI) / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos(latRef);

  const toXY = (c: Coordinates) => ({
    x: (c.longitude - a.longitude) * metersPerDegLon,
    y: (c.latitude - a.latitude) * metersPerDegLat,
  });

  const p = toXY(point);
  const bXY = toXY(b);

  const segLenSq = bXY.x ** 2 + bXY.y ** 2;
  if (segLenSq === 0) return distanceMeters(point, a);

  let t = (p.x * bXY.x + p.y * bXY.y) / segLenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = t * bXY.x;
  const projY = t * bXY.y;

  return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
}

// Distancia mínima de un punto a la ruta planificada, aproximada como la poligonal que conecta
// las paradas en orden (no hay API de rutas/Directions integrada todavía).
export function distanceToRouteMeters(point: Coordinates, path: Coordinates[]): number {
  if (path.length === 0) return 0;
  if (path.length === 1) return distanceMeters(point, path[0]);

  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const d = distanceToSegmentMeters(point, path[i], path[i + 1]);
    if (d < min) min = d;
  }
  return min;
}
