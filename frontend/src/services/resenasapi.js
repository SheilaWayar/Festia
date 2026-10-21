import { request } from "./api";

// Reseñas de salones. El backend devuelve los errores en `detail`.
export const resenasApi = {
  // { items, total, page, limit, paginas, promedio, cantidad }
  listar: (salonId, { page = 1, limit = 3 } = {}) =>
    request(`/salones/${salonId}/resenas?page=${page}&limit=${limit}`),

  // { puede_resenar, motivo, mi_resena }  (requiere sesión)
  estado: (salonId) => request(`/salones/${salonId}/resenas/estado`),

  crear: (salonId, { puntaje, comentario }) =>
    request(`/salones/${salonId}/resenas`, {
      method: "POST",
      body: JSON.stringify({ puntaje, comentario }),
    }),

  editarMia: (salonId, { puntaje, comentario }) =>
    request(`/salones/${salonId}/resenas/mia`, {
      method: "PUT",
      body: JSON.stringify({ puntaje, comentario }),
    }),

  // Solo admin
  borrar: (salonId, resenaId) =>
    request(`/salones/${salonId}/resenas/${resenaId}`, { method: "DELETE" }),

  // [{ salon_id, promedio, cantidad }] de los salones que tienen reseñas
  resumen: () => request("/resenas/resumen"),
};