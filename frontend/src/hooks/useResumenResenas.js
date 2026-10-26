import { useSyncExternalStore } from "react";
import { resenasApi } from "../services/resenasApi";

// Resumen de reseñas (promedio y cantidad) de TODOS los salones, cargado una sola vez
// y compartido por todas las cards. Si se crea o borra una reseña, llamar a refrescarResumen().
let datos = null; // null = todavía no se cargó; luego { [salon_id]: { promedio, cantidad } }
let cargando = false;
const oyentes = new Set();

function cargar() {
  if (cargando) return;
  cargando = true;
  resenasApi
    .resumen()
    .then((lista) => {
      datos = Object.fromEntries(lista.map((r) => [r.salon_id, r]));
    })
    .catch(() => {
      datos = datos ?? {}; // si falla no se muestran estrellas, pero no se rompe nada
    })
    .finally(() => {
      cargando = false;
      oyentes.forEach((avisar) => avisar());
    });
}

export function refrescarResumen() {
  cargar();
}

function suscribir(avisar) {
  oyentes.add(avisar);
  if (datos === null) cargar();
  return () => oyentes.delete(avisar);
}

const leer = () => datos;

// Devuelve { promedio, cantidad } del salón, o null si no tiene reseñas todavía.
export function useResumenResenas(salonId) {
  const todos = useSyncExternalStore(suscribir, leer);
  return todos?.[salonId] ?? null;
}