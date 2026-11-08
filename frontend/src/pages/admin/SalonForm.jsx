import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { salonesApi } from "../../services/salonesApi";
import { normalizarWhatsapp } from "../../utils/whatsapp";
import { buscarCoordenadas } from "../../utils/ubicacion";

const VACIO = {
  nombre: "",
  descripcion: "",
  direccion: "",
  capacidad: "",
  precio_por_hora: "",
  servicios: "",
  imagenes: "",
  tipos_evento: [],
  whatsapp: "",
  latitud: "",
  longitud: "",
};

const aLista = (txt) => txt.split(",").map((x) => x.trim()).filter(Boolean);
const aNumero = (v) => Number(String(v).trim().replace(",", "."));

// Sirve para agregar un salón nuevo y para editar uno existente (/admin/salones/:id)
export default function SalonForm() {
  const { id } = useParams(); // undefined cuando es un salón nuevo
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [tipos, setTipos] = useState([]);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [ubicMsg, setUbicMsg] = useState({ texto: "", ok: false });

  useEffect(() => {
    salonesApi.tiposEvento().then(setTipos).catch(() => setTipos([]));
    if (id) {
      salonesApi
        .obtener(id)
        .then((s) =>
          setForm({
            nombre: s.nombre,
            descripcion: s.descripcion ?? "",
            direccion: s.direccion ?? "",
            capacidad: s.capacidad,
            precio_por_hora: s.precio_por_hora,
            servicios: (s.servicios ?? []).join(", "),
            imagenes: (s.imagenes ?? []).join(", "),
            tipos_evento: s.tipos_evento ?? [],
            whatsapp: s.whatsapp ?? "",
            latitud: s.latitud ?? "",
            longitud: s.longitud ?? "",
          })
        )
        .catch((e) => setError(e.message));
    }
  }, [id]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function alternarTipo(t) {
    setForm({
      ...form,
      tipos_evento: form.tipos_evento.includes(t)
        ? form.tipos_evento.filter((x) => x !== t)
        : [...form.tipos_evento, t],
    });
  }

  function agregarTipo() {
    const t = nuevoTipo.trim().toLowerCase();
    if (!t) return;
    if (!tipos.includes(t)) setTipos([...tipos, t]);
    if (!form.tipos_evento.includes(t)) {
      setForm({ ...form, tipos_evento: [...form.tipos_evento, t] });
    }
    setNuevoTipo("");
  }

  // Busca latitud y longitud a partir de la dirección escrita
  async function buscarUbicacion() {
    if (!form.direccion.trim()) {
      return setUbicMsg({ texto: "Primero escribí la dirección del salón.", ok: false });
    }
    setBuscando(true);
    setUbicMsg({ texto: "Buscando…", ok: true });
    try {
      const { latitud, longitud } = await buscarCoordenadas(form.direccion);
      setForm((f) => ({ ...f, latitud, longitud }));
      setUbicMsg({ texto: "Encontrada. Tocá “Ver en el mapa” para confirmar el punto.", ok: true });
    } catch (e) {
      setUbicMsg({ texto: e.message, ok: false });
    } finally {
      setBuscando(false);
    }
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");

    if (form.whatsapp && !normalizarWhatsapp(form.whatsapp)) {
      return setError("El WhatsApp debe tener 10 dígitos (código de área + número).");
    }

    // Ubicación: o están las dos, o ninguna
    const hayLat = String(form.latitud).trim() !== "";
    const hayLng = String(form.longitud).trim() !== "";
    let latitud = null;
    let longitud = null;
    if (hayLat !== hayLng) {
      return setError("Completá latitud y longitud, o dejá las dos vacías.");
    }
    if (hayLat && hayLng) {
      latitud = aNumero(form.latitud);
      longitud = aNumero(form.longitud);
      if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
        return setError("La latitud y la longitud tienen que ser números.");
      }
      if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
        return setError("La ubicación está fuera de rango. Revisá que latitud y longitud no estén cambiadas.");
      }
    }

    setEnviando(true);

    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      direccion: form.direccion.trim(),
      capacidad: Number(form.capacidad),
      precio_por_hora: Number(form.precio_por_hora),
      servicios: aLista(form.servicios),
      imagenes: aLista(form.imagenes),
      tipos_evento: form.tipos_evento,
      whatsapp: form.whatsapp ? form.whatsapp.trim() : null,
      latitud,
      longitud,
    };

    try {
      if (id) await salonesApi.actualizar(id, datos);
      else await salonesApi.crear(datos);
      navigate("/admin/salones");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const latNum = aNumero(form.latitud);
  const lngNum = aNumero(form.longitud);
  const hayPunto =
    String(form.latitud).trim() !== "" &&
    String(form.longitud).trim() !== "" &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum);

  return (
    <div className="auth">
      <div className="auth-card auth-card--ancha">
        <Link className="back-link" to="/admin/salones">← Volver a los salones</Link>
        <h2>{id ? "Editar salón" : "Agregar salón"}</h2>

        <form onSubmit={guardar}>
          <label>
            Nombre
            <input name="nombre" value={form.nombre} onChange={cambiar} required />
          </label>

          <label>
            Descripción
            <textarea name="descripcion" rows="4" value={form.descripcion} onChange={cambiar} />
          </label>

          <label>
            Dirección
            <input name="direccion" value={form.direccion} onChange={cambiar} required />
            <span className="ayuda">Incluí la ciudad y la provincia para que la ubicación se encuentre bien.</span>
          </label>

          <fieldset>
            <legend>Ubicación en el mapa (para “Cerca de mí”)</legend>
            <div className="ubic-fila">
              <label>
                Latitud
                <input
                  name="latitud"
                  value={form.latitud}
                  onChange={cambiar}
                  inputMode="decimal"
                  placeholder="-34.6037"
                />
              </label>
              <label>
                Longitud
                <input
                  name="longitud"
                  value={form.longitud}
                  onChange={cambiar}
                  inputMode="decimal"
                  placeholder="-58.3816"
                />
              </label>
            </div>
            <div className="ubic-acciones">
              <button className="btn-outline" type="button" onClick={buscarUbicacion} disabled={buscando}>
                {buscando ? "Buscando..." : "Buscar ubicación por dirección"}
              </button>
              {hayPunto && (
                <a
                  className="btn-outline"
                  href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en el mapa
                </a>
              )}
            </div>
            {ubicMsg.texto && (
              <p className={`form-msg${ubicMsg.ok ? " is-ok" : ""}`}>{ubicMsg.texto}</p>
            )}
          </fieldset>

          <label>
            WhatsApp del salón
            <input
              type="tel"
              name="whatsapp"
              value={form.whatsapp ?? ""}
              onChange={cambiar}
              placeholder="3875123456"
            />
            <small>Código de área y número, sin 0 ni 15.</small>
          </label>

          <label>
            Capacidad (personas)
            <input name="capacidad" type="number" min="1" value={form.capacidad} onChange={cambiar} required />
          </label>

          <label>
            Precio por hora
            <input name="precio_por_hora" type="number" min="0" value={form.precio_por_hora} onChange={cambiar} required />
          </label>

          <label>
            Servicios
            <input name="servicios" value={form.servicios} onChange={cambiar} placeholder="catering, sonido, estacionamiento" />
            <span className="ayuda">Separados por coma.</span>
          </label>

          <label>
            Imágenes
            <input name="imagenes" value={form.imagenes} onChange={cambiar} placeholder="https://..., https://..." />
            <span className="ayuda">Links de las fotos, separados por coma. La primera es la principal.</span>
          </label>

          <fieldset>
            <legend>Tipos de evento</legend>
            {tipos.map((t) => (
              <label key={t} className="chk">
                <input type="checkbox" checked={form.tipos_evento.includes(t)} onChange={() => alternarTipo(t)} />
                {t}
              </label>
            ))}
            <div className="nuevo-tipo">
              <input
                placeholder="Otro tipo de evento"
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
              />
              <button className="btn-outline" type="button" onClick={agregarTipo}>Agregar</button>
            </div>
          </fieldset>

          <p className="form-msg" role="alert">{error}</p>
          <button className="primary-button" type="submit" disabled={enviando}>
            {enviando ? "Guardando..." : "Guardar salón"}
          </button>
        </form>
      </div>
    </div>
  );
}