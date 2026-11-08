import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import BuscadorSalones from "../components/BuscadorSalones";
import SalonCard from "../components/SalonCard";
import SalonModal from "../components/SalonModal";
import NovedadesSalones from "../components/NovedadesSalones";
import Contacto from "../components/Contacto";
import Icono from "../components/Icono";
import Carrusel from "../components/Carrusel";
import { useSalones } from "../hooks/useSalones";
import { HERO } from "../utils/imagenes";
import { distanciaKm, obtenerMiUbicacion } from "../utils/ubicacion";

// Normaliza las imágenes de un salón a una lista de URLs
const urlsDe = (s) =>
  (Array.isArray(s.imagenes) ? s.imagenes : [])
    .map((x) => (typeof x === "string" ? x : x?.url))
    .filter(Boolean);

function IconoUbicacion({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function Salones() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const [seleccionado, setSeleccionado] = useState(null); // salón abierto en la tarjeta grande
  const cerrar = useCallback(() => setSeleccionado(null), []);

  // Ubicación de la persona (solo se pide cuando toca "Cerca de mí")
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [ubicando, setUbicando] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState("");

  const filtros = {
    tipo_evento: params.get("tipo_evento") ?? "",
    capacidad_min: params.get("capacidad_min") ?? "",
    q: params.get("q") ?? "",
  };
  const { salones, cargando, error } = useSalones(filtros);
  const hayFiltros = Object.values(filtros).some(Boolean);

  const orden = params.get("orden"); // "recientes" | "cerca" | null
  const recientes = orden === "recientes";
  const ordenarPorCerca = orden === "cerca" && Boolean(miUbicacion);

  // A cada salón le agregamos la distancia (si tiene coordenadas y conocemos la ubicación)
  const conDistancia = salones.map((s) => {
    const lat = Number(s.latitud);
    const lng = Number(s.longitud);
    const tieneUbicacion =
      s.latitud != null && s.longitud != null && Number.isFinite(lat) && Number.isFinite(lng);
    return {
      ...s,
      distanciaKm: miUbicacion && tieneUbicacion ? distanciaKm(miUbicacion, { lat, lng }) : null,
    };
  });

  let lista = conDistancia;
  if (ordenarPorCerca) {
    // Los salones sin coordenadas quedan al final
    lista = [...conDistancia].sort((a, b) => {
      if (a.distanciaKm == null && b.distanciaKm == null) return 0;
      if (a.distanciaKm == null) return 1;
      if (b.distanciaKm == null) return -1;
      return a.distanciaKm - b.distanciaKm;
    });
  } else if (recientes) {
    // Más recientes: los salones cargados después tienen id mayor
    lista = [...conDistancia].sort((a, b) => b.id - a.id);
  }
  const hayImprecisos = ordenarPorCerca && conDistancia.some((s) => s.distanciaKm == null);

  const cambiarOrden = (valor) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (valor) n.set("orden", valor);
        else n.delete("orden");
        return n;
      },
      { replace: true }
    );

  const alternarRecientes = () => cambiarOrden(recientes ? null : "recientes");

  async function alternarCerca() {
    if (ordenarPorCerca) return cambiarOrden(null);
    setErrorUbicacion("");
    if (!miUbicacion) {
      setUbicando(true);
      try {
        setMiUbicacion(await obtenerMiUbicacion());
      } catch (e) {
        setErrorUbicacion(e.message);
        setUbicando(false);
        return;
      }
      setUbicando(false);
    }
    cambiarOrden("cerca");
    // Como el botón está arriba y las tarjetas abajo, bajamos para que se vea el resultado
    setTimeout(() => {
      document.getElementById("salones")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }

  // Carrusel: la primera foto de cada salón destacado, en el orden elegido.
  // Si no hay ninguno destacado, se usan las fotos de los salones como antes.
  const destacados = salones
    .filter((s) => s.destacado)
    .sort((a, b) => (a.orden_destacado ?? 0) - (b.orden_destacado ?? 0));

  const deDestacados = destacados.map((s) => urlsDe(s)[0]).filter(Boolean);
  const deSalones = salones.flatMap(urlsDe);

  const fotos = deDestacados.length
    ? [...new Set(deDestacados)].slice(0, 8)
    : [...new Set([...deSalones, HERO])].slice(0, 6);

  // Para que "Contacto" del menú lleve a la sección aunque se venga de otra pantalla
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash, cargando]);

  return (
    <>
      <section className="hero" id="inicio">
        <Carrusel
          imagenes={fotos}
          alt="Salón preparado para una celebración"
        />
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

      {/* "Cerca de mí" va justo debajo de los filtros */}
      <div className="cerca-wrap">
        <div className={`cerca-panel${ordenarPorCerca ? " activo" : ""}`}>
          <div className="cerca-panel__icono">
            <IconoUbicacion />
          </div>
          <div className="cerca-panel__texto">
            <strong>
              {ordenarPorCerca
                ? "Mostrando los salones más cercanos a vos"
                : "Encontrá salones cerca de vos"}
            </strong>
            <span>
              {ordenarPorCerca
                ? "Ordenados del más cercano al más lejano."
                : "Activá tu ubicación y te mostramos primero los que te quedan más cerca."}
            </span>
          </div>
          <button
            type="button"
            className="cerca-panel__boton"
            aria-pressed={ordenarPorCerca}
            disabled={ubicando}
            onClick={alternarCerca}
          >
            {ubicando ? "Buscando..." : ordenarPorCerca ? "Quitar orden" : "Cerca de mí"}
          </button>
        </div>
        {errorUbicacion && <p className="form-msg orden-aviso">{errorUbicacion}</p>}
      </div>

      {!hayFiltros && !cargando && !error && (
        <NovedadesSalones salones={salones} onAbrir={setSeleccionado} />
      )}

      <section className="section venues-section" id="salones">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Nuestra selección</span>
            <h2>Espacios con <em>alma propia</em></h2>
          </div>
          <p>Cada salón ha sido elegido por su belleza, servicio excepcional y capacidad para crear momentos únicos.</p>
        </div>

        {hayImprecisos && (
          <p className="ayuda orden-aviso">
            Algunos salones todavía no tienen su ubicación cargada y aparecen al final.
          </p>
        )}

        <div className="orden-bar">
          <button
            type="button"
            className="btn-outline"
            aria-pressed={recientes}
            onClick={alternarRecientes}
          >
            Más recientes
          </button>
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
          {lista.map((s) => (
            <SalonCard key={s.id} salon={s} onAbrir={setSeleccionado} />
          ))}
        </div>
      </section>

      <Contacto />

      {seleccionado && <SalonModal salon={seleccionado} onCerrar={cerrar} />}
    </>
  );
}