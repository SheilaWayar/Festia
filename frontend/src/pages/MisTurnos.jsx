import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { turnosApi } from "../services/turnosApi";

const ESTADOS = { confirmado: "Confirmado", pendiente: "Pendiente", cancelado: "Cancelado" };

const fechaLarga = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

export default function MisTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", ok: false });
  const [cancelando, setCancelando] = useState(null);

  function cargar() {
    setCargando(true);
    setError(null);
    turnosApi.mios().then(setTurnos).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, []);

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
            <button className="btn-outline" type="button" onClick={cargar}>Reintentar</button>
          </div>
        )}

        {!cargando && !error && turnos.length === 0 && (
          <div className="state-box">
            <p>Todavía no tenés turnos reservados.</p>
            <Link className="primary-button" to="/salones">Ver salones</Link>
          </div>
        )}

        {turnos.map((t) => {
          const cancelado = t.estado === "cancelado";
          return (
            <article key={t.id} className={`turno-card${cancelado ? " is-cancelled" : ""}`}>
              <div>
                <h3>{t.salon_nombre}</h3>
                <p className="turno-meta">
                  {fechaLarga(t.fecha)} · {t.hora_inicio.slice(0, 5)} a {t.hora_fin.slice(0, 5)} h
                </p>
              </div>
              <span className={`badge badge-${t.estado}`}>{ESTADOS[t.estado] ?? t.estado}</span>
              {!cancelado && (
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
