import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icono from "./Icono";
import { salonesApi } from "../services/salonesApi";

const CAPACIDADES = [
  { valor: "", texto: "Cualquiera" },
  { valor: "50", texto: "Mínimo 50" },
  { valor: "100", texto: "Mínimo 100" },
  { valor: "200", texto: "Mínimo 200" },
];

// Los filtros viven en la URL: /salones?tipo_evento=casamiento&capacidad_min=100
export default function BuscadorSalones() {
  const [params, setParams] = useSearchParams();
  const [tipos, setTipos] = useState([]);
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    salonesApi.tiposEvento().then(setTipos).catch(() => setTipos([]));
  }, []);

  // Si cambia la URL (botón atrás, link compartido), se actualiza el campo de texto
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function actualizar(clave, valor) {
    const nuevo = new URLSearchParams(params);
    if (valor) nuevo.set(clave, valor);
    else nuevo.delete(clave);
    setParams(nuevo, { replace: true });
  }

  // El texto se aplica solo, 400 ms después de dejar de escribir
  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim() !== (params.get("q") ?? "")) actualizar("q", q.trim());
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function buscar(e) {
    e.preventDefault();
    actualizar("q", q.trim());
  }

  return (
    <section className="filter-wrap" aria-label="Buscar salones">
      <form className="filter-panel" onSubmit={buscar}>
        <label>
          <span><Icono nombre="tag" size={16} /> Tipo de evento</span>
          <select
            value={params.get("tipo_evento") ?? ""}
            onChange={(e) => actualizar("tipo_evento", e.target.value)}
          >
            <option value="">Todos</option>
            {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label>
          <span><Icono nombre="search" size={16} /> Buscar</span>
          <input
            type="text"
            placeholder="Nombre del salón..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        <label>
          <span><Icono nombre="users" size={16} /> Capacidad</span>
          <select
            value={params.get("capacidad_min") ?? ""}
            onChange={(e) => actualizar("capacidad_min", e.target.value)}
          >
            {CAPACIDADES.map((c) => <option key={c.valor} value={c.valor}>{c.texto}</option>)}
          </select>
        </label>

        <button className="search-button" type="submit">
          <Icono nombre="search" size={16} /> Buscar
        </button>
      </form>
    </section>
  );
}
