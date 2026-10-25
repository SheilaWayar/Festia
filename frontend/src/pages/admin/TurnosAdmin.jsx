import { useEffect, useState } from "react";
import { turnosApi } from "../../services/turnosApi";
import { salonesApi } from "../../services/salonesApi";

const ESTADOS = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  finalizado: "Finalizado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};
const ESTADOS_PAGO = { sin_pago: "Sin pago", parcial: "Anticipo pagado", pagado: "Pagado" };
const DEPOSITO = { pendiente: "En custodia", liberado: "Liberado", retenido: "Retenido" };

const yaTermino = (t) => new Date(`${t.fecha}T${t.hora_fin}`) <= new Date();

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

  async function ejecutar(accion) {
    try {
      await accion();
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  const confirmar = (id) => ejecutar(() => turnosApi.confirmar(id));
  const cancelar = (id) => ejecutar(() => turnosApi.cambiarEstado(id, "cancelado"));

  function rechazar(id) {
    const motivo = window.prompt("Motivo del rechazo (mínimo 3 caracteres)");
    if (!motivo) return;
    ejecutar(() => turnosApi.rechazar(id, motivo));
  }

  function finalizar(id) {
    const liberar = window.confirm(
      "¿Liberar el depósito?\nAceptar = liberar. Cancelar = no liberar (hay que explicar el motivo)."
    );
    if (liberar) return ejecutar(() => turnosApi.finalizar(id, "liberado", null));
    const motivo = window.prompt("Motivo por el que no se libera el depósito (mínimo 10 caracteres)");
    if (!motivo) return;
    ejecutar(() => turnosApi.finalizar(id, "retenido", motivo));
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
          {Object.entries(ESTADOS).map(([valor, texto]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </select>
      </div>

      <section className="turnos-list" aria-live="polite">
        {cargando && <div className="state-box"><p>Cargando turnos...</p></div>}
        {error && <div className="state-box"><p>{error}</p></div>}
        {!cargando && !error && turnos.length === 0 && (
          <div className="state-box"><p>No hay turnos con esos filtros.</p></div>
        )}

        {turnos.map((t) => (
          <article
            key={t.id}
            className={`turno-card${["cancelado", "rechazado"].includes(t.estado) ? " is-cancelled" : ""}`}
          >
            <div>
              <h3>{t.salon_nombre}</h3>
              <p className="turno-meta">
                {t.fecha} · {t.hora_inicio.slice(0, 5)} a {t.hora_fin.slice(0, 5)} h · {t.usuario_email}
              </p>
              {t.monto_total > 0 && (
                <p className="turno-meta">
                  Total ${Number(t.monto_total).toLocaleString("es-AR")} · anticipo {t.anticipo_porcentaje}% ·{" "}
                  {ESTADOS_PAGO[t.estado_pago] ?? t.estado_pago} · depósito {DEPOSITO[t.estado_deposito] ?? t.estado_deposito}
                </p>
              )}
              {t.motivo_rechazo && <p className="turno-meta">Motivo del rechazo: {t.motivo_rechazo}</p>}
              {t.comentario_deposito && <p className="turno-meta">Comentario del depósito: {t.comentario_deposito}</p>}
            </div>
            <span className={`badge badge-${t.estado}`}>{ESTADOS[t.estado] ?? t.estado}</span>
            <div className="turno-acciones">
              {t.estado === "pendiente" && (
                <>
                  <button className="btn-outline" type="button" onClick={() => confirmar(t.id)}>Confirmar</button>
                  <button className="btn-danger" type="button" onClick={() => rechazar(t.id)}>Rechazar</button>
                </>
              )}
              {t.estado === "confirmado" && yaTermino(t) && (
                <button className="btn-outline" type="button" onClick={() => finalizar(t.id)}>Finalizar evento</button>
              )}
              {["pendiente", "confirmado"].includes(t.estado) && (
                <button className="btn-danger" type="button" onClick={() => cancelar(t.id)}>Cancelar</button>
              )}
            </div>
          </article>
        ))}
      </section>
    </>
  );
} 