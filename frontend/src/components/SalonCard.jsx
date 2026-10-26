import { Link } from "react-router-dom";
import Icono from "./Icono";
import CalendarioSalon from "./CalendarioSalon";
import Estrellas from "./Estrellas";
import { useResumenResenas } from "../hooks/useResumenResenas";
import { alFallarImagen, fotoDe } from "../utils/imagenes";

// Toda la tarjeta es clickeable: el botón del título se estira sobre ella (ver .card-abrir en App.css).
export default function SalonCard({ salon, onAbrir }) {
  const nombre = salon.nombre ?? "Salón sin nombre";
  const resumen = useResumenResenas(salon.id);

  return (
    <article className="venue-card">
      <div className="card-image">
        <img src={fotoDe(salon, 0)} alt="" loading="lazy" onError={alFallarImagen} />
        <button className="heart-button" type="button" aria-label={`Guardar ${nombre}`}>
          <Icono nombre="heart" size={18} />
        </button>
      </div>

      <div className="card-body">
        <div className="card-title-row">
          <h3>
            <button
              className="card-abrir"
              type="button"
              aria-haspopup="dialog"
              onClick={() => onAbrir(salon)}
            >
              {nombre}
            </button>
          </h3>
        </div>

        <div className="card-rating">
          {resumen ? (
            <>
              <Estrellas valor={resumen.promedio} size={15} />
              <strong>{resumen.promedio.toFixed(1)}</strong>
              <span>({resumen.cantidad})</span>
            </>
          ) : (
            <span>Sin reseñas todavía</span>
          )}
        </div>

        <p>{salon.descripcion ?? "Sin descripción disponible."}</p>

        <div className="card-meta">
          <span><Icono nombre="users" size={16} /> Hasta {salon.capacidad ?? "N/A"}</span>
          {salon.precio_por_hora != null && (
            <strong>${salon.precio_por_hora.toLocaleString("es-AR")} / hora</strong>
          )}
        </div>

        <div className="cal-en-card" aria-label={`Disponibilidad de ${nombre}`}>
          <CalendarioSalon salonId={salon.id} inline />
        </div>

        <Link className="text-button" to={`/salones/${salon.id}/reservar`}>
          Reservar <Icono nombre="arrow" size={17} />
        </Link>
      </div>
    </article>
  );
}