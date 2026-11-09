import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Estrellas from "../components/Estrellas";
import Icono from "../components/Icono";
import { categoriaDe, serviciosApi } from "../services/serviciosApi";
import { alFallarImagen } from "../utils/imagenes";
import { enlaceFacebook, enlaceInstagram, enlaceWhatsapp } from "../utils/contacto";

const pesos = (n) => `$${Number(n).toLocaleString("es-AR")}`;

export default function ServiciosCategoria() {
  const { categoria: valor } = useParams();
  const categoria = categoriaDe(valor);

  const [lista, setLista] = useState([]);
  const [resumenes, setResumenes] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!categoria) return;
    let vivo = true;
    Promise.all([
      serviciosApi.porCategoria(valor),
      serviciosApi.resumenes().catch(() => ({})), // si fallan las reseñas, igual se ven los proveedores
    ])
      .then(([filas, res]) => {
        if (!vivo) return;
        setLista(filas || []);
        setResumenes(res);
      })
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, [valor, categoria]);

  if (!categoria) {
    return (
      <section className="section">
        <p className="empty-state">Esa categoría no existe.</p>
        <Link className="back-link" to="/servicios">← Ver todas las categorías</Link>
      </section>
    );
  }

  // Los mejor puntuados primero
  const ordenados = [...lista].sort(
    (a, b) =>
      (resumenes[b.id]?.promedio ?? 0) - (resumenes[a.id]?.promedio ?? 0) ||
      a.nombre.localeCompare(b.nombre)
  );

  return (
    <section className="section">
      <Link className="back-link" to="/servicios">← Todas las categorías</Link>

      <div className="section-heading">
        <div>
          <span className="eyebrow">Servicios</span>
          <h2>{categoria.titulo}</h2>
        </div>
        <p>{categoria.descripcion}</p>
      </div>

      <div className="srv-grid">
        {cargando && <p className="empty-state">Cargando...</p>}
        {error && <p className="empty-state">No se pudieron cargar: {error}</p>}
        {!cargando && !error && ordenados.length === 0 && (
          <p className="empty-state">Todavía no hay proveedores en esta categoría.</p>
        )}

        {ordenados.map((s) => {
          const foto = s.imagenes?.[0];
          const resumen = resumenes[s.id];
          const detalle = `/servicios/${valor}/${s.id}`;
          const wa = enlaceWhatsapp(s.whatsapp, `Hola! Vi tu servicio "${s.nombre}" en Festia y quiero consultar.`);
          const ig = enlaceInstagram(s.instagram);
          const fb = enlaceFacebook(s.facebook);
          return (
            <article key={s.id} className="srv-card">
              <Link
                to={detalle}
                className="srv-foto-btn"
                style={{ display: "block" }}
                aria-label={`Ver detalle de ${s.nombre}`}
              >
                {foto ? (
                  <img className="srv-foto" src={foto} alt="" loading="lazy" onError={alFallarImagen} />
                ) : (
                  <div className="srv-foto srv-foto--vacio" aria-hidden="true">
                    {s.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>

              <div className="srv-cuerpo">
                <span className="srv-cat">{categoria.etiqueta}</span>
                <h3>{s.nombre}</h3>

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

                {s.zona && <p className="srv-meta">{s.zona}</p>}
                {s.descripcion && <p className="srv-desc">{s.descripcion}</p>}
                {s.precio_desde != null && (
                  <p className="srv-precio">Desde <strong>{pesos(s.precio_desde)}</strong></p>
                )}

                <div className="srv-acciones">
                  {wa && (
                    <a className="primary-button" href={wa} target="_blank" rel="noopener noreferrer">
                      Contactar
                    </a>
                  )}
                  {ig && (
                    <a className="btn-outline" href={ig} target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  )}
                  {fb && (
                    <a className="btn-outline" href={fb} target="_blank" rel="noopener noreferrer">
                      Facebook
                    </a>
                  )}
                </div>

                <Link className="text-button" to={detalle}>
                  Ver detalle y reseñas <Icono nombre="arrow" size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}