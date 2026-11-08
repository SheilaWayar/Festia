const RADIO_TIERRA_KM = 6371;
const aRadianes = (g) => (g * Math.PI) / 180;

// Distancia en km entre dos puntos { lat, lng } (fórmula de Haversine)
export function distanciaKm(a, b) {
  const dLat = aRadianes(b.lat - a.lat);
  const dLng = aRadianes(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(x));
}

// Pide la ubicación al navegador (la persona tiene que aceptar el permiso)
export function obtenerMiUbicacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Tu navegador no permite obtener la ubicación."));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === 1
              ? "No diste permiso para usar tu ubicación. Activalo en el candado de la barra de direcciones."
              : "No se pudo obtener tu ubicación. Probá de nuevo."
          )
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

// "a 450 m" / "a 2,3 km"
export function formatearDistancia(km) {
  if (km < 1) return `a ${Math.round(km * 1000)} m`;
  return `a ${km.toFixed(1).replace(".", ",")} km`;
}

// Convierte una dirección en coordenadas (OpenStreetMap, gratis).
// Pensada para el formulario de salones del admin: máximo 1 búsqueda por segundo.
export async function buscarCoordenadas(direccion) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=" +
    encodeURIComponent(direccion);
  const res = await fetch(url, { headers: { "Accept-Language": "es" } });
  if (!res.ok) throw new Error("No se pudo buscar la dirección.");
  const lista = await res.json();
  if (!lista.length) throw new Error("No encontramos esa dirección. Probá agregando la ciudad.");
  return { latitud: Number(lista[0].lat), longitud: Number(lista[0].lon) };
}