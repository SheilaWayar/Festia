import { useEffect, useState } from "react";
import { turnosApi } from "../../services/turnosApi";
import { salonesApi } from "../../services/salonesApi";

const ESTADOS = { confirmado: "Confirmado", pendiente: "Pendiente", cancelado: "Cancelado" };

export default function TurnosAdmin() {
  const [turnos, setTurnos] = useState([]);
  const [salones, setSalones] = useState([]);
  const [filtros, setFiltros] = useState({ salon_id: "", fecha: "", estado: "" });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    salonesApi.listar().then(setSalones).catch(() => setSalones([]));
  }, []);

  function cargar() {
    setCargando(true);
    setError(null);
    turnosApi.todos(filtros).then(setTurnos)
      .catch((e) => setError(e.message)).finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  async function actualizar(id, estado) {
    try {
      await turnosApi.cambiarEstado(id, estado);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><span></span> Administración</span>
        <h2>Todos los <em>turnos</em></h2>
      </header>

      <div className="filtros-admin">
        <select name="salon_id" value={filtros.salon_id} onChange={cambiar} aria-label="Salón">
          <option value="">Todos los salones</option>
          {salones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <input type="date" name="fecha" value={filtros.fecha} onChange={cambiar} aria-label="Fecha" />
        <select name="estado" value={filtros.estado} onChange={cambiar} aria-label="Estado">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <section className="turnos-list" aria-live="polite">
        {cargando && <div className="state-box"><p>Cargando turnos...</p></div>}
        {error && <div className="state-box"><p>{error}</p></div>}
        {!cargando && !error && turnos.length === 0 && (
          <div className="state-box"><p>No hay turnos con esos filtros.</p></div>
        )}

        {turnos.map((t) => (
          <article key={t.id} className={`turno-card${t.estado === "cancelado" ? " is-cancelled" : ""}`}>
            <div>
              <h3>{t.salon_nombre}</h3>
              <p className="turno-meta">
                {t.fecha} · {t.hora_inicio.slice(0, 5)} a {t.hora_fin.slice(0, 5)} h · {t.usuario_email}
              </p>
            </div>
            <span className={`badge badge-${t.estado}`}>{ESTADOS[t.estado] ?? t.estado}</span>
            <div className="turno-acciones">
              {t.estado === "pendiente" && (
                <button className="btn-outline" type="button" onClick={() => actualizar(t.id, "confirmado")}>
                  Confirmar
                </button>
              )}
              {t.estado !== "cancelado" && (
                <button className="btn-danger" type="button" onClick={() => actualizar(t.id, "cancelado")}>
                  Cancelar
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
