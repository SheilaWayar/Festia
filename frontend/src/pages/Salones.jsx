import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import BuscadorSalones from "../components/BuscadorSalones";
import SalonCard from "../components/SalonCard";
import SalonModal from "../components/SalonModal";
import Contacto from "../components/Contacto";
import Icono from "../components/Icono";
import { useSalones } from "../hooks/useSalones";
import { HERO } from "../utils/imagenes";

export default function Salones() {
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const [seleccionado, setSeleccionado] = useState(null); // salón abierto en la tarjeta grande
  const cerrar = useCallback(() => setSeleccionado(null), []);

  const filtros = {
    tipo_evento: params.get("tipo_evento") ?? "",
    capacidad_min: params.get("capacidad_min") ?? "",
    q: params.get("q") ?? "",
  };
  const { salones, cargando, error } = useSalones(filtros);
  const hayFiltros = Object.values(filtros).some(Boolean);

  // Para que "Contacto" del menú lleve a la sección aunque se venga de otra pantalla
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash, cargando]);

  return (
    <>
      <section className="hero" id="inicio">
        <img src={HERO} alt="Salón elegante preparado para una celebración" />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="eyebrow light">Espacios extraordinarios</span>
          <h1>Encuentra el salón perfecto <em>para tu evento</em></h1>
          <p>Lugares singulares, seleccionados para convertir cada celebración en un recuerdo inolvidable.</p>
          <a className="primary-button" href="#salones">
            Reservar ahora <Icono nombre="arrow" size={18} />
          </a>
        </div>
      </section>

      <BuscadorSalones />

      <section className="section venues-section" id="salones">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Nuestra selección</span>
            <h2>Espacios con <em>alma propia</em></h2>
          </div>
          <p>Cada salón ha sido elegido por su belleza, servicio excepcional y capacidad para crear momentos únicos.</p>
        </div>

        <div className="venue-grid">
          {cargando && <p className="empty-state">Cargando salones...</p>}
          {error && <p className="empty-state">Error al cargar los salones: {error}</p>}
          {!cargando && !error && salones.length === 0 && (
            <p className="empty-state">
              {hayFiltros
                ? "No hay salones para ese evento."
                : "Todavía no hay salones cargados."}
            </p>
          )}
          {salones.map((s) => (
            <SalonCard key={s.id} salon={s} onAbrir={setSeleccionado} />
          ))}
        </div>
      </section>

      <Contacto />

      {seleccionado && <SalonModal salon={seleccionado} onCerrar={cerrar} />}
    </>
  );
}
