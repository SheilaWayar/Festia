import { request } from "./api";

export const turnosApi = {
  crear: (data) =>
    request("/turnos", { method: "POST", body: JSON.stringify(data) }),
  mios: () => request("/turnos/mios"),
  cancelar: (id) => request(`/turnos/${id}`, { method: "DELETE" }),

  // Solo admin
  todos: (filtros = {}) => {
    const p = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    const qs = p.toString();
    return request(`/turnos${qs ? `?${qs}` : ""}`);
  },
  cambiarEstado: (id, estado) =>
    request(`/turnos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
       confirmar: (id) => request(`/turnos/${id}/confirmar`, { method: "PATCH" }),
   rechazar: (id, motivo) =>
     request(`/turnos/${id}/rechazar`, { method: "PATCH", body: JSON.stringify({ motivo }) }),
   finalizar: (id, deposito, comentario) =>
     request(`/turnos/${id}/finalizar`, {
       method: "PATCH",
       body: JSON.stringify({ deposito, comentario }),
     }),
       // Fase 2
  historialSalon: (salonId) => request(`/salones/${salonId}/turnos`),
  pagoManual: (turnoId, datos) =>
    request(`/pagos/${turnoId}/manual`, { method: "POST", body: JSON.stringify(datos) }),
};
