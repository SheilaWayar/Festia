import { Link } from "react-router-dom";
import Icono from "./Icono";
import Estrellas from "./Estrellas";
import RedesSociales from "./RedesSociales";
import { useResumenResenas } from "../hooks/useResumenResenas";
import { alFallarImagen, fotoDe } from "../utils/imagenes";
import { formatearDistancia } from "../utils/ubicacion";

// Toda la tarjeta es clickeable: el botón del título se estira sobre ella (ver .card-abrir en App.css).
// El calendario de disponibilidad se ve solo al abrir el salón (SalonModal).
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

        {salon.distanciaKm != null && (
          <p className="card-distancia">Ubicado {formatearDistancia(salon.distanciaKm)} de vos</p>
        )}

        <p>{salon.descripcion ?? "Sin descripción disponible."}</p>

        <div className="card-meta">
          <span><Icono nombre="users" size={16} /> Hasta {salon.capacidad ?? "N/A"}</span>
          {salon.precio_por_hora != null && (
            <strong>${salon.precio_por_hora.toLocaleString("es-AR")} / hora</strong>
          )}
        </div>

        <RedesSociales salon={salon} className="redes--card" />

        <Link className="text-button" to={`/salones/${salon.id}/reservar`}>
          Reservar <Icono nombre="arrow" size={17} />
        </Link>
      </div>
    </article>
  );
}