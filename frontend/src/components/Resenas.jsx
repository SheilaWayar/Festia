import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resenasApi } from "../services/resenasApi";
import { refrescarResumen } from "../hooks/useResumenResenas";
import Estrellas from "./Estrellas";

const POR_PAGINA = 3;
const MAX_COMENTARIO = 500;

const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

// Reseñas de un salón: promedio, lista de 3 por página y formulario corto.
// Pensado para ir dentro de la pestaña "Reseñas" de SalonModal (sin scroll).
export default function Resenas({ salonId }) {
  const { sesion, esAdmin } = useAuth();
  const logueado = Boolean(sesion);

  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0); // sube cada vez que hay que recargar
  const [lista, setLista] = useState({ key: null, data: null, error: "" });
  const [infoEstado, setInfoEstado] = useState({ key: null, data: null });

  const [formAbierto, setFormAbierto] = useState(false);
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  const keyLista = `${salonId}|${page}|${version}`;
  const keyEstado = logueado ? `${salonId}|${version}` : null;

  useEffect(() => {
    let activo = true;
    resenasApi
      .listar(salonId, { page, limit: POR_PAGINA })
      .then((data) => activo && setLista({ key: keyLista, data, error: "" }))
      .catch((e) =>
        activo &&
        setLista((prev) => ({
          key: keyLista,
          data: prev.data,
          error: e?.message || "No se pudieron cargar las reseñas",
        })),
      );
    return () => {
      activo = false;
    };
  }, [salonId, page, keyLista]);

  useEffect(() => {
    if (!keyEstado) return undefined;
    let activo = true;
    resenasApi
      .estado(salonId)
      .then((data) => activo && setInfoEstado({ key: keyEstado, data }))
      .catch(() => activo && setInfoEstado({ key: keyEstado, data: null }));
    return () => {
      activo = false;
    };
  }, [salonId, keyEstado]);

  const datos = lista.data;
  const cargando = lista.key !== keyLista;
  const errorLista = lista.key === keyLista ? lista.error : "";
  const estado = keyEstado && infoEstado.key === keyEstado ? infoEstado.data : null;
  const mia = estado?.mi_resena ?? null;

  function abrirFormulario() {
    setPuntaje(mia?.puntaje ?? 0);
    setComentario(mia?.comentario ?? "");
    setErrorForm("");
    setFormAbierto(true);
  }

  function recargar(volverAPrimera) {
    if (volverAPrimera) setPage(1);
    setVersion((v) => v + 1);
    refrescarResumen(); // actualiza las estrellas de las cards
  }

  async function enviar(e) {
    e.preventDefault();
    if (puntaje < 1) {
      setErrorForm("Elegí un puntaje de 1 a 5 estrellas");
      return;
    }
    setEnviando(true);
    setErrorForm("");
    try {
      const cuerpo = { puntaje, comentario: comentario.trim() || null };
      if (mia) await resenasApi.editarMia(salonId, cuerpo);
      else await resenasApi.crear(salonId, cuerpo);
      setFormAbierto(false);
      recargar(true);
    } catch (err) {
      setErrorForm(err?.message || "No se pudo guardar la reseña");
    } finally {
      setEnviando(false);
    }
  }

  async function borrar(r) {
    if (!window.confirm(`¿Borrar la reseña de ${r.nombre}?`)) return;
    try {
      await resenasApi.borrar(salonId, r.id);
      if (datos?.items.length === 1 && page > 1) setPage(page - 1);
      recargar(false);
    } catch (err) {
      window.alert(err?.message || "No se pudo borrar la reseña");
    }
  }

  // ---------- Formulario ----------
  if (formAbierto) {
    return (
      <form className="resenas resenas-form" onSubmit={enviar}>
        <h4>{mia ? "Editar mi reseña" : "Tu reseña"}</h4>

        <div className="resenas-form__estrellas" role="radiogroup" aria-label="Puntaje">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={puntaje === n}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              className={n <= puntaje ? "on" : ""}
              onClick={() => setPuntaje(n)}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          maxLength={MAX_COMENTARIO}
          placeholder="Contanos cómo fue tu experiencia (opcional)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
        <small className="resenas-form__contador">
          {comentario.length}/{MAX_COMENTARIO}
        </small>

        {errorForm && (
          <p className="resenas-error" role="alert">
            {errorForm}
          </p>
        )}

        <div className="resenas-form__acciones">
          <button
            className="btn-outline"
            type="button"
            disabled={enviando}
            onClick={() => setFormAbierto(false)}
          >
            Cancelar
          </button>
          <button className="primary-button" type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : mia ? "Guardar cambios" : "Publicar reseña"}
          </button>
        </div>
      </form>
    );
  }

  // ---------- Lista ----------
  return (
    <div className="resenas">
      <div className="resenas__resumen">
        {datos?.cantidad ? (
          <>
            <strong className="resenas__promedio">{datos.promedio.toFixed(1)}</strong>
            <Estrellas valor={datos.promedio} size={18} />
            <span>
              {datos.cantidad} {datos.cantidad === 1 ? "reseña" : "reseñas"}
            </span>
          </>
        ) : (
          <span>{datos ? "Todavía no hay reseñas" : "Cargando reseñas…"}</span>
        )}

        {!esAdmin && (
          <div className="resenas__cta">
            {!logueado && <Link className="text-button" to="/login">Iniciá sesión para dejar tu reseña</Link>}
            {estado?.puede_resenar && (
              <button className="primary-button" type="button" onClick={abrirFormulario}>
                Escribir reseña
              </button>
            )}
            {mia && (
              <button className="btn-outline" type="button" onClick={abrirFormulario}>
                Editar mi reseña
              </button>
            )}
          </div>
        )}
      </div>

      {!esAdmin && logueado && estado && !estado.puede_resenar && !mia && estado.motivo && (
        <p className="resenas__motivo">{estado.motivo}</p>
      )}

      {errorLista && <p className="resenas-error" role="alert">{errorLista}</p>}

      <ul className={`resenas__lista${cargando ? " cargando" : ""}`}>
        {datos?.items.map((r) => (
          <li className="resena" key={r.id}>
            <div className="resena__cabecera">
              <strong>{r.nombre}</strong>
              <Estrellas valor={r.puntaje} size={14} />
              <span className="resena__fecha">{fechaCorta(r.created_at)}</span>
              {esAdmin && (
                <button className="btn-danger resena__borrar" type="button" onClick={() => borrar(r)}>
                  Borrar
                </button>
              )}
            </div>
            {r.comentario && <p className="resena__texto">{r.comentario}</p>}
          </li>
        ))}
      </ul>

      {datos && datos.paginas > 1 && (
        <div className="resenas__paginas">
          <button
            className="btn-outline"
            type="button"
            disabled={page <= 1 || cargando}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {datos.page} de {datos.paginas}
          </span>
          <button
            className="btn-outline"
            type="button"
            disabled={page >= datos.paginas || cargando}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}