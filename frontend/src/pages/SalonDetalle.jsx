import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import GaleriaSalon from "../components/GaleriaSalon";
import Icono from "../components/Icono";
import { salonesApi } from "../services/salonesApi";

export default function SalonDetalle() {
  const { id } = useParams();
  const [salon, setSalon] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSalon(null);
    setError(null);
    salonesApi.obtener(id).then(setSalon).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <section className="detail-section">
        <div className="state-box">
          <p>{error}</p>
          <Link className="btn-outline" to="/salones">Volver a los salones</Link>
        </div>
      </section>
    );
  }
  if (!salon) {
    return <section className="detail-section"><p className="empty-state">Cargando salón...</p></section>;
  }

  return (
    <section className="detail-section">
      <Link className="back-link" to="/salones">← Volver a los salones</Link>

      <GaleriaSalon salon={salon} />

      <div className="detail-content">
        <div className="detail-copy">
          <span className="eyebrow"><span></span> Espacio destacado</span>
          <h2>{salon.nombre}</h2>
          <p>{salon.descripcion ?? "Sin descripción disponible."}</p>

          <div className="amenities">
            <span><Icono nombre="users" /> Hasta {salon.capacidad} invitados</span>
            {salon.tipos_evento?.length > 0 && (
              <span><Icono nombre="tag" /> {salon.tipos_evento.join(", ")}</span>
            )}
            {salon.servicios?.map((s) => (
              <span key={s}><Icono nombre="sparkle" /> {s}</span>
            ))}
          </div>

          {salon.direccion && <p className="detalle-direccion">Dirección: {salon.direccion}</p>}
        </div>

        <aside className="booking-card">
          <span>Precio</span>
          <strong>${salon.precio_por_hora?.toLocaleString("es-AR")}</strong>
          <small>por hora</small>
          <hr />
          <div><span>Capacidad</span><b>Hasta {salon.capacidad}</b></div>
          <Link className="primary-button" to={`/salones/${salon.id}/reservar`}>Reservar</Link>
          <small>Sin compromiso · Respuesta en 24 h</small>
        </aside>
      </div>
    </section>
  );
}