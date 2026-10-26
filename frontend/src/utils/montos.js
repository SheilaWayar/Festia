export const formatearPesos = (n) => `$${Number(n || 0).toLocaleString("es-AR")}`;

// Estimación para mostrar antes de reservar. El monto real lo calcula el backend.
export function estimarMontos(salon, inicio, fin) {
  const horas = (fin - inicio) / 36e5;
  if (!(horas > 0)) return null;
  const total = Math.round(salon.precio_por_hora * horas * 100) / 100;
  const porcentaje = salon.anticipo_porcentaje ?? 20;
  return { horas, total, porcentaje, anticipo: Math.round(total * porcentaje) / 100 };
}