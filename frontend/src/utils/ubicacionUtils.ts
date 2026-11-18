export interface CoordenadasGPS {
  lat: number;
  lng: number;
}

export function obtenerUbicacionGPS(): Promise<CoordenadasGPS> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Tu navegador no soporta geolocalización."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () =>
        reject(
          new Error(
            "No se pudo obtener tu ubicación. Verifica los permisos del navegador.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export function aproximarCoordenadas(coords: CoordenadasGPS): CoordenadasGPS {
  // 3 decimales ≈ 110m-300m de radio aproximado para proteger dirección exacta
  return {
    lat: Number(coords.lat.toFixed(3)),
    lng: Number(coords.lng.toFixed(3)),
  };
}

export async function obtenerDireccionAproximada(
  lat: number,
  lng: number,
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`,
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    const addr = data.address || {};
    const zona =
      addr.neighbourhood ||
      addr.suburb ||
      addr.quarter ||
      addr.road ||
      addr.village;
    const ciudad = addr.city || addr.town || addr.municipality || addr.county;
    const estado = addr.state;
    const partes = [zona, ciudad, estado].filter(Boolean);
    return partes.length > 0
      ? partes.join(", ")
      : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export function calcularDistanciaKm(
  a: CoordenadasGPS,
  b: CoordenadasGPS,
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}
