import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Estrellas from "./Estrellas";
import { usePerfil } from "../lib/usePerfil";
import { etiquetaCategoria, serviciosApi } from "../services/serviciosApi";
import { enlaceInstagram, enlaceWhatsapp } from "../utils/contacto";
import { alFallarImagen } from "../utils/imagenes";

const pesos = (n) => `$${Number(n).toLocaleString("es-AR")}`;
const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

// Ficha grande del proveedor: fotos, descripción, contacto y reseñas.
// Se cierra con la X, con Esc o haciendo clic fuera.
export default function ProveedorModal({ proveedor, resumen, onCerrar, onCambio }) {
  const { user, perfil } = usePerfil();
  const esAdmin = ["admin", "superadmin"].includes(perfil?.rol);

  const [foto, setFoto] = useState(0);
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorResenas, setErrorResenas] = useState("");
  const [version, setVersion] = useState(0); // al subirlo se vuelven a pedir las reseñas
  const [edit, setEdit] = useState({ puntaje: null, comentario: null });
  const [msg, setMsg] = useState({ texto: "", ok: false });
  const [enviando, setEnviando] = useState(false);

  const botonCerrar = useRef(null);
  const cerrarRef = useRef(onCerrar);
  useEffect(() => {
    cerrarRef.current = onCerrar;
  });

  useEffect(() => {
    const anterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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

  useEffect(() => {
    let vivo = true;
    serviciosApi
      .resenas(proveedor.id)
      .then((d) => {
        if (!vivo) return;
        setResenas(d || []);
        setErrorResenas("");
      })
      .catch((e) => vivo && setErrorResenas(e.message))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, [proveedor.id, version]);

  // Si la persona ya dejó una reseña, se muestra para editarla
  const mia = user ? resenas.find((r) => r.user_id === user.id) : null;
  const puntaje = edit.puntaje ?? mia?.puntaje ?? 0;
  const comentario = edit.comentario ?? mia?.comentario ?? "";

  const fotos = proveedor.imagenes?.length ? proveedor.imagenes : [];
  const wa = enlaceWhatsapp(
    proveedor.whatsapp,
    `Hola! Vi tu servicio "${proveedor.nombre}" en Festia y quiero consultar.`
  );
  const ig = enlaceInstagram(proveedor.instagram);

  const recargar = () => {
    setEdit({ puntaje: null, comentario: null });
    setVersion((v) => v + 1);
    onCambio?.();
  };

  async function enviar(e) {
    e.preventDefault();
    setMsg({ texto: "", ok: false });
    if (puntaje < 1) return setMsg({ texto: "Elegí de 1 a 5 estrellas.", ok: false });
    setEnviando(true);
    try {
      await serviciosApi.guardarResena(proveedor.id, puntaje, comentario.trim());
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

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-content prov-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prov-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={botonCerrar} className="btn-cerrar" type="button" aria-label="Cerrar" onClick={onCerrar}>
          &times;
        </button>

        <div className="prov-galeria">
          {fotos.length ? (
            <img className="prov-foto" src={fotos[foto]} alt={proveedor.nombre} onError={alFallarImagen} />
          ) : (
            <div className="prov-foto prov-foto--vacio" aria-hidden="true">
              {proveedor.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          {fotos.length > 1 && (
            <div className="prov-miniaturas">
              {fotos.map((src, i) => (
                <button key={src + i} type="button" className={i === foto ? "activa" : ""}
                  aria-label={`Ver foto ${i + 1}`} onClick={() => setFoto(i)}>
                  <img src={src} alt="" onError={alFallarImagen} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="prov-cuerpo">
          <span className="srv-cat">{etiquetaCategoria(proveedor.categoria)}</span>

          <div className="prov-titulo">
            <h3 id="prov-titulo">{proveedor.nombre}</h3>
            {resumen && (
              <span className="card-rating">
                <Estrellas valor={resumen.promedio} size={16} />
                <strong>{resumen.promedio.toFixed(1)}</strong>
                <span>({resumen.cantidad})</span>
              </span>
            )}
          </div>

          <div className="prov-datos">
            {proveedor.zona && <span>{proveedor.zona}</span>}
            {proveedor.precio_desde != null && (
              <span>Desde <strong>{pesos(proveedor.precio_desde)}</strong></span>
            )}
          </div>

          {proveedor.descripcion && <p className="prov-desc">{proveedor.descripcion}</p>}

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
          </div>

          <div className="prov-resenas">
            <h4>Reseñas</h4>

            {!user ? (
              <p className="ayuda">
                Iniciá sesión para dejar tu reseña.{" "}
                <Link className="link-olvide" to="/login">Ingresar</Link>
              </p>
            ) : (
              <form className="resenas-form" onSubmit={enviar}>
                <div className="resenas-form__estrellas" role="radiogroup" aria-label="Tu puntaje">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" className={n <= puntaje ? "on" : ""}
                      aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                      onClick={() => setEdit({ ...edit, puntaje: n })}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={comentario}
                  onChange={(e) => setEdit({ ...edit, comentario: e.target.value })}
                  placeholder="Contá cómo fue tu experiencia (opcional)"
                />
                <span className="resenas-form__contador">{comentario.length}/500</span>
                {msg.texto && <p className={`form-msg${msg.ok ? " is-ok" : ""}`}>{msg.texto}</p>}
                <div className="resenas-form__acciones">
                  <button className="primary-button" type="submit" disabled={enviando}>
                    {enviando ? "Enviando..." : mia ? "Actualizar mi reseña" : "Publicar reseña"}
                  </button>
                </div>
              </form>
            )}

            {errorResenas && <p className="resenas-error">{errorResenas}</p>}
            {cargando && <p className="ayuda">Cargando reseñas…</p>}
            {!cargando && !errorResenas && resenas.length === 0 && (
              <p className="ayuda">Todavía no hay reseñas. ¡Sé el primero!</p>
            )}

            <ul className="resenas__lista">
              {resenas.map((r) => (
                <li key={r.id} className="resena">
                  <div className="resena__cabecera">
                    <Estrellas valor={r.puntaje} size={13} />
                    <strong>{r.autor_nombre}</strong>
                    <span className="resena__fecha">{fechaCorta(r.created_at)}</span>
                    {(esAdmin || (user && r.user_id === user.id)) && (
                      <button type="button" className="btn-danger resena__borrar" onClick={() => borrar(r)}>
                        Borrar
                      </button>
                    )}
                  </div>
                  {r.comentario && <p className="resena__texto">{r.comentario}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}