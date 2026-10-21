// Fotos de respaldo del diseño original, para salones que todavía no tienen imágenes cargadas.
export const HERO =
  "https://images.unsplash.com/photo-1670529776286-f426fb7ba42c?auto=format&fit=crop&w=2000&q=90";

const RESPALDO = [
  "https://images.unsplash.com/photo-1670529776180-60e4132ab90c?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1670529776286-f426fb7ba42c?auto=format&fit=crop&w=1400&q=85",
];

// Foto número i del salón; si no tiene, usa una de respaldo
export const fotoDe = (salon, i = 0) =>
  salon.imagenes?.[i] || RESPALDO[(Number(salon.id) + i) % RESPALDO.length];

// Para <img onError={alFallarImagen}>: si un link de foto está roto, muestra una de respaldo
export function alFallarImagen(e) {
  const img = e.currentTarget;
  if (img.dataset.respaldo) return; // evita repetir si la de respaldo también falla
  img.dataset.respaldo = "1";
  img.src = RESPALDO[0];
}
