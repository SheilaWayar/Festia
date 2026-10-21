// Horas de inicio posibles: 10:00 a 23:00
export const HORAS = Array.from({ length: 14 }, (_, i) => i + 10);

const aMin = (hhmm) =>
  parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(3, 5), 10);

// Date -> "2026-11-14" (en hora local, sin desfase de zona horaria)
export const aISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// Date -> "2026-11"
export const aMes = (d) => aISO(d).slice(0, 7);

// "14:00" a partir del número 14
export const hhmm = (h) => `${String(h).padStart(2, "0")}:00`;

// Para la hora de fin: 24 se manda como 23:59 (el backend no acepta 24:00)
export const hhmmFin = (h) => (h >= 24 ? "23:59" : hhmm(h));

// ¿La hora h de ese día está ocupada?
export function horaOcupada(ocupados, fechaISO, h) {
  return ocupados.some(
    (o) =>
      o.fecha === fechaISO &&
      aMin(o.hora_inicio) < (h + 1) * 60 &&
      aMin(o.hora_fin) > h * 60
  );
}

// ¿Todas las horas del día están ocupadas?
export function diaCompleto(ocupados, fechaISO) {
  return HORAS.every((h) => horaOcupada(ocupados, fechaISO, h));
}
