import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icono from "../components/Icono";
import { CATEGORIAS, serviciosApi } from "../services/serviciosApi";
import QuieroOfrecerServicios from "../components/QuieroOfrecerServicios";

// Foto de la categoría: primero /categorias/<categoria>.jpg (o .png), después la foto de
// un proveedor de esa categoría y, si no hay ninguna, un fondo verde con degradé.
function PortadaCategoria({ valor, foto }) {
  const candidatos = [`/categorias/${valor}.jpg`, `/categorias/${valor}.png`, foto].filter(Boolean);
  const [i, setI] = useState(0);
  if (i >= candidatos.length) return <div className="cat-card__vacio" aria-hidden="true" />;
  return <img src={candidatos[i]} alt="" loading="lazy" onError={() => setI(i + 1)} />;
}

export default function Servicios() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    serviciosApi
      .activos()
      .then((d) => vivo && setLista(d || []))
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, []);

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Todo para tu evento</span>
          <h2>Servicios <em>para tu celebración</em></h2>
        </div>
        <p>
          Elegí una categoría y conocé a los profesionales recomendados: fotos, sonido, catering
          y planeadores para completar tu evento.
        </p>
      </div>

      {error && <p className="empty-state">No se pudieron cargar los servicios: {error}</p>}

      <div className="cat-grid">
        {CATEGORIAS.map((c) => {
          const delGrupo = lista.filter((s) => s.categoria === c.valor);
          const foto = delGrupo.find((s) => s.imagenes?.[0])?.imagenes[0];
          const n = delGrupo.length;
          return (
            <Link key={c.valor} className="cat-card" to={`/servicios/${c.valor}`}>
              <PortadaCategoria valor={c.valor} foto={foto} />
              <div className="cat-card__velo" />
              <div className="cat-card__texto">
                {!cargando && !error && (
                  <span className="cat-card__cantidad">
                    {n} {n === 1 ? "proveedor" : "proveedores"}
                  </span>
                )}
                <h3>{c.titulo}</h3>
                <p>{c.descripcion}</p>
                <span className="cat-card__cta">
                  {c.cta} <Icono nombre="arrow" size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <QuieroOfrecerServicios />
    </section>
  );
}