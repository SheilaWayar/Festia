import { request } from "./api";

export const salonesApi = {
  listar: (filtros = {}) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== "" && v != null) params.set(k, v);
    });
    const qs = params.toString();
    return request(`/salones${qs ? `?${qs}` : ""}`);
  },
  obtener: (id) => request(`/salones/${id}`),
  tiposEvento: () => request("/tipos-evento"),
  disponibilidad: (id, mes) =>
    request(`/salones/${id}/disponibilidad?mes=${mes}`),
  crear: (data) =>
    request("/salones", { method: "POST", body: JSON.stringify(data) }),
  actualizar: (id, data) =>
    request(`/salones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  eliminar: (id) => request(`/salones/${id}`, { method: "DELETE" }),
};
