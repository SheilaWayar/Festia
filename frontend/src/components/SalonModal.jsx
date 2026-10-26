import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icono from "./Icono";
import Estrellas from "./Estrellas";
import CalendarioSalon from "./CalendarioSalon";
import Resenas from "./Resenas";
import { useResumenResenas } from "../hooks/useResumenResenas";
import { alFallarImagen, fotoDe } from "../utils/imagenes";

// Tarjeta grande con la foto y toda la información del salón.
// Tiene dos pestañas (Información / Reseñas) para que no haga falta scroll.
// Se cierra con la X, con Esc o haciendo clic fuera de la tarjeta.
export default function SalonModal({ salon, onCerrar }) {
  const [foto, setFoto] = useState(0);
  const [pestana, setPestana] = useState("info"); // "info" | "resenas"
  const botonCerrar = useRef(null);
  const cerrarRef = useRef(onCerrar);
  const resumen = useResumenResenas(salon.id);

  // Mantiene siempre la última versión de onCerrar para el atajo de Esc
  useEffect(() => {
    cerrarRef.current = onCerrar;
  });

  useEffect(() => {
    const anterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // evita que se mueva la página de atrás
    botonCerrar.current?.focus();

    const alTeclear = (e) => {
      if (e.key === "Escape") cerrarRef.current();
    };
    document.addEventListener("keydown", alTeclear);

    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowAnterior;
      anterior?.focus?.();
    };
  }, []);

  const fotos = salon.imagenes?.length ? salon.imagenes : [fotoDe(salon, 0)];
  const enResenas = pestana === "resenas";

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className={`modal-content modal-salon${enResenas ? " modal-salon--resenas" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-salon-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={botonCerrar}
          className="btn-cerrar"
          type="button"
          aria-label="Cerrar"
          onClick={onCerrar}
        >
          &times;
        </button>

        <div className="modal-salon__galeria">
          <img className="modal-salon__foto" src={fotos[foto]} alt={salon.nombre} onError={alFallarImagen} />

          {fotos.length > 1 && (
            <div className="modal-salon__miniaturas">
              {fotos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={i === foto ? "activa" : ""}
                  aria-label={`Ver foto ${i + 1}`}
                  onClick={() => setFoto(i)}
                >
                  <img src={src} alt="" onError={alFallarImagen} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-salon__cuerpo">
          <div className="modal-salon__titulo-fila">
            <h3 id="modal-salon-titulo">{salon.nombre}</h3>
            {resumen && (
              <span className="card-rating">
                <Estrellas valor={resumen.promedio} size={15} />
                <strong>{resumen.promedio.toFixed(1)}</strong>
                <span>({resumen.cantidad})</span>
              </span>
            )}
          </div>

          <div className="modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!enResenas}
              className={!enResenas ? "activa" : ""}
              onClick={() => setPestana("info")}
            >
              Información
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={enResenas}
              className={enResenas ? "activa" : ""}
              onClick={() => setPestana("resenas")}
            >
              Reseñas{resumen ? ` (${resumen.cantidad})` : ""}
            </button>
          </div>

          <div className="modal-salon__contenido">
            {enResenas ? (
              <Resenas salonId={salon.id} />
            ) : (
              <div className="modal-salon__info">
                <div className="modal-salon__info-texto">
                  <p className="modal-salon__desc">
                    {salon.descripcion ?? "Sin descripción disponible."}
                  </p>

                  <div className="amenities">
                    <span><Icono nombre="users" /> Hasta {salon.capacidad} invitados</span>
                    {salon.tipos_evento?.length > 0 && (
                      <span><Icono nombre="tag" /> {salon.tipos_evento.join(", ")}</span>
                    )}
                    {salon.servicios?.map((s) => (
                      <span key={s}><Icono nombre="sparkle" /> {s}</span>
                    ))}
                  </div>

                  {salon.direccion && (
                    <p className="detalle-direccion">Dirección: {salon.direccion}</p>
                  )}
                </div>

                <div className="modal-salon__calendario">
                  <span className="modal-salon__calendario-titulo">Disponibilidad</span>
                  <div className="cal-en-card" aria-label={`Disponibilidad de ${salon.nombre}`}>
                    <CalendarioSalon salonId={salon.id} inline />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-salon__pie">
            <div className="modal-salon__precio">
              <span>Precio</span>
              <strong>${salon.precio_por_hora?.toLocaleString("es-AR")}</strong>
              <small>por hora</small>
            </div>
            <div className="modal-salon__acciones">
              <Link className="btn-outline" to={`/salones/${salon.id}`}>
                Ver detalle completo
              </Link>
              <Link className="primary-button" to={`/salones/${salon.id}/reservar`}>
                Reservar <Icono nombre="arrow" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}