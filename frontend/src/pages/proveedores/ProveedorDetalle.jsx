import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Estrellas from "../../components/Estrellas";
import { usePerfil } from "../../lib/usePerfil";
import { categoriaDe, serviciosApi } from "../../services/serviciosApi";
import { enlaceFacebook, enlaceInstagram, enlaceWhatsapp } from "../../utils/contacto";
import { alFallarImagen } from "../../utils/imagenes";
import "./ProveedorDetalle.css";

const pesos = (n) => `$${Number(n).toLocaleString("es-AR")}`;
const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

// El `key` hace que, al cambiar de proveedor, React arme el estado desde cero:
// por eso el detalle no necesita "resetear" nada dentro de un efecto.
export default function ProveedorDetalle() {
  const { categoria, id } = useParams();
  return <DetalleProveedor key={`${categoria}/${id}`} valor={categoria} id={id} />;
}

function DetalleProveedor({ valor, id }) {
  const categoria = categoriaDe(valor);
  const { user, perfil } = usePerfil();
  const esAdmin = ["admin", "superadmin"].includes(perfil?.rol);

  const [proveedor, setProveedor] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [cargandoProv, setCargandoProv] = useState(true);
  const [errorProv, setErrorProv] = useState("");
  const [foto, setFoto] = useState(0);

  const [resenas, setResenas] = useState([]);
  const [cargandoRes, setCargandoRes] = useState(true);
  const [errorResenas, setErrorResenas] = useState("");
  const [version, setVersion] = useState(0); // al subirlo se vuelven a pedir reseñas y resumen
  const [edit, setEdit] = useState({ puntaje: null, comentario: null });
  const [msg, setMsg] = useState({ texto: "", ok: false });
  const [enviando, setEnviando] = useState(false);

  // Proveedor
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!categoria) return;
    let vivo = true;

    serviciosApi
      .porId(id)
      .then((p) => {
        if (!vivo) return;
        if (!p) setErrorProv("No encontramos este proveedor.");
        setProveedor(p);
      })
      .catch((e) => vivo && setErrorProv(e.message))
      .finally(() => vivo && setCargandoProv(false));

    return () => { vivo = false; };
  }, [id, categoria]);

  // Reseñas + resumen (se repiten al publicar o borrar)
  useEffect(() => {
    if (!categoria) return;
    let vivo = true;

    serviciosApi
      .resenas(id)
      .then((d) => {
        if (!vivo) return;
        setResenas(d || []);
        setErrorResenas("");
      })
      .catch((e) => vivo && setErrorResenas(e.message))
      .finally(() => vivo && setCargandoRes(false));

    serviciosApi
      .resumenes()
      .then((r) => vivo && setResumen(r[id] || null))
      .catch(() => {});

    return () => { vivo = false; };
  }, [id, categoria, version]);

  // Si la persona ya dejó una reseña, se muestra para editarla
  const mia = user ? resenas.find((r) => r.user_id === user.id) : null;
  const puntaje = edit.puntaje ?? mia?.puntaje ?? 0;
  const comentario = edit.comentario ?? mia?.comentario ?? "";

  const recargar = () => {
    setEdit({ puntaje: null, comentario: null });
    setVersion((v) => v + 1);
  };

  async function enviar(e) {
    e.preventDefault();
    setMsg({ texto: "", ok: false });
    if (puntaje < 1) return setMsg({ texto: "Elegí de 1 a 5 estrellas.", ok: false });
    setEnviando(true);
    try {
      await serviciosApi.guardarResena(id, puntaje, comentario.trim());
      recargar();
      setMsg({ texto: mia ? "Reseña actualizada." : "¡Gracias por tu reseña!", ok: true });
    } catch (err) {
      setMsg({ texto: err.message, ok: false });
    } finally {
      setEnviando(false);
    }
  }

  async function borrar(r) {
    if (!window.confirm("¿Borrar esta reseña?")) return;
    setMsg({ texto: "", ok: false });
    try {
      await serviciosApi.borrarResena(r.id);
      recargar();
    } catch (err) {
      setMsg({ texto: err.message, ok: false });
    }
  }

  if (!categoria) {
    return (
      <section className="section">
        <p className="empty-state">Esa categoría no existe.</p>
        <Link className="back-link" to="/servicios">← Ver todas las categorías</Link>
      </section>
    );
  }

  if (cargandoProv) {
    return (
      <section className="section">
        <p className="empty-state">Cargando...</p>
      </section>
    );
  }

  if (errorProv || !proveedor) {
    return (
      <section className="section">
        <Link className="back-link" to={`/servicios/${valor}`}>← Volver a {categoria.titulo}</Link>
        <p className="empty-state">{errorProv || "Proveedor no encontrado."}</p>
      </section>
    );
  }

  const fotos = proveedor.imagenes?.length ? proveedor.imagenes : [];
  const wa = enlaceWhatsapp(
    proveedor.whatsapp,
    `Hola! Vi tu servicio "${proveedor.nombre}" en Festia y quiero consultar.`
  );
  const ig = enlaceInstagram(proveedor.instagram);
  const fb = enlaceFacebook(proveedor.facebook);

  return (
    <section className="section">
      <Link className="back-link" to={`/servicios/${valor}`}>← Volver a {categoria.titulo}</Link>

      <div className="pd-layout">
        <div className="pd-galeria">
          {fotos.length ? (
            <img className="pd-foto" src={fotos[foto]} alt={proveedor.nombre} onError={alFallarImagen} />
          ) : (
            <div className="pd-foto pd-foto--vacio" aria-hidden="true">
              {proveedor.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          {fotos.length > 1 && (
            <div className="pd-miniaturas">
              {fotos.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={i === foto ? "activa" : ""}
                  aria-label={`Ver foto ${i + 1}`}
                  onClick={() => setFoto(i)}
                >
                  <img src={src} alt="" loading="lazy" onError={alFallarImagen} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          <span className="srv-cat">{categoria.etiqueta}</span>
          <h1>{proveedor.nombre}</h1>

          <div className="card-rating">
            {resumen ? (
              <>
                <Estrellas valor={resumen.promedio} size={18} />
                <strong>{resumen.promedio.toFixed(1)}</strong>
                <span>({resumen.cantidad})</span>
              </>
            ) : (
              <span>Sin reseñas todavía</span>
            )}
          </div>

          <div className="pd-datos">
            {proveedor.zona && <span>{proveedor.zona}</span>}
            {proveedor.precio_desde != null && (
              <span>Desde <strong>{pesos(proveedor.precio_desde)}</strong></span>
            )}
          </div>

          {proveedor.descripcion && <p className="pd-desc">{proveedor.descripcion}</p>}

          <div className="srv-acciones">
            {wa && (
              <a className="primary-button" href={wa} target="_blank" rel="noopener noreferrer">
                Contactar por WhatsApp
              </a>
            )}
            {ig && (
              <a className="btn-outline" href={ig} target="_blank" rel="noopener noreferrer">
                Ver Instagram
              </a>
            )}
            {fb && (
              <a className="btn-outline" href={fb} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="pd-resenas">
        <h2>Reseñas</h2>

        {!user ? (
          <p className="ayuda">
            Iniciá sesión para dejar tu reseña.{" "}
            <Link className="link-olvide" to="/login">Ingresar</Link>
          </p>
        ) : (
          <form className="pd-form" onSubmit={enviar}>
            <div className="pd-estrellas" role="radiogroup" aria-label="Tu puntaje">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n <= puntaje ? "on" : ""}
                  aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                  onClick={() => setEdit({ ...edit, puntaje: n })}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={comentario}
              onChange={(e) => setEdit({ ...edit, comentario: e.target.value })}
              placeholder="Contá cómo fue tu experiencia (opcional)"
            />
            <span className="pd-contador">{comentario.length}/500</span>
            {msg.texto && <p className={`form-msg${msg.ok ? " is-ok" : ""}`}>{msg.texto}</p>}
            <div className="pd-form-acciones">
              <button className="primary-button" type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : mia ? "Actualizar mi reseña" : "Publicar reseña"}
              </button>
            </div>
          </form>
        )}

        {errorResenas && <p className="pd-error">{errorResenas}</p>}
        {cargandoRes && <p className="ayuda">Cargando reseñas…</p>}
        {!cargandoRes && !errorResenas && resenas.length === 0 && (
          <p className="ayuda">Todavía no hay reseñas. ¡Sé el primero!</p>
        )}

        <ul className="pd-lista">
          {resenas.map((r) => (
            <li key={r.id} className="pd-resena">
              <div className="pd-resena-cab">
                <Estrellas valor={r.puntaje} size={13} />
                <strong>{r.autor_nombre}</strong>
                <span className="pd-resena-fecha">{fechaCorta(r.created_at)}</span>
                {(esAdmin || (user && r.user_id === user.id)) && (
                  <button type="button" className="btn-danger pd-borrar" onClick={() => borrar(r)}>
                    Borrar
                  </button>
                )}
              </div>
              {r.comentario && <p className="pd-resena-texto">{r.comentario}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}