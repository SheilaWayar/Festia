import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { turnosApi } from "../../services/turnosApi";

const ESTADOS = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  finalizado: "Finalizado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};

export default function HistorialSalon() {
  const { id } = useParams();
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    turnosApi.historialSalon(id).then(setTurnos)
      .catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, [id]);

  const nombreSalon = turnos[0]?.salon_nombre;

  return (
    <>
      <header className="page-head">
        <span className="eyebrow"><span></span> Administración</span>
        <h2>Historial {nombreSalon ? <>de <em>{nombreSalon}</em></> : "del salón"}</h2>
      </header>

      <p><Link className="btn-outline" to="/admin/turnos">Volver a turnos</Link></p>

      <section className="turnos-list" aria-live="polite">
        {cargando && <div className="state-box"><p>Cargando historial...</p></div>}
        {error && <div className="state-box"><p>{error}</p></div>}
        {!cargando && !error && turnos.length === 0 && (
          <div className="state-box"><p>Este salón todavía no tiene reservas.</p></div>
        )}

        {turnos.map((t) => {
          const quien = t.usuario_nombre || t.usuario_email || "Usuario sin datos";
          const fecha = t.fecha ?? t.fecha_inicio?.slice(0, 10);
          const desde = t.hora_inicio?.slice(0, 5) ?? t.fecha_inicio?.slice(11, 16);
          const hasta = t.hora_fin?.slice(0, 5) ?? t.fecha_fin?.slice(11, 16);
          return (
            <article
              key={t.id}
              className={`turno-card${["cancelado", "rechazado"].includes(t.estado) ? " is-cancelled" : ""}`}
            >
              <div>
                <h3>{quien}</h3>
                <p className="turno-meta">
                  {fecha} · {desde} a {hasta} h{t.usuario_nombre && t.usuario_email ? ` · ${t.usuario_email}` : ""}
                </p>
                {t.monto_total > 0 && (
                  <p className="turno-meta">Total ${Number(t.monto_total).toLocaleString("es-AR")}</p>
                )}
              </div>
              <span className={`badge badge-${t.estado}`}>{ESTADOS[t.estado] ?? t.estado}</span>
            </article>
          );
        })}
      </section>
    </>
  );
} 