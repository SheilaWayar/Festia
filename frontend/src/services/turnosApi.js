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
};
