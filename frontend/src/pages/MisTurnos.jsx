import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { turnosApi } from "../services/turnosApi";

const ESTADOS = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  finalizado: "Finalizado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};
const ESTADOS_PAGO = { sin_pago: "Sin pago", parcial: "Anticipo pagado", pagado: "Pagado" };
const DEPOSITO = { pendiente: "En custodia", liberado: "Liberado", retenido: "Retenido" };

const pesos = (n) => `$${Number(n || 0).toLocaleString("es-AR")}`;

const fechaLarga = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

export default function MisTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true); // arranca en true: la primera carga ya está "cargando"
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", ok: false });
  const [cancelando, setCancelando] = useState(null);

  // Pide los turnos. No cambia estados de forma inmediata, solo cuando responde el servidor.
  function traer() {
    return turnosApi
      .mios()
      .then(setTurnos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    traer();
  }, []);

  function reintentar() {
    setCargando(true);
    setError(null);
    traer();
  }

  async function cancelar(t) {
    if (!window.confirm(`¿Cancelar tu turno en ${t.salon_nombre}?`)) return;
    setMensaje({ texto: "", ok: false });
    setCancelando(t.id); // evita el doble clic
    try {
      await turnosApi.cancelar(t.id);
      setTurnos((lista) => lista.map((x) => (x.id === t.id ? { ...x, estado: "cancelado" } : x)));
      setMensaje({ texto: "Turno cancelado.", ok: true });
    } catch (err) {
      setMensaje({ texto: err.message, ok: false });
    } finally {
      setCancelando(null);
    }
  }

  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><span></span> Tu cuenta</span>
        <h2>Mis <em>turnos</em></h2>
      </header>

      <p className={`form-msg turnos-msg${mensaje.ok ? " is-ok" : ""}`} role="alert">{mensaje.texto}</p>

      <section className="turnos-list" aria-live="polite">
        {cargando && <div className="state-box"><p>Cargando tus turnos...</p></div>}

        {error && (
          <div className="state-box">
            <p>{error}</p>
            <button className="btn-outline" type="button" onClick={reintentar}>Reintentar</button>
          </div>
        )}

        {!cargando && !error && turnos.length === 0 && (
          <div className="state-box">
            <p>Todavía no tenés turnos reservados.</p>
            <Link className="primary-button" to="/salones">Ver salones</Link>
          </div>
        )}

        {turnos.map((t) => {
          const inactivo = ["cancelado", "rechazado"].includes(t.estado);
          const puedeCancelar = ["pendiente", "confirmado"].includes(t.estado);
          return (
            <article key={t.id} className={`turno-card${inactivo ? " is-cancelled" : ""}`}>
              <div>
                <h3>{t.salon_nombre}</h3>
                <p className="turno-meta">
                  {fechaLarga(t.fecha)} · {t.hora_inicio.slice(0, 5)} a {t.hora_fin.slice(0, 5)} h
                </p>

                {t.monto_total > 0 && (
                  <p className="turno-meta">
                    Total {pesos(t.monto_total)} · anticipo {t.anticipo_porcentaje}% ({pesos(t.monto_anticipo)}) ·{" "}
                    {ESTADOS_PAGO[t.estado_pago] ?? t.estado_pago} · depósito{" "}
                    {DEPOSITO[t.estado_deposito] ?? t.estado_deposito}
                  </p>
                )}

                {t.motivo_rechazo && (
                  <p className="turno-meta">Motivo del rechazo: {t.motivo_rechazo}</p>
                )}
                {t.comentario_deposito && (
                  <p className="turno-meta">Comentario del salón sobre el depósito: {t.comentario_deposito}</p>
                )}
              </div>
              <span className={`badge badge-${t.estado}`}>{ESTADOS[t.estado] ?? t.estado}</span>
              {puedeCancelar && (
                <button className="btn-danger" type="button"
                  disabled={cancelando === t.id} onClick={() => cancelar(t)}>
                  Cancelar
                </button>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}